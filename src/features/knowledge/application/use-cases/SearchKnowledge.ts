import type { IKnowledgeRepository, SemanticSearchHit, SemanticSearchResult } from "../../domain/repositories/IKnowledgeRepository";
import { getVectorStore } from "@/server/lib/ai/vectorStore";
import { buildSnippet } from "../lib/chunking";
import type { AiClient } from "@/server/lib/ai/client";

export interface SearchKnowledgeInput {
  workspaceId: string;
  query: string;
  topK?: number;
  /** Weight for semantic vs keyword results (0..1). */
  semanticWeight?: number;
  /** Optional category/tag filters forwarded to keyword search. */
  filters?: { categoryId?: string; tag?: string };
}

export interface RankedResult {
  resource: {
    id: string;
    title: string;
    summary: string | null;
    tags: string[];
    categoryId: string | null;
    isPremium: boolean;
    fileType: string;
  };
  score: number;
  snippet: string;
  source: "semantic" | "keyword" | "hybrid";
}

/**
 * Use case: hybrid knowledge search combining semantic (vector) retrieval with
 * keyword (Postgres ILIKE) search. Results are fused via reciprocal-rank fusion
 * and reranked, then contextualized snippets are attached.
 */
export class SearchKnowledge {
  constructor(
    private readonly repo: IKnowledgeRepository,
    private readonly ai: AiClient
  ) {}

  async semantic(input: SearchKnowledgeInput): Promise<SemanticSearchResult> {
    const topK = input.topK ?? 6;
    const embed = await this.ai.embedder.embed([input.query]);
    if (!embed.ok || !embed.data?.[0]) {
      return { query: input.query, hits: [] };
    }
    const results = await getVectorStore().query(embed.data[0], {
      topK,
      filter: { workspaceId: input.workspaceId },
    });
    const hits: SemanticSearchHit[] = [];
    for (const r of results) {
      const chunkId = String(r.metadata.chunkId ?? r.id);
      const chunk = await this.repo.getChunk(chunkId);
      if (!chunk) continue;
      hits.push({
        resourceId: chunk.resourceId,
        chunkId: chunk.id,
        score: r.score,
        snippet: buildSnippet(chunk.text),
      });
    }
    return { query: input.query, hits };
  }

  async hybrid(input: SearchKnowledgeInput): Promise<RankedResult[]> {
    const [semanticHits, keywordItems] = await Promise.all([
      this.semantic(input),
      this.repo.list({
        workspaceId: input.workspaceId,
        search: input.query,
        categoryId: input.filters?.categoryId,
        tag: input.filters?.tag,
        limit: input.topK ?? 10,
      }),
    ]);

    // Reciprocal Rank Fusion (k=60) — robust to different score scales.
    const K = 60;
    const fusion = new Map<string, { score: number; snippet: string }>();
    const semanticWeight = input.semanticWeight ?? 0.6;
    const keywordWeight = 1 - semanticWeight;

    semanticHits.hits.forEach((hit, rank) => {
      const prev = fusion.get(hit.resourceId) ?? { score: 0, snippet: hit.snippet };
      prev.score += semanticWeight * (1 / (K + rank + 1));
      fusion.set(hit.resourceId, prev);
    });
    keywordItems.forEach((item, rank) => {
      const prev = fusion.get(item.id) ?? { score: 0, snippet: item.summary ?? "" };
      prev.score += keywordWeight * (1 / (K + rank + 1));
      if (!prev.snippet) prev.snippet = item.summary ?? "";
      fusion.set(item.id, prev);
    });

    const topIds = [...fusion.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, input.topK ?? 8)
      .map(([id]) => id);

    const resourceMap = new Map(
      keywordItems.map((r) => [r.id, r] as const)
    );
    // Fill in any semantic-only hits we didn't fetch via keyword.
    for (const id of topIds) {
      if (!resourceMap.has(id)) {
        const full = await this.repo.get(id);
        if (full) resourceMap.set(id, full);
      }
    }

    return topIds.map((id) => {
      const resource = resourceMap.get(id);
      const meta = fusion.get(id)!;
      const source: RankedResult["source"] =
        semanticHits.hits.some((h) => h.resourceId === id) && keywordItems.some((k) => k.id === id)
          ? "hybrid"
          : semanticHits.hits.some((h) => h.resourceId === id)
          ? "semantic"
          : "keyword";
      return {
        resource: resource
          ? {
              id: resource.id,
              title: resource.title,
              summary: resource.summary,
              tags: resource.tags,
              categoryId: resource.categoryId,
              isPremium: resource.isPremium,
              fileType: resource.fileType,
            }
          : {
              id,
              title: "(recurso no disponible)",
              summary: null,
              tags: [],
              categoryId: null,
              isPremium: false,
              fileType: "text",
            },
        score: meta.score,
        snippet: meta.snippet,
        source,
      };
    });
  }
}

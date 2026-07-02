import type { IKnowledgeRepository, SemanticSearchHit, SemanticSearchResult } from "../../domain/repositories/IKnowledgeRepository";
import type { KnowledgeResourceWithRelations } from "../../domain/entities/KnowledgeResource";
import { getVectorStore } from "@/server/lib/ai/vectorStore";
import { buildSnippet } from "../lib/chunking";
import type { AiClient } from "@/server/lib/ai/client";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("searchKnowledge");

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
      log.warn("semantic arm: embedder returned no vector", {
        query: input.query,
        ok: embed.ok,
        error: embed.error,
        provider: embed.provider,
      });
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
    log.debug("semantic arm result", {
      query: input.query,
      workspaceId: input.workspaceId,
      topK,
      vectorCandidates: results.length,
      resolvedHits: hits.length,
      top: hits.slice(0, 3).map((h) => ({
        resourceId: h.resourceId,
        score: Number(h.score.toFixed(4)),
      })),
    });
    return { query: input.query, hits };
  }

  async hybrid(input: SearchKnowledgeInput): Promise<RankedResult[]> {
    // Run the two retrieval arms concurrently but independently: a failure in
    // one (e.g. the keyword arm throwing because the embedder is misconfigured,
    // or the vector store rejecting a query) must NOT discard the other's
    // results. Promise.allSettled keeps whatever succeeded and surfaces the
    // failure to the logs instead of rejecting the whole reply — which is what
    // previously made @Alpha answer as if the knowledge base were empty.
    const semanticWeight = input.semanticWeight ?? 0.6;
    log.debug("hybrid retrieval plan", {
      workspaceId: input.workspaceId,
      query: input.query,
      topK: input.topK ?? 8,
      semanticWeight,
      keywordWeight: 1 - semanticWeight,
      filters: input.filters ?? null,
    });

    const [semanticRes, keywordRes] = await Promise.allSettled([
      this.semantic(input),
      this.repo.list({
        workspaceId: input.workspaceId,
        search: input.query,
        categoryId: input.filters?.categoryId,
        tag: input.filters?.tag,
        limit: input.topK ?? 10,
      }),
    ]);

    const semanticHits: SemanticSearchResult =
      semanticRes.status === "fulfilled"
        ? semanticRes.value
        : { query: input.query, hits: [] };
    if (semanticRes.status === "rejected") {
      log.error("semantic RAG arm rejected", semanticRes.reason);
    }

    const keywordItems: KnowledgeResourceWithRelations[] =
      keywordRes.status === "fulfilled" ? keywordRes.value : [];
    if (keywordRes.status === "rejected") {
      log.error("keyword RAG arm rejected", keywordRes.reason);
    }
    log.debug("hybrid arm inputs", {
      query: input.query,
      semanticHitCount: semanticHits.hits.length,
      keywordHitCount: keywordItems.length,
      keywordTitles: keywordItems.map((k) => k.title),
    });

    // Reciprocal Rank Fusion (k=60) — robust to different score scales.
    const K = 60;
    const fusion = new Map<string, { score: number; snippet: string }>();
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

    const ranked = topIds.map((id) => {
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

    log.debug("hybrid final ranking", {
      query: input.query,
      workspaceId: input.workspaceId,
      resultCount: ranked.length,
      ranking: ranked.map((r) => ({
        title: r.resource.title,
        source: r.source,
        score: Number(r.score.toFixed(4)),
      })),
    });

    return ranked;
  }
}

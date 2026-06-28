import { VertexAI } from "@google-cloud/vertexai";
import type { AiMessage, AiResult } from "../types";
import { BaseAiProvider } from "../baseProvider";
import { extractCandidateText } from "@/server/lib/ai/geminiParts";
import { getGcpAccessToken } from "../gcpAuth";

interface GeminiConfig {
  projectId: string;
  location: string;
  model: string;
  enabled: boolean;
  embeddingModel: string;
}

export function readGeminiConfig(env: NodeJS.ProcessEnv = process.env): GeminiConfig {
  return {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID ?? "",
    location: env.VERTEX_AI_LOCATION ?? "us-central1",
    model: env.GEMINI_MODEL ?? "gemini-2.5-flash",
    enabled: env.GEMINI_ENABLED === "true",
    embeddingModel: env.GEMINI_EMBEDDING_MODEL ?? "text-embedding-004",
  };
}

export class GeminiProvider extends BaseAiProvider {
  readonly name = "gemini";
  readonly model: string;
  private readonly config: GeminiConfig;
  private vertex: VertexAI | null = null;

  constructor(config?: Partial<GeminiConfig>) {
    super();
    this.config = { ...readGeminiConfig(), ...config };
    this.model = this.config.model;
  }

  isEnabled(): boolean {
    return this.config.enabled && Boolean(this.config.projectId && this.config.location);
  }

  private getClient(): VertexAI | null {
    if (!this.isEnabled()) return null;
    if (!this.vertex) {
      this.vertex = new VertexAI({
        project: this.config.projectId,
        location: this.config.location,
      });
    }
    return this.vertex;
  }

  protected async rawChat(
    messages: AiMessage[],
    opts: { maxTokens: number; temperature: number; json: boolean; signal?: AbortSignal }
  ): Promise<{ text: string; error?: string }> {
    const client = this.getClient();
    if (!client) return { text: "", error: "Gemini not enabled or misconfigured" };

    const model = client.preview.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: opts.maxTokens,
        temperature: opts.temperature,
        topP: 0.95,
        topK: 40,
      },
    });

    // The installed Vertex SDK has no typed systemInstruction support, so we
    // prepend system messages into the first user turn (same pattern as the
    // existing gemini.ts engine).
    const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const turns = messages.filter((m) => m.role !== "system");
    if (turns.length === 0) return { text: "", error: "Empty response from Gemini" };
    const first = turns[0];
    const mergedFirst = systemText
      ? { role: first.role, content: `${systemText}\n\n${first.content}` }
      : first;
    const contents = [mergedFirst, ...turns.slice(1)].map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));

    try {
      const result = await model.generateContent({ contents });
      const candidate = result.response.candidates?.[0];
      const text = extractCandidateText(candidate);
      if (!text) return { text: "", error: "Empty response from Gemini" };
      return { text };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { text: "", error: message };
    }
  }

  async embed(texts: string[]): Promise<AiResult<number[][]>> {
    if (!this.isEnabled() || texts.length === 0) {
      return { ok: false, error: "Gemini embeddings not enabled", model: this.config.embeddingModel, provider: this.name };
    }
    if (!this.config.projectId || !this.config.location) {
      return { ok: false, error: "Gemini embeddings require GOOGLE_CLOUD_PROJECT_ID and VERTEX_AI_LOCATION", model: this.config.embeddingModel, provider: this.name };
    }
    try {
      // The bundled @google-cloud/vertexai SDK (1.12) doesn't expose
      // embedding models on its `preview` surface anymore — calling
      // `preview.getEmbeddingModel` returned undefined and silently broke RAG
      // grounding for every @Alpha reply. Hit the REST :predict endpoint
      // directly with GCP Application Default Credentials instead, which is
      // stable and version-independent.
      const token = await getGcpAccessToken();
      const url =
        `https://${this.config.location}-aiplatform.googleapis.com/v1` +
        `/projects/${this.config.projectId}` +
        `/locations/${this.config.location}` +
        `/publishers/google/models/${this.config.embeddingModel}:predict`;
      // Batch all texts as instances; text-embedding-004 supports multiple
      // instances per request (250 max). We don't chunk here — batching is the
      // caller's responsibility.
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instances: texts.map((t) => ({ content: t })),
          parameters: { outputDimensionality: 768 },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `${res.status} ${res.statusText} ${body.slice(0, 200)}`, model: this.config.embeddingModel, provider: this.name };
      }
      const data = (await res.json()) as {
        predictions?: Array<{ embeddings?: { values?: number[] } }>;
      };
      const vectors = (data.predictions ?? []).map((p) => p.embeddings?.values ?? []);
      if (vectors.length === 0 || vectors.some((v) => v.length === 0)) {
        return { ok: false, error: "Empty response from Gemini embeddings", model: this.config.embeddingModel, provider: this.name };
      }
      return { ok: true, data: vectors, model: this.config.embeddingModel, provider: this.name };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, model: this.config.embeddingModel, provider: this.name };
    }
  }
}

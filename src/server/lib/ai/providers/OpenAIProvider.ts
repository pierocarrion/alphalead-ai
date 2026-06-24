import type { AiMessage, AiResult } from "../types";
import { BaseAiProvider } from "../baseProvider";

interface OpenAiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
  embeddingDimensions: number;
  enabled: boolean;
}

export function readOpenAiConfig(env: NodeJS.ProcessEnv = process.env): OpenAiConfig {
  return {
    apiKey: env.OPENAI_API_KEY ?? "",
    baseUrl: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    embeddingModel: env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    embeddingDimensions: Number(env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536),
    enabled: Boolean(env.OPENAI_API_KEY),
  };
}

export class OpenAIProvider extends BaseAiProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly config: OpenAiConfig;

  constructor(config?: Partial<OpenAiConfig>) {
    super();
    this.config = { ...readOpenAiConfig(), ...config };
    this.model = this.config.model;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  protected async rawChat(
    messages: AiMessage[],
    opts: { maxTokens: number; temperature: number; json: boolean; signal?: AbortSignal }
  ): Promise<{ text: string; error?: string }> {
    try {
      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        signal: opts.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { text: "", error: `${res.status} ${res.statusText} ${body.slice(0, 120)}` };
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { text: "", error: "Empty response from OpenAI" };
      return { text };
    } catch (err) {
      return { text: "", error: err instanceof Error ? err.message : String(err) };
    }
  }

  async embed(texts: string[]): Promise<AiResult<number[][]>> {
    if (!this.isEnabled() || texts.length === 0) {
      return { ok: false, error: "OpenAI embeddings not enabled", model: this.config.embeddingModel, provider: this.name };
    }
    try {
      const res = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: texts,
          dimensions: this.config.embeddingDimensions,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `${res.status} ${res.statusText} ${body.slice(0, 120)}`, model: this.config.embeddingModel, provider: this.name };
      }
      const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
      const vectors = (data.data ?? []).map((d) => d.embedding ?? []);
      if (vectors.length === 0) return { ok: false, error: "Empty response from OpenAI", model: this.config.embeddingModel, provider: this.name };
      return { ok: true, data: vectors, model: this.config.embeddingModel, provider: this.name };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, model: this.config.embeddingModel, provider: this.name };
    }
  }
}

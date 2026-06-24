import type { AiMessage, AiResult } from "../types";
import { BaseAiProvider } from "../baseProvider";

/**
 * Azure OpenAI provider. Uses the Azure OpenAI REST surface (deployments).
 * Chat and embeddings are backed by separate Azure deployments.
 */
interface AzureConfig {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
  chatDeployment: string;
  embeddingDeployment: string;
  enabled: boolean;
}

export function readAzureConfig(env: NodeJS.ProcessEnv = process.env): AzureConfig {
  return {
    apiKey: env.AZURE_OPENAI_API_KEY ?? "",
    endpoint: (env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/$/, ""),
    apiVersion: env.AZURE_OPENAI_API_VERSION ?? "2024-10-21",
    chatDeployment: env.AZURE_OPENAI_CHAT_DEPLOYMENT ?? "",
    embeddingDeployment: env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "",
    enabled: Boolean(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT),
  };
}

export class AzureOpenAIProvider extends BaseAiProvider {
  readonly name = "azure-openai";
  readonly model: string;
  private readonly config: AzureConfig;

  constructor(config?: Partial<AzureConfig>) {
    super();
    this.config = { ...readAzureConfig(), ...config };
    this.model = this.config.chatDeployment;
  }

  isEnabled(): boolean {
    return this.config.enabled && Boolean(this.config.chatDeployment);
  }

  protected async rawChat(
    messages: AiMessage[],
    opts: { maxTokens: number; temperature: number; json: boolean; signal?: AbortSignal }
  ): Promise<{ text: string; error?: string }> {
    try {
      const url = `${this.config.endpoint}/openai/deployments/${this.config.chatDeployment}/chat/completions?api-version=${this.config.apiVersion}`;
      const res = await fetch(url, {
        method: "POST",
        signal: opts.signal,
        headers: {
          "Content-Type": "application/json",
          "api-key": this.config.apiKey,
        },
        body: JSON.stringify({
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
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { text: "", error: "Empty response from Azure OpenAI" };
      return { text };
    } catch (err) {
      return { text: "", error: err instanceof Error ? err.message : String(err) };
    }
  }

  async embed(texts: string[]): Promise<AiResult<number[][]>> {
    if (!this.isEnabled() || !this.config.embeddingDeployment || texts.length === 0) {
      return { ok: false, error: "Azure embeddings not enabled", model: this.config.embeddingDeployment, provider: this.name };
    }
    try {
      const url = `${this.config.endpoint}/openai/deployments/${this.config.embeddingDeployment}/embeddings?api-version=${this.config.apiVersion}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": this.config.apiKey },
        body: JSON.stringify({ input: texts }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `${res.status} ${res.statusText} ${body.slice(0, 120)}`, model: this.config.embeddingDeployment, provider: this.name };
      }
      const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
      const vectors = (data.data ?? []).map((d) => d.embedding ?? []);
      if (vectors.length === 0) return { ok: false, error: "Empty response from Azure OpenAI", model: this.config.embeddingDeployment, provider: this.name };
      return { ok: true, data: vectors, model: this.config.embeddingDeployment, provider: this.name };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), model: this.config.embeddingDeployment, provider: this.name };
    }
  }
}

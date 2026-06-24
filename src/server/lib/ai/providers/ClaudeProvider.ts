import type { AiMessage, AiResult } from "../types";
import { BaseAiProvider } from "../baseProvider";

interface ClaudeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export function readClaudeConfig(env: NodeJS.ProcessEnv = process.env): ClaudeConfig {
  return {
    apiKey: env.ANTHROPIC_API_KEY ?? "",
    baseUrl: env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
    model: env.CLAUDE_MODEL ?? "claude-3-5-sonnet-latest",
    enabled: Boolean(env.ANTHROPIC_API_KEY),
  };
}

/**
 * Anthropic (Claude) provider via the Messages API.
 * Claude does not expose an embeddings endpoint; embeddings are served by the
 * configured embedder (OpenAI/Gemini) via the factory, never here.
 */
export class ClaudeProvider extends BaseAiProvider {
  readonly name = "claude";
  readonly model: string;
  private readonly config: ClaudeConfig;

  constructor(config?: Partial<ClaudeConfig>) {
    super();
    this.config = { ...readClaudeConfig(), ...config };
    this.model = this.config.model;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  protected async rawChat(
    messages: AiMessage[],
    opts: { maxTokens: number; temperature: number; json: boolean; signal?: AbortSignal }
  ): Promise<{ text: string; error?: string }> {
    const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch(`${this.config.baseUrl}/messages`, {
        method: "POST",
        signal: opts.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
          system: opts.json
            ? `${systemText}\n\nRespond ONLY with valid JSON. No markdown fences, no commentary.`
            : systemText,
          messages: turns,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { text: "", error: `${res.status} ${res.statusText} ${body.slice(0, 120)}` };
      }
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = (data.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();
      if (!text) return { text: "", error: "Empty response from Claude" };
      return { text };
    } catch (err) {
      return { text: "", error: err instanceof Error ? err.message : String(err) };
    }
  }

  async embed(_texts: string[]): Promise<AiResult<number[][]>> {
    return {
      ok: false,
      error: "Claude does not provide embeddings",
      friendlyError: "Claude does not provide embeddings; configure an embedder provider.",
      model: this.model,
      provider: this.name,
    };
  }
}

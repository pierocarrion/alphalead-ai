import type { AiChatRequest, AiMessage, AiResult } from "./types";
import { toFriendlyAiError } from "./errors";

/**
 * Shared base implementing the JSON-wrapping pattern (system hint + fence strip).
 * Concrete providers only implement {@link rawChat} and optionally {@link embed}.
 */
export abstract class BaseAiProvider {
  abstract readonly name: string;
  abstract readonly model: string;

  abstract isEnabled(): boolean;

  protected abstract rawChat(
    messages: AiMessage[],
    opts: {
      maxTokens: number;
      temperature: number;
      json: boolean;
      signal?: AbortSignal;
    }
  ): Promise<{ text: string; error?: string }>;

  async embed(_texts: string[]): Promise<AiResult<number[][]>> {
    return {
      ok: false,
      error: "embeddings-not-supported",
      friendlyError: "This AI provider doesn't support embeddings.",
      model: this.model,
      provider: this.name,
    };
  }

  async chat(request: AiChatRequest): Promise<AiResult<string>> {
    if (!this.isEnabled()) {
      return failure(this, "AI provider not enabled");
    }
    const messages = withSystem(request);
    try {
      const { text, error } = await this.rawChat(messages, {
        maxTokens: request.maxTokens ?? 512,
        temperature: request.temperature ?? 0.3,
        json: Boolean(request.json),
        signal: request.signal,
      });
      if (error) return failure(this, error);
      if (!text) return failure(this, "Empty response from AI");
      return { ok: true, data: text, model: this.model, provider: this.name };
    } catch (err) {
      return failure(this, err instanceof Error ? err.message : String(err));
    }
  }

  async chatJSON<T>(request: AiChatRequest): Promise<AiResult<T>> {
    const textResult = await this.chat({ ...request, json: true });
    if (!textResult.ok || !textResult.data) {
      return { ok: false, error: textResult.error, friendlyError: textResult.friendlyError, model: textResult.model, provider: textResult.provider };
    }
    const cleaned = textResult.data.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned) as T;
      return { ok: true, data: parsed, model: this.model, provider: this.name };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return failure(this, `JSON parse error: ${message}`);
    }
  }
}

function withSystem(request: AiChatRequest): AiMessage[] {
  const messages: AiMessage[] = [];
  if (request.system) messages.push({ role: "system", content: request.system });
  if (request.json) {
    messages.push({
      role: "system",
      content: "Respond ONLY with valid JSON. No markdown fences, no commentary.",
    });
  }
  messages.push(...request.messages);
  return messages;
}

export function failure(provider: { name: string; model: string }, error: string): AiResult<never> {
  return {
    ok: false,
    error,
    friendlyError: toFriendlyAiError(error),
    model: provider.model,
    provider: provider.name,
  };
}

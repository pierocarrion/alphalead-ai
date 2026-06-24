import { describe, expect, it } from "vitest";
import {
  createAiProvider,
  readProviderName,
} from "./factory";
import { GeminiProvider } from "./providers/GeminiProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AzureOpenAIProvider } from "./providers/AzureOpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";

describe("readProviderName", () => {
  it("defaults to gemini", () => {
    expect(readProviderName({} as NodeJS.ProcessEnv)).toBe("gemini");
  });

  it("reads supported vendors case-insensitively", () => {
    expect(readProviderName({ AI_PROVIDER: "OPENAI" } as NodeJS.ProcessEnv)).toBe("openai");
    expect(readProviderName({ AI_PROVIDER: "Claude" } as NodeJS.ProcessEnv)).toBe("claude");
    expect(readProviderName({ AI_PROVIDER: "azure-openai" } as NodeJS.ProcessEnv)).toBe("azure-openai");
  });

  it("falls back to gemini for unknown vendors", () => {
    expect(readProviderName({ AI_PROVIDER: "grok" } as NodeJS.ProcessEnv)).toBe("gemini");
  });
});

describe("createAiProvider", () => {
  it("returns the matching provider class", () => {
    expect(createAiProvider("gemini")).toBeInstanceOf(GeminiProvider);
    expect(createAiProvider("openai")).toBeInstanceOf(OpenAIProvider);
    expect(createAiProvider("azure-openai")).toBeInstanceOf(AzureOpenAIProvider);
    expect(createAiProvider("claude")).toBeInstanceOf(ClaudeProvider);
  });

  it("disabled providers report isEnabled=false without credentials", () => {
    expect(createAiProvider("openai", { apiKey: "" }).isEnabled()).toBe(false);
    expect(createAiProvider("claude", { apiKey: "" }).isEnabled()).toBe(false);
  });

  it("gemini provider is disabled without project id", () => {
    expect(
      createAiProvider("gemini", { projectId: "", location: "", enabled: false }).isEnabled()
    ).toBe(false);
  });

  it("claude reports embeddings as unsupported", async () => {
    const provider = createAiProvider("claude", { apiKey: "test-key", enabled: true });
    const result = await provider.embed(["hello"]);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/embeddings/i);
  });
});

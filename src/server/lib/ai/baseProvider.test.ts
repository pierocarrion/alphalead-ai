import { describe, expect, it } from "vitest";
import type { AiMessage } from "../types";
import { BaseAiProvider } from "./baseProvider";

/** A controllable provider that returns canned chat output for testing the
 *  shared JSON/system-prompt logic in {@link BaseAiProvider}. */
class FakeProvider extends BaseAiProvider {
  readonly name = "fake";
  readonly model = "fake-1";
  private readonly enabled: boolean;
  public captured: AiMessage[] | null = null;
  private nextText: string;

  constructor(enabled: boolean, nextText: string) {
    super();
    this.enabled = enabled;
    this.nextText = nextText;
  }

  isEnabled() {
    return this.enabled;
  }

  protected async rawChat(messages: AiMessage[]) {
    this.captured = messages;
    return { text: this.nextText };
  }
}

describe("BaseAiProvider", () => {
  it("refuses to chat when disabled and returns a friendly error", async () => {
    const provider = new FakeProvider(false, "hi");
    const result = await provider.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(result.ok).toBe(false);
    expect(result.friendlyError).toMatch(/enabled/i);
  });

  it("prepends system + json instructions in order", async () => {
    const provider = new FakeProvider(true, "ok");
    await provider.chat({
      system: "Be brief.",
      json: true,
      messages: [{ role: "user", content: "ping" }],
    });
    expect(provider.captured?.map((m) => m.role)).toEqual(["system", "system", "user"]);
    expect(provider.captured?.[0].content).toBe("Be brief.");
    expect(provider.captured?.[1].content).toMatch(/JSON/);
  });

  it("parses valid JSON (stripping code fences) in chatJSON", async () => {
    const provider = new FakeProvider(true, "```json\n{\"a\":1}\n```");
    const result = await provider.chatJSON<{ a: number }>({ messages: [{ role: "user", content: "x" }] });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ a: 1 });
  });

  it("returns a friendly parse error on invalid JSON", async () => {
    const provider = new FakeProvider(true, "not json at all");
    const result = await provider.chatJSON<{ a: number }>({ messages: [{ role: "user", content: "x" }] });
    expect(result.ok).toBe(false);
    expect(result.friendlyError).toMatch(/couldn't read/i);
  });

  it("surfaces empty responses as a friendly error", async () => {
    const provider = new FakeProvider(true, "");
    const result = await provider.chat({ messages: [{ role: "user", content: "x" }] });
    expect(result.ok).toBe(false);
    expect(result.friendlyError).toMatch(/didn't respond/i);
  });
});

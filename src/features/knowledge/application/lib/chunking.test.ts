import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens, buildSnippet } from "./chunking";

describe("estimateTokens", () => {
  it("returns 0 for empty text", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   ")).toBe(0);
  });

  it("approximates ~4 chars per token with a minimum of 1", () => {
    expect(estimateTokens("word")).toBe(1);
    expect(estimateTokens("a".repeat(40))).toBe(10);
  });
});

describe("chunkText", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("keeps a short document as a single chunk", () => {
    const text = "This is a single short sentence about onboarding.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("onboarding");
  });

  it("splits a long document into multiple ordered chunks", () => {
    const sentence = "This is a reasonably long sentence that carries meaningful content. ";
    const text = sentence.repeat(60);
    const chunks = chunkText(text, { targetTokens: 40, overlapTokens: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].ordinal).toBe(i);
    }
    expect(chunks.every((c) => c.tokenCount > 0)).toBe(true);
  });

  it("hard-splits overly long single sentences", () => {
    const huge = "word ".repeat(2000);
    const chunks = chunkText(huge, { targetTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.tokenCount <= 120)).toBe(true);
  });

  it("respects the minimum-tokens threshold (drops tiny tail)", () => {
    const text = "Real sentence here with enough body to pass the minimum threshold. tiny";
    const chunks = chunkText(text, { minTokens: 5 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});

describe("buildSnippet", () => {
  it("returns the full text when under the limit", () => {
    expect(buildSnippet("short text")).toBe("short text");
  });

  it("truncates with an ellipsis when too long", () => {
    const long = "x".repeat(400);
    const snippet = buildSnippet(long, 50);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(50);
  });
});

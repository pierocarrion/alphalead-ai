import { describe, expect, it } from "vitest";
import { FEELINGS } from "./feelings";

describe("FEELINGS", () => {
  it("contains five feelings", () => {
    expect(FEELINGS).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = FEELINGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(FEELINGS)("feeling $id has required fields", (feeling) => {
    expect(feeling.emoji).toBeTruthy();
    expect(feeling.label).toBeTruthy();
    expect(feeling.val).toBeTruthy();
  });

  it("includes expected feelings", () => {
    const ids = FEELINGS.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["anxious", "bored", "over", "avoid", "unsure"]));
  });
});

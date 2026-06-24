import { describe, expect, it, beforeEach } from "vitest";
import {
  InMemoryVectorStore,
  cosineSimilarity,
  setVectorStore,
  getVectorStore,
} from "./vectorStore";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it("returns 0 when a vector is all zeros", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("is symmetric", () => {
    const a = [0.2, 0.5, 0.1];
    const b = [0.9, 0.1, 0.7];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 6);
  });
});

describe("InMemoryVectorStore", () => {
  let store: InMemoryVectorStore;

  beforeEach(() => {
    store = new InMemoryVectorStore();
  });

  it("upserts and counts records", async () => {
    await store.upsert([
      { id: "1", vector: [1, 0], metadata: { docId: "a" } },
      { id: "2", vector: [0, 1], metadata: { docId: "b" } },
    ]);
    expect(await store.count()).toBe(2);
    expect(await store.count({ docId: "a" })).toBe(1);
  });

  it("overwrites on upsert by id", async () => {
    await store.upsert([{ id: "1", vector: [1, 0], metadata: { v: 1 } }]);
    await store.upsert([{ id: "1", vector: [0, 1], metadata: { v: 2 } }]);
    expect(await store.count()).toBe(1);
    const results = await store.query([0, 1], { topK: 1 });
    expect(results[0].metadata.v).toBe(2);
  });

  it("returns ranked results by cosine similarity", async () => {
    await store.upsert([
      { id: "a", vector: [1, 0], metadata: {} },
      { id: "b", vector: [0.9, 0.4], metadata: {} },
      { id: "c", vector: [0, 1], metadata: {} },
    ]);
    const results = await store.query([1, 0], { topK: 2 });
    expect(results.map((r) => r.id)).toEqual(["a", "b"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("filters by metadata equality", async () => {
    await store.upsert([
      { id: "a", vector: [1, 0], metadata: { workspaceId: "w1" } },
      { id: "b", vector: [1, 0], metadata: { workspaceId: "w2" } },
    ]);
    const results = await store.query([1, 0], { topK: 10, filter: { workspaceId: "w1" } });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("a");
  });

  it("deletes by id and by metadata", async () => {
    await store.upsert([
      { id: "a", vector: [1, 0], metadata: { docId: "d1" } },
      { id: "b", vector: [1, 0], metadata: { docId: "d1" } },
      { id: "c", vector: [1, 0], metadata: { docId: "d2" } },
    ]);
    await store.delete(["a"]);
    expect(await store.count()).toBe(2);
    await store.deleteByMetadata({ docId: "d1" });
    expect(await store.count()).toBe(1);
  });

  it("clears all records", async () => {
    await store.upsert([{ id: "a", vector: [1], metadata: {} }]);
    await store.clear();
    expect(await store.count()).toBe(0);
  });
});

describe("getVectorStore singleton", () => {
  it("returns the same instance until overridden", () => {
    const first = getVectorStore();
    const second = getVectorStore();
    expect(first).toBe(second);
    const custom = new InMemoryVectorStore();
    setVectorStore(custom);
    expect(getVectorStore()).toBe(custom);
    setVectorStore(new InMemoryVectorStore());
  });
});

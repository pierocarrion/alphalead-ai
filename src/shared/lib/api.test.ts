import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchJson } from "./api";

describe("fetchJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: "world" }),
    } as Response);

    const data = await fetchJson<{ hello: string }>("http://localhost/test");
    expect(data).toEqual({ hello: "world" });
  });

  it("throws ApiError with server message on error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Please enter a valid email." }),
    } as Response);

    await expect(fetchJson("http://localhost/test")).rejects.toThrow("Please enter a valid email.");
    await expect(fetchJson("http://localhost/test")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("throws ApiError with generic message when server sends no error field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(fetchJson("http://localhost/test")).rejects.toThrow(/something went wrong/i);
  });

  it("throws ApiError with network message on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(fetchJson("http://localhost/test")).rejects.toThrow(/couldn't reach the server/i);
  });

  it("throws ApiError with generic message when JSON parse fails on error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not JSON");
      },
    } as Response);

    await expect(fetchJson("http://localhost/test")).rejects.toThrow(/something went wrong/i);
  });
});

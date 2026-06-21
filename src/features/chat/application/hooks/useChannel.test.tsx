import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useChannel } from "./useChannel";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryClientProvider";
  return Wrapper;
};

describe("useChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("loads channel messages", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        channel: { id: "channel-1", name: "q3-launch" },
        messages: [
          { id: "m1", who: "maya", name: "Maya", time: "9:00am", text: "Hello", userId: "u1" },
        ],
        detected: null,
      }),
    } as Response);

    const { result } = renderHook(() => useChannel("channel-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.channel?.name).toBe("q3-launch");
    expect(result.current.messages).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/channels/channel-1/messages", undefined);
  });

  it("sends a message and updates the cache", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          channel: { id: "channel-1", name: "q3-launch" },
          messages: [],
          detected: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { id: "m2", who: "maya", name: "Maya", time: "9:05am", text: "New task", userId: "u1" },
          detected: { title: "New task" },
        }),
      } as Response);

    const { result } = renderHook(() => useChannel("channel-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.sendMessage.mutate("New task");

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0].text).toBe("New task");
    expect(result.current.detected?.title).toBe("New task");
  });
});

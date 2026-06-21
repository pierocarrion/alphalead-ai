"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatMessageData } from "@/features/chat/presentation/components/ChatMessage";
import { DetectedTaskDraft } from "@/features/tasks/lib/detect";

interface ChannelResponse {
  channel: { id: string; name: string };
  messages: ChatMessageData[];
  detected: DetectedTaskDraft | null;
}

interface SendMessageResponse {
  message: ChatMessageData;
  detected: DetectedTaskDraft | null;
}

export function useChannel(channelId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["channel", channelId];

  const { data, isLoading } = useQuery<ChannelResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/channels/${channelId}/messages`);
      if (!res.ok) throw new Error("Failed to load channel");
      return res.json();
    },
  });

  const sendMessage = useMutation<SendMessageResponse, Error, string>({
    mutationFn: async (text) => {
      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.setQueryData<ChannelResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, result.message],
        };
      });
    },
  });

  return {
    channel: data?.channel,
    messages: data?.messages ?? [],
    isLoading,
    sendMessage,
    detected: sendMessage.data?.detected ?? null,
    isSending: sendMessage.isPending,
  };
}

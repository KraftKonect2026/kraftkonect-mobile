import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useLazyQuery } from "@apollo/client";
import { GET_CONVERSATIONS_QUERY } from "./queries";

export function useOpenChat() {
  const router = useRouter();
  const [fetchConversations] = useLazyQuery(GET_CONVERSATIONS_QUERY, {
    fetchPolicy: "cache-first",
  });

  return useCallback(
    async (recipientUserId: string, name: string, avatar?: string) => {
      const { data } = await fetchConversations();
      const existing = (data?.getConversations ?? []).find(
        (c: any) => c.otherParticipant?.id === recipientUserId,
      );

      const encodedName = encodeURIComponent(name ?? "");
      const encodedAvatar = encodeURIComponent(avatar ?? "");

      if (existing) {
        router.push(
          `/chat/${existing.id}?recipientId=${recipientUserId}&name=${encodedName}&avatar=${encodedAvatar}` as any,
        );
      } else {
        router.push(
          `/chat/new?recipientId=${recipientUserId}&name=${encodedName}&avatar=${encodedAvatar}` as any,
        );
      }
    },
    [fetchConversations, router],
  );
}

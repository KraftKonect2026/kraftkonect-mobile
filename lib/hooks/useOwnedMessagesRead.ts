import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { useAppSelector, store } from "@/store";
import { GET_CONVERSATIONS_QUERY, GET_MESSAGES_QUERY } from "@/lib/queries";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { LiveConversation, LiveMessage } from "@/lib/messaging/liveMessages";
import { readOwnedMessages } from "@/lib/messaging/readOwnedMessages";

type ReadState = {
  ownerId: string;
  conversationId?: string;
  loading: boolean;
  error?: string;
  rows?: LiveConversation[];
  conversation?: LiveConversation;
  messages?: LiveMessage[];
};

export function useOwnedMessagesRead(conversationId?: string) {
  const client = useApolloClient();
  const ownerId = useAppSelector(s => s.auth.user?.id);
  const signedIn = useAppSelector(s => s.auth.isAuthenticated && !!s.auth.accessToken && !!s.auth.user);
  const generation = useRef(0);
  const [saved, setSaved] = useState<ReadState>();
  const refresh = useCallback(async () => {
    if (!ownerId || !signedIn) return;
    const revision = ++generation.current;
    const owns = () => {
      const auth = store.getState().auth;
      return generation.current === revision && sameAccountSession(ownerId, auth.user?.id, auth.isAuthenticated && !!auth.accessToken);
    };
    setSaved(previous => ({ ...((previous?.ownerId === ownerId && previous.conversationId === conversationId) ? previous : {}), ownerId, conversationId, loading: true, error: undefined }));
    try {
      const context = { accountOwnerId: ownerId, queryDeduplication: false };
      const result = await readOwnedMessages(ownerId, conversationId, {
        inbox: async () => (await client.query({ query: GET_CONVERSATIONS_QUERY, fetchPolicy: "no-cache", context })).data?.getConversations,
        history: async id => (await client.query({ query: GET_MESSAGES_QUERY, variables: { conversationId: id }, fetchPolicy: "no-cache", context })).data?.getMessages,
        isCurrent: owns,
      });
      if (owns()) setSaved({ ownerId, conversationId, ...result, loading: false });
    } catch (e) {
      if (owns()) setSaved({ ownerId, conversationId, loading: false, error: e instanceof Error ? e.message : "Couldn’t refresh messages. Try again later." });
    }
  }, [client, ownerId, signedIn, conversationId]);
  useFocusEffect(useCallback(() => { void refresh(); return () => { generation.current++; }; }, [refresh]));
  const current = saved && signedIn && saved.ownerId === ownerId && saved.conversationId === conversationId ? saved : undefined;
  return { ...current, loading: current?.loading ?? signedIn, ownerId, signedIn, refresh };
}

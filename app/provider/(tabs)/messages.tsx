import { MessageCircle, RefreshCw, ChevronRight } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";

import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { GET_CONVERSATIONS_QUERY } from "@/lib/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantAvatar: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

function mapConversation(c: any): Conversation {
  return {
    id: c.id,
    otherParticipantId: c.otherParticipant?.id ?? "",
    otherParticipantName: c.otherParticipant?.name ?? "Customer",
    otherParticipantAvatar: c.otherParticipant?.avatar ?? "",
    lastMessage: c.lastMessage ?? null,
    lastMessageAt: c.lastMessageAt ?? null,
    unreadCount: c.unreadCount ?? 0,
  };
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProviderMessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.accessToken);

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATIONS_QUERY, {
    skip: !token,
    fetchPolicy: "cache-and-network",
    pollInterval: 30_000,
  });

  const conversations: Conversation[] = (data?.getConversations ?? []).map(mapConversation);
  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length;

  const renderRow = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.messageCard}
      activeOpacity={0.7}
      onPress={() =>
        router.push(
          `/chat/${conversation.id}?recipientId=${conversation.otherParticipantId}&name=${encodeURIComponent(conversation.otherParticipantName)}&avatar=${encodeURIComponent(conversation.otherParticipantAvatar)}` as any,
        )
      }
    >
      {conversation.otherParticipantAvatar ? (
        <Image source={{ uri: conversation.otherParticipantAvatar }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatarFallback}>
          <MessageCircle size={22} color={Colors.primary} strokeWidth={2} />
        </View>
      )}
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName} numberOfLines={1}>
            {conversation.otherParticipantName}
          </Text>
          <Text style={styles.messageTime}>{formatTime(conversation.lastMessageAt)}</Text>
        </View>
        <Text
          style={[styles.messageText, conversation.unreadCount > 0 && styles.unreadMessage]}
          numberOfLines={1}
        >
          {conversation.lastMessage ?? "No messages yet"}
        </Text>
      </View>
      <View style={styles.messageRight}>
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {conversation.unreadCount > 9 ? "9+" : String(conversation.unreadCount)}
            </Text>
          </View>
        )}
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        {!loading && (
          <Text style={styles.headerSubtitle}>
            {unreadTotal} unread
          </Text>
        )}
      </View>

      {loading && !data ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Loading conversations…</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Couldn&apos;t load messages</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color="#E5E7EB" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                When a customer messages you, it&apos;ll show up here
              </Text>
            </View>
          ) : (
            conversations.map(renderRow)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 28, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: "#6B7280" },
  content: { flex: 1 },
  contentContainer: { padding: 16 },

  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  stateText: { fontSize: 16, color: "#6B7280" },
  errorTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  retryButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { fontSize: 15, fontWeight: "600" as const, color: "#FFFFFF" },

  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6" },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  messageName: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", flex: 1, marginRight: 8 },
  messageTime: { fontSize: 12, color: "#9CA3AF" },
  messageText: { fontSize: 14, color: "#6B7280" },
  unreadMessage: { fontWeight: "600" as const, color: "#2C2C2C" },
  messageRight: { alignItems: "center", gap: 8 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "700" as const, color: "#FFFFFF" },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: "700" as const, color: "#2C2C2C", marginTop: 24, marginBottom: 8 },
  emptyText: { fontSize: 16, color: "#9CA3AF", textAlign: "center", lineHeight: 24 },
});

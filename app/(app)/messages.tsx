import { MessageCircle, RefreshCw } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapConversation(c: any): Conversation {
  return {
    id: c.id,
    otherParticipantId: c.otherParticipant?.id ?? "",
    otherParticipantName: c.otherParticipant?.name ?? "Unknown",
    otherParticipantAvatar: c.otherParticipant?.avatar ?? "",
    lastMessage: c.lastMessage ?? null,
    lastMessageAt: c.lastMessageAt ?? null,
    unreadCount: c.unreadCount ?? 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.accessToken);

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATIONS_QUERY, {
    skip: !token,
    fetchPolicy: "cache-and-network",
    pollInterval: 30_000, // refresh every 30s as a safety net alongside subscriptions
  });

  const conversations: Conversation[] = (data?.getConversations ?? []).map(mapConversation);

  const renderRow = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationRow}
      activeOpacity={0.7}
      onPress={() =>
        router.push(
          `/chat/${conversation.id}?recipientId=${conversation.otherParticipantId}&name=${encodeURIComponent(conversation.otherParticipantName)}&avatar=${encodeURIComponent(conversation.otherParticipantAvatar)}` as any,
        )
      }
    >
      <Image
        source={{ uri: conversation.otherParticipantAvatar }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.conversationContent}>
        <View style={styles.topRow}>
          <Text style={styles.providerName} numberOfLines={1}>
            {conversation.otherParticipantName}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            conversation.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {conversation.lastMessage ?? "No messages yet"}
        </Text>
      </View>
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {conversation.unreadCount > 9 ? "9+" : String(conversation.unreadCount)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading && !data ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Loading conversations…</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Couldn't load messages</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color="#E5E7EB" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Start a conversation with a provider
              </Text>
            </View>
          ) : (
            <View style={styles.conversationsList}>
              {conversations.map(renderRow)}
            </View>
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
  headerTitle: { fontSize: 28, fontWeight: "700" as const, color: "#2C2C2C" },
  content: { flex: 1 },
  conversationsList: { backgroundColor: "#FFFFFF" },

  // Loading / error
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  stateText: { fontSize: 16, color: "#6B7280" },
  errorTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  errorText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
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

  // Rows
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  conversationContent: { flex: 1, marginRight: 8 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    flex: 1,
    marginRight: 8,
  },
  timestamp: { fontSize: 13, color: "#9CA3AF" },
  lastMessage: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  unreadMessage: { fontWeight: "600" as const, color: "#2C2C2C" },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 12, fontWeight: "700" as const, color: "#FFFFFF" },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: { fontSize: 16, color: "#9CA3AF", textAlign: "center", lineHeight: 24 },
});

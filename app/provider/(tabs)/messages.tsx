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
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
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
    <ScreenBackground>
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerBubble1} pointerEvents="none" />
        <View style={styles.headerBubble2} pointerEvents="none" />
        <Text style={styles.headerTitle}>Messages</Text>
        {!loading && (
          <Text style={styles.headerSubtitle}>
            {unreadTotal} unread
          </Text>
        )}
      </LinearGradient>

      {loading && !data ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Loading conversations…</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Couldn&apos;t load messages</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryButton}
            >
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
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
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  headerBubble1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.10)",
    top: -70,
    right: -40,
  },
  headerBubble2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -50,
    left: -10,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.8)" },
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    ...Shadows.glow,
  },
  retryText: { fontSize: 15, fontWeight: "600" as const, color: "#FFFFFF" },

  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    ...glassSurface,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    marginBottom: 12,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6" },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(219,234,254,0.7)",
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

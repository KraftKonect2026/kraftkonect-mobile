import { MessageCircle } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { mockConversations } from "@/mocks/messages";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderConversationRow = (conversation: typeof mockConversations[0]) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationRow}
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${conversation.providerId}`)}
    >
      <Image
        source={{ uri: conversation.providerImage }}
        style={styles.avatar}
      />
      <View style={styles.conversationContent}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.providerName}>{conversation.providerName}</Text>
            <Text style={styles.category}> • {conversation.providerCategory}</Text>
          </View>
          <Text style={styles.timestamp}>{conversation.lastMessageTime}</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            conversation.unread && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {conversation.lastMessage}
        </Text>
      </View>
      {conversation.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Start a conversation with a provider
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {mockConversations.map(renderConversationRow)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  content: {
    flex: 1,
  },
  conversationsList: {
    backgroundColor: "#FFFFFF",
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  category: {
    fontSize: 14,
    color: "#6B7280",
  },
  timestamp: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -5,
  },
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
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User as UserIcon, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";

const mockMessages = [
  {
    id: "1",
    customerName: "Sarah Johnson",
    lastMessage: "Thank you! See you tomorrow.",
    timestamp: "10 min ago",
    unread: 2,
  },
  {
    id: "2",
    customerName: "Michael Chen",
    lastMessage: "Can we reschedule to next week?",
    timestamp: "1h ago",
    unread: 1,
  },
  {
    id: "3",
    customerName: "Emma Wilson",
    lastMessage: "Perfect, confirmed!",
    timestamp: "2h ago",
    unread: 0,
  },
];

export default function ProviderMessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {mockMessages.filter((m) => m.unread > 0).length} unread
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {mockMessages.map((message) => (
          <TouchableOpacity
            key={message.id}
            style={styles.messageCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/chat/${message.id}` as any)}
          >
            <View style={styles.messageAvatar}>
              <UserIcon size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>{message.customerName}</Text>
                <Text style={styles.messageTime}>{message.timestamp}</Text>
              </View>
              <Text style={styles.messageText} numberOfLines={1}>
                {message.lastMessage}
              </Text>
            </View>
            <View style={styles.messageRight}>
              {message.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{message.unread}</Text>
                </View>
              )}
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ))}
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
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
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  messageTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  messageText: {
    fontSize: 14,
    color: "#6B7280",
  },
  messageRight: {
    alignItems: "center",
    gap: 8,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});

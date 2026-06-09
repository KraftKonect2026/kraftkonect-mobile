import {
  ArrowLeft,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Flag,
  Ban,
  RefreshCw,
} from "lucide-react-native";
import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,  } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";

import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { GET_MESSAGES_QUERY } from "@/lib/queries";
import { SEND_MESSAGE_MUTATION } from "@/lib/mutations";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Route param: the conversation ID (navigated from messages list)
  // Query params: recipient user info so we don't need an extra fetch
  const { providerId, recipientId, name, avatar } = useLocalSearchParams<{
    providerId: string;
    recipientId?: string;
    name?: string;
    avatar?: string;
  }>();

  const isNew = providerId === "new";
  const [resolvedConvId, setResolvedConvId] = useState<string | null>(
    isNew ? null : providerId,
  );
  const conversationId = resolvedConvId ?? "";
  const participantName = name ? decodeURIComponent(name) : "Chat";
  const participantAvatar = avatar ? decodeURIComponent(avatar) : "";

  const currentUserId = useAppSelector((state) => state.auth.user?.id ?? "");

  const [messageText, setMessageText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // ── Query: message history ─────────────────────────────────────────────────

  const { data, loading, error, refetch } = useQuery(
    GET_MESSAGES_QUERY,
    {
      variables: { conversationId },
      skip: !resolvedConvId,
      fetchPolicy: "cache-and-network",
      pollInterval: 3000,
    },
  );

  const messages: ChatMessage[] = (data?.getMessages ?? []).map((m: any) => ({
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    createdAt: m.createdAt,
  }));

  // Real-time messages are handled via HTTP pollInterval on useQuery

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  // ── Mutation: send message ─────────────────────────────────────────────────

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    update(cache, { data }) {
      if (!data?.sendMessage) return;
      const newMsg = data.sendMessage;
      const convId = newMsg.conversationId;
      if (!convId) return;

      const existing = cache.readQuery<{ getMessages: any[] }>({
        query: GET_MESSAGES_QUERY,
        variables: { conversationId: convId },
      });

      if (existing) {
        if (existing.getMessages.some((m) => m.id === newMsg.id)) return;
        cache.writeQuery({
          query: GET_MESSAGES_QUERY,
          variables: { conversationId: convId },
          data: { getMessages: [...existing.getMessages, newMsg] },
        });
      } else {
        cache.writeQuery({
          query: GET_MESSAGES_QUERY,
          variables: { conversationId: convId },
          data: { getMessages: [newMsg] },
        });
      }
    },
  });

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !recipientId) return;

    setMessageText("");

    try {
      const { data: msgData } = await sendMessage({ variables: { recipientId, text } });
      // On first message in a new conversation, resolve the conversation ID
      // so GET_MESSAGES_QUERY activates and subscription wires up
      if (!resolvedConvId && msgData?.sendMessage?.conversationId) {
        setResolvedConvId(msgData.sendMessage.conversationId);
      }
    } catch {
      setMessageText(text);
    }
  };

  // ── Report reasons ─────────────────────────────────────────────────────────

  const reportReasons = [
    "Inappropriate behavior",
    "Spam or scam",
    "No-show",
    "Poor service quality",
    "Unprofessional conduct",
    "Overcharging",
    "Safety concerns",
    "Other",
  ];

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading messages…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <Text style={styles.errorTitle}>Couldn't load messages</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderMessage = (msg: ChatMessage) => {
    const isMe = msg.senderId === currentUserId;
    return (
      <View
        key={msg.id}
        style={[styles.messageContainer, isMe ? styles.messageRight : styles.messageLeft]}
      >
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {msg.text}
          </Text>
        </View>
        <Text style={styles.messageTimestamp}>{formatMessageTime(msg.createdAt)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={{ uri: participantAvatar }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{participantName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          activeOpacity={0.7}
          onPress={() => setMenuVisible(true)}
        >
          <MoreVertical size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && !loading && (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              No messages yet. Say hello!
            </Text>
          </View>
        )}
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
          <ImageIcon size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Input
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          containerStyle={{ flex: 1 }}
          style={{ height: 40, borderRadius: 20 }}
          inputStyle={{ paddingVertical: 8, height: "100%" }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          activeOpacity={0.7}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Send
              size={20}
              color={messageText.trim() ? "#FFFFFF" : "#9CA3AF"}
              strokeWidth={2}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Options menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuVisible(false);
                setReportModalVisible(true);
              }}
            >
              <View style={styles.menuIconContainer}>
                <Flag size={20} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>Report</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setMenuVisible(false)}
            >
              <View style={styles.menuIconContainer}>
                <Ban size={20} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setReportModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.reportSheet}>
            <View style={styles.menuHandle} />
            <Text style={styles.reportTitle}>Report {participantName}</Text>
            <Text style={styles.reportSubtitle}>
              Help us understand what&apos;s happening
            </Text>

            <ScrollView style={styles.reasonsList}>
              {reportReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason && styles.reasonItemSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View
                    style={[
                      styles.reasonRadio,
                      selectedReason === reason && styles.reasonRadioSelected,
                    ]}
                  >
                    {selectedReason === reason && (
                      <View style={styles.reasonRadioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.reportActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                textStyle={{ color: "#6B7280" }}
                onPress={() => {
                  setReportModalVisible(false);
                  setSelectedReason(null);
                }}
              />
              <Button
                title="Submit Report"
                onPress={() => {
                  if (selectedReason) {
                    setReportModalVisible(false);
                    setSelectedReason(null);
                  }
                }}
                disabled={!selectedReason}
                style={{ flex: 1, backgroundColor: "#F59E0B", borderColor: "#F59E0B" }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  // Loading / error
  centeredState: { alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#F3F4F6" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C" },
  moreButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },

  // Messages
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  emptyChat: { flex: 1, alignItems: "center", paddingTop: 60 },
  emptyChatText: { fontSize: 15, color: "#9CA3AF" },
  messageContainer: { marginBottom: 16 },
  messageLeft: { alignItems: "flex-start" },
  messageRight: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "75%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  myBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  myText: { color: "#FFFFFF" },
  theirText: { color: "#2C2C2C" },
  messageTimestamp: { fontSize: 11, color: "#9CA3AF", marginTop: 4, marginHorizontal: 4 },

  // Input bar
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  attachButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    fontSize: 15,
    color: "#2C2C2C",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sendButtonDisabled: { backgroundColor: "#E5E7EB" },

  // Options menu
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
  menuHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuItemText: { fontSize: 16, fontWeight: "500" as const, color: "#2C2C2C" },
  menuItemDanger: { color: "#EF4444" },
  menuDivider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 72 },

  // Report sheet
  reportSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: "80%" as any },
  reportTitle: { fontSize: 20, fontWeight: "700" as const, color: "#2C2C2C", textAlign: "center", marginBottom: 8, paddingHorizontal: 20 },
  reportSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24, paddingHorizontal: 20 },
  reasonsList: { paddingHorizontal: 20, marginBottom: 16 },
  reasonItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, backgroundColor: "#F9FAFB", borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: "transparent" },
  reasonItemSelected: { backgroundColor: "#EFF6FF", borderColor: Colors.primary },
  reasonRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center", marginRight: 12 },
  reasonRadioSelected: { borderColor: Colors.primary },
  reasonRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  reasonText: { fontSize: 15, color: "#2C2C2C", flex: 1 },
  reasonTextSelected: { fontWeight: "600" as const, color: Colors.primary },
  reportActions: { flexDirection: "row", paddingHorizontal: 20, gap: 12 },
  reportCancelButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center" },
  reportCancelText: { fontSize: 16, fontWeight: "600" as const, color: "#6B7280" },
  reportSubmitButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: "#F59E0B", alignItems: "center" },
  reportSubmitButtonDisabled: { backgroundColor: "#E5E7EB" },
  reportSubmitText: { fontSize: 16, fontWeight: "600" as const, color: "#FFFFFF" },
  reportSubmitTextDisabled: { color: "#9CA3AF" },
});

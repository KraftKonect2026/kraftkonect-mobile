import {
  ArrowLeft,
  MoreVertical,
  Send,
  Image as ImageIcon,
  FileText,
  Flag,
  Ban,
} from "lucide-react-native";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import { mockConversations } from "@/mocks/messages";
import Colors from "@/constants/colors";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { providerId } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = mockConversations.find(
    (c) => c.providerId === providerId
  );

  const [message, setMessage] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  if (!conversation) {
    return (
      <View style={styles.container}>
        <Text>Conversation not found</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  const renderMessage = (msg: typeof conversation.messages[0], index: number) => {
    const isCustomer = msg.senderId === "customer";
    return (
      <View
        key={msg.id}
        style={[
          styles.messageContainer,
          isCustomer ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCustomer ? styles.customerBubble : styles.providerBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCustomer ? styles.customerText : styles.providerText,
            ]}
          >
            {msg.text}
          </Text>
        </View>
        <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
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
            source={{ uri: conversation.providerImage }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation.providerName}</Text>
            <Text style={styles.headerCategory}>
              {conversation.providerCategory}
            </Text>
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

      {conversation.bookingId && (
        <TouchableOpacity
          style={styles.bookingBanner}
          activeOpacity={0.7}
          onPress={() => router.push(`/booking-detail/${conversation.id}`)}
        >
          <Text style={styles.bookingBannerText}>View booking details</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {conversation.messages.map(renderMessage)}
      </ScrollView>

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
          <ImageIcon size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          activeOpacity={0.7}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Send
            size={20}
            color={message.trim() ? "#FFFFFF" : "#9CA3AF"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

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
                if (conversation.bookingId) {
                  router.push(`/booking-detail/${conversation.id}`);
                }
              }}
            >
              <View style={styles.menuIconContainer}>
                <FileText size={20} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.menuItemText}>View Booking Details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuVisible(false);
                console.log("Report provider");
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
              onPress={() => {
                setMenuVisible(false);
                console.log("Block provider");
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ban size={20} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  headerCategory: {
    fontSize: 13,
    color: "#6B7280",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingBanner: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#EFF6FF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
    alignItems: "center",
  },
  bookingBannerText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageLeft: {
    alignItems: "flex-start",
  },
  messageRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  customerBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  providerBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  customerText: {
    color: "#FFFFFF",
  },
  providerText: {
    color: "#2C2C2C",
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 4,
  },
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
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
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
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  menuItemDanger: {
    color: "#EF4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 72,
  },
});

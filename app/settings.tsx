import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Lock,
  Eye,
  MessageSquare,
  ShieldAlert,
  FileText,
  Phone,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [messagesNotif, setMessagesNotif] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const settingsSections = [
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Booking updates",
          type: "toggle" as const,
          value: bookingUpdates,
          onToggle: setBookingUpdates,
        },
        {
          icon: MessageSquare,
          label: "Messages from providers",
          type: "toggle" as const,
          value: messagesNotif,
          onToggle: setMessagesNotif,
        },
        {
          icon: Bell,
          label: "Promotions & tips",
          type: "toggle" as const,
          value: promotions,
          onToggle: setPromotions,
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: Eye,
          label: "Profile visibility",
          type: "link" as const,
        },
        {
          icon: MessageSquare,
          label: "Who can message me",
          type: "link" as const,
        },
        {
          icon: ShieldAlert,
          label: "Blocked providers",
          type: "link" as const,
        },
      ],
    },
    {
      title: "Help & Legal",
      items: [
        {
          icon: FileText,
          label: "Help Center / FAQs",
          type: "link" as const,
        },
        {
          icon: FileText,
          label: "Terms of Service",
          type: "link" as const,
        },
        {
          icon: Lock,
          label: "Privacy Policy",
          type: "link" as const,
        },
        {
          icon: Phone,
          label: "Contact Support",
          type: "link" as const,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: Trash2,
          label: "Delete account",
          type: "action" as const,
          danger: true,
          onPress: () => setDeleteModalVisible(true),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    if (item.type === "toggle") {
      return (
        <View key={index} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <item.icon size={20} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: "#E5E7EB", true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      );
    }

    if (item.type === "action") {
      return (
        <TouchableOpacity
          key={index}
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={item.onPress}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.iconContainer,
                item.danger && styles.dangerIconContainer,
              ]}
            >
              <item.icon
                size={20}
                color={item.danger ? "#EF4444" : "#6B7280"}
                strokeWidth={2}
              />
            </View>
            <Text
              style={[
                styles.settingLabel,
                item.danger && styles.dangerLabel,
              ]}
            >
              {item.label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.settingItem}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <item.icon size={20} color="#6B7280" strokeWidth={2} />
          </View>
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderSettingItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete your account?</Text>
            </View>
            <Text style={styles.modalDescription}>
              This action is permanent and will remove your data and bookings
              history that can legally be removed.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeleteButtonText}>
                  Delete account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dangerIconContainer: {
    backgroundColor: "#FEF2F2",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  dangerLabel: {
    color: "#EF4444",
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  modalDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

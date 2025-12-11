import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Lock,
  MessageSquare,
  FileText,
  Trash2,
  LogOut,
  Smartphone,
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
  TextInput,
  Linking,
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
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [verifyPhoneModalVisible, setVerifyPhoneModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleSendCode = () => {
    if (!phone || phone.length < 10) {
      return;
    }
    setCodeSent(true);
  };

  const handleVerifyPhone = () => {
    if (!code || code.length !== 6) {
      return;
    }
    setPhoneVerified(true);
    setVerifyPhoneModalVisible(false);
    setCodeSent(false);
    setPhone("");
    setCode("");
  };

  const settingsSections = [
    {
      title: "Account Security",
      items: [
        {
          icon: Smartphone,
          label: phoneVerified ? "Phone verified" : "Verify phone number",
          type: "link" as const,
          verified: phoneVerified,
          onPress: () => !phoneVerified && setVerifyPhoneModalVisible(true),
        },
      ],
    },
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
      title: "Help & Legal",
      items: [
        {
          icon: FileText,
          label: "Terms of Service",
          type: "link" as const,
          onPress: () => Linking.openURL("https://artisanhubb.com/terms"),
        },
        {
          icon: Lock,
          label: "Privacy Policy",
          type: "link" as const,
          onPress: () => Linking.openURL("https://artisanhubb.com/privacy"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: LogOut,
          label: "Sign out",
          type: "action" as const,
          onPress: () => setSignOutModalVisible(true),
        },
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
        onPress={item.onPress}
        disabled={item.verified}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, item.verified && styles.verifiedIconContainer]}>
            <item.icon size={20} color={item.verified ? "#10B981" : "#6B7280"} strokeWidth={2} />
          </View>
          <Text style={[styles.settingLabel, item.verified && styles.verifiedLabel]}>{item.label}</Text>
        </View>
        {!item.verified && <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />}
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
              This action is permanent. You can recover your account within 30 days.
              After 30 days, your account will be deleted forever.
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password to confirm"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setPassword("");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDeleteButton,
                  !password && styles.modalDeleteButtonDisabled,
                ]}
                onPress={() => {
                  if (password) {
                    console.log("Account deleted");
                    setDeleteModalVisible(false);
                    setPassword("");
                  }
                }}
                activeOpacity={0.7}
                disabled={!password}
              >
                <Text style={styles.modalDeleteButtonText}>
                  Delete account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSignOutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setSignOutModalVisible(false);
                  console.log("Sign out");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmButtonText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={verifyPhoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setVerifyPhoneModalVisible(false);
          setCodeSent(false);
          setPhone("");
          setCode("");
        }}
      >
        <View style={styles.phoneModalOverlay}>
          <View style={styles.phoneModalContent}>
            <View style={styles.phoneModalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <TouchableOpacity
                onPress={() => {
                  setVerifyPhoneModalVisible(false);
                  setCodeSent(false);
                  setPhone("");
                  setCode("");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              {!codeSent 
                ? "Enter your phone number to receive a verification code"
                : "Enter the 6-digit code sent to your phone"}
            </Text>

            <View style={styles.phoneInputGroup}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <TextInput
                style={[styles.phoneInput, codeSent && styles.phoneInputDisabled]}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!codeSent}
              />
            </View>

            {codeSent && (
              <View style={styles.phoneInputGroup}>
                <Text style={styles.phoneLabel}>Verification Code</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.phoneModalButton,
                (!phone || (codeSent && !code)) && styles.phoneModalButtonDisabled,
              ]}
              onPress={codeSent ? handleVerifyPhone : handleSendCode}
              disabled={!phone || (codeSent && !code)}
              activeOpacity={0.7}
            >
              <Text style={styles.phoneModalButtonText}>
                {codeSent ? "Verify Phone" : "Send Code"}
              </Text>
            </TouchableOpacity>

            {codeSent && (
              <TouchableOpacity
                style={styles.resendLink}
                onPress={handleSendCode}
                activeOpacity={0.7}
              >
                <Text style={styles.resendLinkText}>Resend Code</Text>
              </TouchableOpacity>
            )}
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
  modalDeleteButtonDisabled: {
    backgroundColor: "#FCA5A5",
    opacity: 0.6,
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  passwordInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C2C2C",
    marginBottom: 24,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  verifiedIconContainer: {
    backgroundColor: "#D1FAE5",
  },
  verifiedLabel: {
    color: "#10B981",
    fontWeight: "600" as const,
  },
  phoneModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  phoneModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  phoneModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "400" as const,
  },
  phoneInputGroup: {
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C2C2C",
  },
  phoneInputDisabled: {
    opacity: 0.6,
  },
  phoneModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  phoneModalButtonDisabled: {
    opacity: 0.5,
  },
  phoneModalButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  resendLink: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  resendLinkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});

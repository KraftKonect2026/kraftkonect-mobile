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
import { View, Text, StyleSheet, ScrollView, Switch, Modal, Linking,  } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";
import { useAppDispatch } from "@/store";

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
  const dispatch = useAppDispatch();

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
          onPress: () => Linking.openURL("https://kraftkonect.com/terms"),
        },
        {
          icon: Lock,
          label: "Privacy Policy",
          type: "link" as const,
          onPress: () => Linking.openURL("https://kraftkonect.com/privacy"),
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

      {/* Delete Account Modal */}
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
            <Input
              placeholder="Enter your password to confirm"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ marginBottom: 24 }}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                textStyle={{ color: "#6B7280" }}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setPassword("");
                }}
              />
              <Button
                title="Delete account"
                disabled={!password}
                onPress={() => {
                  if (password) {
                    console.log("Account deleted");
                    setDeleteModalVisible(false);
                    setPassword("");
                  }
                }}
                style={{ flex: 1, backgroundColor: "#EF4444", borderColor: "#EF4444" }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Modal */}
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
              <Button
                title="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                textStyle={{ color: "#6B7280" }}
                onPress={() => setSignOutModalVisible(false)}
              />
              <Button
                title="Sign out"
                onPress={() => {
                  dispatch({ type: "auth/signOut" });
                  router.replace("/get-started");
                  setSignOutModalVisible(false);
                }}
                style={{ flex: 1 }}
              />
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

            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!codeSent}
              style={codeSent ? { opacity: 0.6 } : undefined}
              containerStyle={{ marginBottom: 16 }}
            />

            {codeSent && (
              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                containerStyle={{ marginBottom: 16 }}
              />
            )}

            <Button
              title={codeSent ? "Verify Phone" : "Send Code"}
              onPress={codeSent ? handleVerifyPhone : handleSendCode}
              disabled={!phone || (codeSent && !code)}
              style={{ marginTop: 8 }}
            />

            {codeSent && (
              <Button
                title="Resend Code"
                variant="outline"
                style={{ borderWidth: 0, height: 48, marginTop: 8 }}
                textStyle={{ color: Colors.primary, fontWeight: "600", fontSize: 16 }}
                onPress={handleSendCode}
              />
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

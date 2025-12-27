import {
  User,
  ChevronRight,
  Edit3,
  CreditCard,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: Edit3,
          label: "Edit Profile",
          route: "/edit-profile",
        },
        {
          icon: CreditCard,
          label: "Payment Methods",
          route: "/payment-methods",
        },
        {
          icon: SettingsIcon,
          label: "Settings & Privacy",
          route: "/settings",
        },
      ],
    },
    {
      title: "Provider Mode",
      items: [
        {
          icon: ArrowRight,
          label: "Become a Provider",
          subtitle: "Offer your services on Artisanhubb",
          route: null,
          special: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          route: null,
          onPress: () => Linking.openURL("https://artisanhubb.com/help"),
        },
        {
          icon: HelpCircle,
          label: "Contact Support",
          route: null,
          onPress: () => setContactModalVisible(true),
        },
      ],
    },
  ];

  const renderMenuItem = (item: any, index: number) => {
    if (item.special) {
      return (
        <TouchableOpacity
          key={index}
          style={styles.specialMenuItem}
          activeOpacity={0.7}
          onPress={() => {
            if (item.route) {
              router.push(item.route);
            } else {
              router.push("/provider-onboarding/welcome" as any);
            }
          }}
        >
          <View style={styles.specialMenuItemContent}>
            <View style={styles.menuItemLeft}>
              <View style={styles.specialIconContainer}>
                <item.icon size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.specialMenuItemText}>{item.label}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={Colors.primary} strokeWidth={2} />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={() => {
          if (item.route) {
            router.push(item.route);
          } else if (item.onPress) {
            item.onPress();
          }
        }}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            <item.icon size={20} color="#6B7280" strokeWidth={2} />
          </View>
          <Text style={styles.menuItemText}>{item.label}</Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color={Colors.primary} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
        </View>

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderMenuItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {user?.role === "provider" && <View style={[styles.floatingButton, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.switchToProviderButton}
          activeOpacity={0.9}
          disabled={user?.role !== "provider"}
          onPress={() => user?.role === "provider" ? router.replace("/provider/(tabs)/today" as any) : null }
        >
          <Text style={styles.switchToProviderText}>Switch to Provider</Text>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>}

      <Modal
        visible={contactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <Text style={styles.modalDescription}>
              Get in touch with our support team
            </Text>
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL("mailto:support@artisanhubb.com")}
            >
              <View style={styles.contactIconContainer}>
                <Mail size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@artisanhubb.com</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL("tel:+1234567890")}
            >
              <View style={styles.contactIconContainer}>
                <Phone size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+1 (234) 567-890</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={() => setContactModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  contentContainer: {
    paddingBottom: 100,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
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
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  specialMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  specialMenuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  specialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  specialMenuItemText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  version: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  floatingButton: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  switchToProviderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  switchToProviderText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  closeButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

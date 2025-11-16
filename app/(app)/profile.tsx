import {
  User,
  LogOut,
  ChevronRight,
  Edit3,
  CreditCard,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowRight,
} from "lucide-react-native";
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

import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

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
        },
        {
          icon: HelpCircle,
          label: "Contact Support",
          route: null,
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

        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#EF4444" strokeWidth={2} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <View style={[styles.floatingButton, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.switchToProviderButton}
          activeOpacity={0.9}
        >
          <Text style={styles.switchToProviderText}>Switch to Provider</Text>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
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
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
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
});

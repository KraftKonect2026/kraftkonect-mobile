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
import {
  User,
  DollarSign,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Star,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useProvider } from "@/contexts/ProviderContext";

export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { earnings } = useProvider();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={48} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.name}>Provider Name</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FCD34D" strokeWidth={2} fill="#FCD34D" />
            <Text style={styles.rating}>4.9</Text>
            <Text style={styles.ratingCount}>(127 reviews)</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Earnings This Week</Text>
          <Text style={styles.earningsValue}>${earnings.thisWeek}</Text>
          <TouchableOpacity
            style={styles.earningsButton}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/earnings" as any)}
          >
            <DollarSign size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.earningsButtonText}>View Earnings</Text>
            <ChevronRight size={16} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Edit Profile</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push("/provider/settings" as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <SettingsIcon size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <HelpCircle size={20} color="#6B7280" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Help Center</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.9}
          onPress={() => router.replace("/(app)/profile" as any)}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabButtonText}>Switch to Customer</Text>
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
    paddingTop: 24,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
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
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  earningsCard: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  earningsTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  earningsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    gap: 6,
  },
  earningsButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
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
    borderWidth: 1,
    borderColor: "#F3F4F6",
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
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#2C2C2C",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },
  fab: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  fabButton: {
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
  fabButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

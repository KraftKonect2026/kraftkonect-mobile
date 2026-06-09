import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Linking,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Clock, Mail, MessageCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Button } from "@/components/Button";

export default function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to reach us?",
      [
        {
          text: "Email",
          onPress: () => Linking.openURL("mailto:support@kraftkonect.com"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Clock size={64} color={Colors.primary} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Application Submitted!</Text>
          <Text style={styles.subtitle}>
            Your provider profile is under review
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>PENDING REVIEW</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            Our team is reviewing your application and verifying your documents.
            This process typically takes 24-48 hours.
          </Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>What&apos;s next:</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineItemTitle}>Document Review</Text>
              <Text style={styles.timelineItemDescription}>
                We&apos;re verifying your ID and credentials
              </Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineItemTitle}>Quality Check</Text>
              <Text style={styles.timelineItemDescription}>
                Ensuring all information meets our standards
              </Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineItemTitle}>Final Approval</Text>
              <Text style={styles.timelineItemDescription}>
                You&apos;ll receive an email with the decision
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.notificationCard}>
          <Mail size={24} color={Colors.primary} strokeWidth={2} />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Check your email</Text>
            <Text style={styles.notificationText}>
              We&apos;ll send updates to your registered email address
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Contact Support"
            onPress={handleContactSupport}
            icon={<MessageCircle size={20} color="#FFFFFF" strokeWidth={2.5} />}
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Back to Profile"
            variant="outline"
            style={{ borderWidth: 0, height: 48 }}
            textStyle={{ color: "#6B7280", fontWeight: "500", fontSize: 15 }}
            onPress={() => router.replace("/(app)/profile" as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  statusCard: {
    padding: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#92400E",
  },
  statusDescription: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 22,
  },
  timelineCard: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 16,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineItemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  timelineItemDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    marginBottom: 32,
    gap: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  doneButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
});

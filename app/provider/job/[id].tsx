import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useProvider } from "@/contexts/ProviderContext";

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { jobs, updateJobStatus } = useProvider();

  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </View>
    );
  }

  const handleAccept = () => {
    Alert.alert("Accept Booking", "Confirm this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          updateJobStatus(job.id, "confirmed");
          Alert.alert("Success", "Booking confirmed!");
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert("Reject Booking", "Are you sure you want to reject this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          updateJobStatus(job.id, "cancelled");
          router.back();
        },
      },
    ]);
  };

  const handleStartJob = () => {
    updateJobStatus(job.id, "in-progress");
    Alert.alert("Job Started", "The timer has started for this job.");
  };

  const handleCompleteJob = () => {
    Alert.alert(
      "Complete Job",
      "Mark this job as completed? This will release payment to you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            updateJobStatus(job.id, "completed");
            Alert.alert("Success", "Job completed! Payment will be processed.");
            router.back();
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "pending":
        return "#FEF3C7";
      case "confirmed":
        return "#DBEAFE";
      case "in-progress":
        return "#E0E7FF";
      case "completed":
        return "#D1FAE5";
      case "cancelled":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const getStatusTextColor = () => {
    switch (job.status) {
      case "pending":
        return "#92400E";
      case "confirmed":
        return Colors.primary;
      case "in-progress":
        return "#4F46E5";
      case "completed":
        return "#065F46";
      case "cancelled":
        return "#991B1B";
      default:
        return "#374151";
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}
        >
          <Text style={[styles.statusText, { color: getStatusTextColor() }]}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace("-", " ")}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer</Text>
          </View>
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <User size={32} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{job.customerName}</Text>
                <Text style={styles.customerCategory}>{job.category} Service</Text>
              </View>
            </View>
            <View style={styles.customerActions}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Phone size={20} color={Colors.primary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={() => router.push(`/chat/${job.id}` as any)}
              >
                <MessageCircle size={20} color={Colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Details</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.serviceTitle}>{job.service}</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Calendar size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(job.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{job.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{job.address}</Text>
              </View>
              <View style={[styles.detailRow, styles.priceRow]}>
                <DollarSign size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.priceValue}>${job.price}</Text>
              </View>
            </View>
          </View>
        </View>

        {job.status !== "cancelled" && job.status !== "completed" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.progressSteps}>
                <View
                  style={[
                    styles.progressStep,
                    styles.progressStepCompleted,
                  ]}
                >
                  <View style={styles.progressStepCircle}>
                    <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.progressStepText}>Booked</Text>
                </View>
                <View
                  style={[
                    styles.progressLine,
                    (job.status === "confirmed" ||
                      job.status === "in-progress") &&
                      styles.progressLineCompleted,
                  ]}
                />
                <View
                  style={[
                    styles.progressStep,
                    (job.status === "confirmed" ||
                      job.status === "in-progress") &&
                      styles.progressStepCompleted,
                  ]}
                >
                  <View style={styles.progressStepCircle}>
                    {job.status === "confirmed" ||
                    job.status === "in-progress" ? (
                      <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                    ) : (
                      <View style={styles.progressStepDot} />
                    )}
                  </View>
                  <Text style={styles.progressStepText}>Confirmed</Text>
                </View>
                <View
                  style={[
                    styles.progressLine,
                    styles.progressLineCompleted,
                  ]}
                />
                <View
                  style={[
                    styles.progressStep,
                    styles.progressStepCompleted,
                  ]}
                >
                  <View style={styles.progressStepCircle}>
                    <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.progressStepText}>Completed</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {job.status === "pending" && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              activeOpacity={0.8}
              onPress={handleReject}
            >
              <XCircle size={20} color="#EF4444" strokeWidth={2} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              activeOpacity={0.8}
              onPress={handleAccept}
            >
              <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        {job.status === "confirmed" && (
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleStartJob}
          >
            <Text style={styles.primaryButtonText}>Start Job</Text>
          </TouchableOpacity>
        )}
        {job.status === "in-progress" && (
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleCompleteJob}
          >
            <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statusBanner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  customerCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  customerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  customerCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  customerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 20,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    textAlign: "right",
    flex: 2,
  },
  priceRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
    textAlign: "right",
    flex: 2,
  },
  progressSteps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressStepCompleted: {
    opacity: 1,
  },
  progressStepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9CA3AF",
  },
  progressStepText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: -20,
  },
  progressLineCompleted: {
    backgroundColor: Colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
});

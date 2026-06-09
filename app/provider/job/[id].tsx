import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform, ActivityIndicator,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
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
import { BOOKINGS_FOR_PROVIDER_QUERY } from "@/lib/queries";
import { UPDATE_BOOKING_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";
import { useOpenChat } from "@/lib/useOpenChat";

function toNaira(cents: number): string {
  return `₦${(cents / 100).toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#FEF3C7",
  confirmed: "#DBEAFE",
  in_progress: "#E0E7FF",
  completed: "#D1FAE5",
  cancelled: "#FEE2E2",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: "#92400E",
  confirmed: Colors.primary,
  in_progress: "#4F46E5",
  completed: "#065F46",
  cancelled: "#991B1B",
};

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const openChat = useOpenChat();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Read from cache (populated by today.tsx) and refetch if needed
  const { data, loading } = useQuery(BOOKINGS_FOR_PROVIDER_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const [updateBooking, { loading: updating }] = useMutation(
    UPDATE_BOOKING_MUTATION,
    {
      refetchQueries: [{ query: BOOKINGS_FOR_PROVIDER_QUERY }],
      onError: () => toast.error("Update failed, try again"),
    },
  );

  const booking = (data?.bookingsForProvider ?? []).find(
    (b: any) => b.id === id,
  );

  // ── Status change helpers ───────────────────────────────────────────────────
  const changeStatus = (newStatus: string, successMsg: string, afterFn?: () => void) => {
    updateBooking({ variables: { id, status: newStatus } })
      .then(() => {
        toast.success(successMsg);
        afterFn?.();
      })
      .catch(() => {});
  };

  const handleAccept = () => {
    Alert.alert("Accept Booking", "Confirm this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => changeStatus("confirmed", "Booking confirmed!"),
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert("Reject Booking", "Are you sure you want to reject?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => changeStatus("cancelled", "Booking rejected", () => router.back()),
      },
    ]);
  };

  const handleStartJob = () =>
    changeStatus("in_progress", "Job started — timer running");

  const handleCompleteJob = () => {
    Alert.alert(
      "Complete Job",
      "Mark as completed? This will release payment to you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () =>
            changeStatus("completed", "Job completed! Payment will be processed.", () =>
              router.back(),
            ),
        },
      ],
    );
  };

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (loading && !booking) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
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

  const status: string = booking.status;
  const customerName: string = booking.customer?.name ?? "Customer";
  const customerPhone: string = booking.customer?.phone ?? "";
  const service: string = booking.listing?.title ?? booking.description ?? "Service";
  const category: string = booking.listing?.category ?? booking.aiParsedSkill ?? "General";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[status] ?? "#F3F4F6" }]}>
          <Text style={[styles.statusText, { color: STATUS_TEXT_COLORS[status] ?? "#374151" }]}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </Text>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <User size={32} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{customerName}</Text>
                <Text style={styles.customerCategory}>{category} Service</Text>
              </View>
            </View>
            <View style={styles.customerActions}>
              {customerPhone ? (
                <TouchableOpacity
                  style={styles.iconButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    const url =
                      Platform.OS === "ios"
                        ? `telprompt:${customerPhone}`
                        : `tel:${customerPhone}`;
                    Linking.openURL(url).catch(() =>
                      Alert.alert("Error", "Unable to make phone call"),
                    );
                  }}
                >
                  <Phone size={20} color={Colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={() =>
                  booking.customer?.id &&
                  openChat(
                    booking.customer.id,
                    booking.customer.name ?? "Customer",
                    booking.customer.avatarUrl ?? "",
                  )
                }
              >
                <MessageCircle size={20} color={Colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Service details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.card}>
            <Text style={styles.serviceTitle}>{service}</Text>
            <View style={styles.detailsList}>
              {booking.bookingDate ? (
                <>
                  <View style={styles.detailRow}>
                    <Calendar size={20} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(booking.bookingDate)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={20} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{formatTime(booking.bookingDate)}</Text>
                  </View>
                </>
              ) : null}
              {booking.notes ? (
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{booking.notes}</Text>
                </View>
              ) : null}
              <View style={[styles.detailRow, styles.priceRow]}>
                <DollarSign size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.priceValue}>
                  {toNaira(booking.totalPriceCents ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress */}
        {status !== "cancelled" && status !== "completed" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.card}>
              <View style={styles.progressSteps}>
                <View style={[styles.progressStep, styles.progressStepCompleted]}>
                  <View style={styles.progressStepCircle}>
                    <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.progressStepText}>Booked</Text>
                </View>
                <View style={[styles.progressLine, (status === "confirmed" || status === "in_progress") && styles.progressLineCompleted]} />
                <View style={[styles.progressStep, (status === "confirmed" || status === "in_progress") && styles.progressStepCompleted]}>
                  <View style={styles.progressStepCircle}>
                    {status === "confirmed" || status === "in_progress" ? (
                      <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                    ) : (
                      <View style={styles.progressStepDot} />
                    )}
                  </View>
                  <Text style={styles.progressStepText}>Confirmed</Text>
                </View>
                <View style={[styles.progressLine, status === "in_progress" && styles.progressLineCompleted]} />
                <View style={[styles.progressStep, status === "in_progress" && styles.progressStepCompleted]}>
                  <View style={styles.progressStepCircle}>
                    {status === "in_progress" ? (
                      <CheckCircle size={20} color={Colors.primary} strokeWidth={2} />
                    ) : (
                      <View style={styles.progressStepDot} />
                    )}
                  </View>
                  <Text style={styles.progressStepText}>In Progress</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer action buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {updating ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <>
            {status === "pending" && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} activeOpacity={0.8} onPress={handleReject}>
                  <XCircle size={20} color="#EF4444" strokeWidth={2} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} activeOpacity={0.8} onPress={handleAccept}>
                  <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
            {status === "confirmed" && (
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleStartJob}>
                <Text style={styles.primaryButtonText}>Start Job</Text>
              </TouchableOpacity>
            )}
            {status === "in_progress" && (
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleCompleteJob}>
                <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: "#2C2C2C" },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  statusBanner: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: "center", marginBottom: 24 },
  statusText: { fontSize: 14, fontWeight: "700" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 12 },
  card: { padding: 20, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6" },
  customerCard: { padding: 20, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6" },
  customerInfo: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  customerAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 16 },
  customerDetails: { flex: 1 },
  customerName: { fontSize: 20, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 4 },
  customerCategory: { fontSize: 14, color: "#6B7280" },
  customerActions: { flexDirection: "row", gap: 12 },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  serviceTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 20 },
  detailsList: { gap: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  detailValue: { fontSize: 14, fontWeight: "600" as const, color: "#2C2C2C", textAlign: "right", flex: 2 },
  priceRow: { paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  priceValue: { fontSize: 20, fontWeight: "700" as const, color: Colors.primary, textAlign: "right", flex: 2 },
  progressSteps: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressStep: { alignItems: "center", flex: 1 },
  progressStepCompleted: { opacity: 1 },
  progressStepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  progressStepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#9CA3AF" },
  progressStepText: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginHorizontal: -20 },
  progressLineCompleted: { backgroundColor: Colors.primary },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 20, backgroundColor: "#FFFFFF",
    borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  buttonRow: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 8 },
  rejectButton: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FEE2E2" },
  rejectButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#EF4444" },
  acceptButton: { backgroundColor: Colors.primary },
  acceptButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#FFFFFF" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.primary, gap: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#FFFFFF" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#6B7280" },
});

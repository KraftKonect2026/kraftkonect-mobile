import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  RefreshCw,
  X,
  RotateCw,
} from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, Alert, ActivityIndicator,  } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useLazyQuery } from "@apollo/client";

import Colors from "@/constants/colors";
import { BOOKING_DETAIL_QUERY, PROVIDER_QUERY } from "@/lib/queries";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const { data, loading, error, refetch } = useQuery(BOOKING_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const [fetchProvider, { loading: checkingAvailability }] = useLazyQuery(
    PROVIDER_QUERY,
    { fetchPolicy: "network-only" },
  );

  // Loading state
  if (loading && !data) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading booking…</Text>
      </View>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <Text style={styles.errorTitle}>Couldn't load booking</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button
          title="Retry"
          onPress={() => refetch()}
          icon={<RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />}
          style={{ width: "100%", marginTop: 8 }}
        />
      </View>
    );
  }

  // Map backend booking to the shape the UI expects
  const raw = data?.booking;
  if (!raw) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <Text style={styles.errorTitle}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.primary, fontWeight: "600" as const }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dt = new Date(raw.bookingDate);
  const booking = {
    id: raw.id,
    providerId: raw.provider?.id ?? "",
    providerName: raw.provider?.name ?? "Unknown",
    providerImage: raw.provider?.avatar ?? "",
    providerCategory: raw.provider?.categories?.[0] ?? raw.provider?.category ?? "",
    providerRating: raw.provider?.rating ? parseFloat(raw.provider.rating) : 0,
    serviceName: raw.listing?.title ?? raw.description ?? "Service",
    listingId: raw.listing?.id as string | undefined,
    date: dt.toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    time: dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    address: raw.description ?? raw.notes ?? "",
    cost: (raw.totalPriceCents ?? 0) / 100,
    currency: raw.currency ?? "ngn",
    status: raw.status as BookingStatus,
    bookingRef: raw.bookingRef ?? raw.id,
    notes: raw.notes as string | undefined,
    cancelReason: raw.status === "cancelled" ? raw.notes : undefined,
  };

  const handleRebook = async () => {
    try {
      const result = await fetchProvider({
        variables: { providerId: booking.providerId },
      });
      const provider = result.data?.provider;

      if (provider && provider.available === false) {
        Alert.alert(
          "Artisan Unavailable",
          "This artisan is currently unavailable — would you like to find a similar artisan nearby?",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Find Similar",
              onPress: () => router.push("/(app)/explore" as any),
            },
          ],
        );
        return;
      }

      if (booking.listingId) {
        router.push(
          `/(app)/booking/${booking.providerId}/date-time?serviceId=${booking.listingId}` as any,
        );
      } else {
        router.push(`/(app)/booking/${booking.providerId}/select-service` as any);
      }
    } catch {
      if (booking.listingId) {
        router.push(
          `/(app)/booking/${booking.providerId}/date-time?serviceId=${booking.listingId}` as any,
        );
      } else {
        router.push(`/(app)/booking/${booking.providerId}/select-service` as any);
      }
    }
  };

  const cancellationReasons = [
    "Found a better provider",
    "Service no longer needed",
    "Scheduling conflict",
    "Provider not responding",
    "Price too high",
    "Other",
  ];

  const handleCancelBooking = () => {
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    console.log("Booking cancelled with reason:", finalReason);
    setCancelModalVisible(false);
    setSelectedReason("");
    setCustomReason("");
    router.back();
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "#FEF3C7";
      case "confirmed":
        return "#DBEAFE";
      case "in_progress":
        return "#E0E7FF";
      case "completed":
        return "#D1FAE5";
      case "cancelled":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const getStatusTextColor = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "#92400E";
      case "confirmed":
        return "#1E3A8A";
      case "in_progress":
        return "#3730A3";
      case "completed":
        return "#065F46";
      case "cancelled":
        return "#991B1B";
      default:
        return "#374151";
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "Pending Provider Confirmation";
      case "confirmed":
        return "Confirmed";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getProgressStep = () => {
    switch (booking.status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "in_progress":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  const progressStep = getProgressStep();

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
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text
            style={[
              styles.statusBannerText,
              { color: getStatusTextColor(booking.status) },
            ]}
          >
            {getStatusText(booking.status)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Provider</Text>
          <View style={styles.providerSection}>
            <Image
              source={{ uri: booking.providerImage }}
              style={styles.providerImage}
              contentFit="cover"
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.providerName}</Text>
              <Text style={styles.providerCategory}>
                {booking.providerCategory}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>★ {booking.providerRating}</Text>
              </View>
            </View>
            <View style={styles.providerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Phone size={20} color={Colors.primary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={() => router.push(`/chat/${booking.providerId}`)}
              >
                <MessageCircle
                  size={20}
                  color={Colors.primary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking Ref</Text>
            <Text style={styles.infoValue}>{booking.bookingRef}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service</Text>
            <Text style={styles.infoValue}>{booking.serviceName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{booking.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{booking.time}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.addressHeader}>
            <MapPin size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Service Location</Text>
          </View>
          <Text style={styles.addressText}>{booking.address}</Text>
        </View>

        {booking.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {booking.status !== "cancelled" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(progressStep / 3) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.progressSteps}>
                <View style={styles.progressStepItem}>
                  <View
                    style={[
                      styles.progressDot,
                      progressStep >= 0 && styles.progressDotActive,
                    ]}
                  />
                  <Text style={styles.progressLabel}>Booked</Text>
                </View>
                <View style={styles.progressStepItem}>
                  <View
                    style={[
                      styles.progressDot,
                      progressStep >= 1 && styles.progressDotActive,
                    ]}
                  />
                  <Text style={styles.progressLabel}>Confirmed</Text>
                </View>
                <View style={styles.progressStepItem}>
                  <View
                    style={[
                      styles.progressDot,
                      progressStep >= 3 && styles.progressDotActive,
                    ]}
                  />
                  <Text style={styles.progressLabel}>Completed</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Cost</Text>
            <Text style={styles.infoValue}>₦{booking.cost.toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Fee</Text>
            <Text style={styles.infoValue}>
              ₦{(booking.cost * 0.1).toLocaleString()}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₦{(booking.cost * 1.1).toLocaleString()}
            </Text>
          </View>
          <View style={styles.escrowBanner}>
            <Text style={styles.escrowText}>
              💳 Your payment is held securely until the service is marked
              completed
            </Text>
          </View>
        </View>

        {booking.status === "cancelled" && booking.cancelReason && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cancellation Reason</Text>
            <Text style={styles.notesText}>{booking.cancelReason}</Text>
          </View>
        )}
      </ScrollView>

      {(booking.status === "pending" ||
        booking.status === "confirmed" ||
        booking.status === "in_progress") && (
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <Button
            title="Message Provider"
            onPress={() => router.push(`/chat/${booking.providerId}`)}
            icon={<MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />}
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Cancel Booking"
            variant="outline"
            style={{ borderColor: "#FEE2E2", backgroundColor: "#FEF2F2" }}
            textStyle={{ color: "#EF4444" }}
            icon={<X size={20} color="#EF4444" strokeWidth={2} />}
            onPress={() => setCancelModalVisible(true)}
          />
        </View>
      )}

      {booking.status === "completed" && (
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          {/* AC1: Book Again only on completed bookings */}
          <Button
            title="Book Again"
            onPress={handleRebook}
            loading={checkingAvailability}
            icon={<RotateCw size={20} color="#FFFFFF" strokeWidth={2} />}
            style={{ marginBottom: 12 }}
          />

          <Button
            title="Leave a Review"
            variant="outline"
            onPress={() => router.push(`/review/${booking.id}` as any)}
          />
        </View>
      )}

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setCancelModalVisible(false);
            setSelectedReason("");
            setCustomReason("");
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Booking?</Text>
              <Text style={styles.modalDescription}>
                Please select a reason for canceling this booking
              </Text>

              <View style={styles.reasonsContainer}>
                {cancellationReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.reasonRadio,
                        selectedReason === reason && styles.reasonRadioSelected,
                      ]}
                    >
                      {selectedReason === reason && (
                        <View style={styles.reasonRadioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason && styles.reasonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedReason === "Other" && (
                <Input
                  placeholder="Please specify your reason"
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, borderRadius: 20, marginBottom: 20 }}
                  inputStyle={{ textAlignVertical: "top", paddingTop: 12 }}
                />
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Go Back"
                  variant="outline"
                  style={{ flex: 1 }}
                  textStyle={{ color: "#6B7280" }}
                  onPress={() => {
                    setCancelModalVisible(false);
                    setSelectedReason("");
                    setCustomReason("");
                  }}
                />
                <Button
                  title="Confirm Cancel"
                  onPress={handleCancelBooking}
                  disabled={
                    !selectedReason ||
                    (selectedReason === "Other" && !customReason.trim())
                  }
                  style={{ flex: 1, backgroundColor: "#EF4444", borderColor: "#EF4444" }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centeredState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  stateText: { fontSize: 16, color: "#6B7280" },
  errorTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  errorText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  retryButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { fontSize: 15, fontWeight: "600" as const, color: "#FFFFFF" },
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
    padding: 16,
  },
  statusBanner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  providerSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#F59E0B",
  },
  providerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#2C2C2C",
    flex: 2,
    textAlign: "right",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 16,
    color: "#2C2C2C",
    lineHeight: 24,
  },
  notesText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStepItem: {
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  escrowBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
  },
  escrowText: {
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  messageProviderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  messageProviderButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  cancelBookingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
    gap: 8,
  },
  cancelBookingButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  rebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  rebookButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  reviewButtonLarge: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
  },
  reviewButtonLargeText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
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
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  reasonOptionSelected: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonRadioSelected: {
    borderColor: "#EF4444",
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  reasonText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  reasonTextSelected: {
    color: "#2C2C2C",
    fontWeight: "600" as const,
  },
  customReasonInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C2C2C",
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBackButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  modalBackButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  modalConfirmButtonDisabled: {
    backgroundColor: "#FCA5A5",
    opacity: 0.6,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

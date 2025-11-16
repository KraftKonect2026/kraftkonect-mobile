import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  X,
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
import { useRouter, useLocalSearchParams } from "expo-router";

import { mockBookings, BookingStatus } from "@/mocks/bookings";
import Colors from "@/constants/colors";

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const booking = mockBookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text>Booking not found</Text>
      </View>
    );
  }

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
            <Text style={styles.infoLabel}>Booking ID</Text>
            <Text style={styles.infoValue}>{booking.bookingId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service</Text>
            <Text style={styles.infoValue}>{booking.serviceName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(booking.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
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
            <Text style={styles.infoValue}>${booking.cost.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Fee</Text>
            <Text style={styles.infoValue}>
              ${(booking.cost * 0.1).toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${(booking.cost * 1.1).toFixed(2)}
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
          <TouchableOpacity
            style={styles.messageProviderButton}
            activeOpacity={0.8}
            onPress={() => router.push(`/chat/${booking.providerId}`)}
          >
            <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.messageProviderButtonText}>
              Message Provider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBookingButton}
            activeOpacity={0.8}
          >
            <X size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "completed" && !booking.reviewed && (
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <TouchableOpacity
            style={styles.reviewButtonLarge}
            activeOpacity={0.8}
            onPress={() => router.push(`/review/${booking.id}`)}
          >
            <Text style={styles.reviewButtonLargeText}>Leave a Review</Text>
          </TouchableOpacity>
        </View>
      )}
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
  reviewButtonLarge: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  reviewButtonLargeText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

import { Calendar, MessageCircle, X } from "lucide-react-native";
import React, { useState } from "react";
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

import { mockBookings, Booking, BookingStatus } from "@/mocks/bookings";
import Colors from "@/constants/colors";

type Tab = "active" | "completed" | "cancelled";

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const getFilteredBookings = () => {
    switch (activeTab) {
      case "active":
        return mockBookings.filter(
          (b) =>
            b.status === "pending" ||
            b.status === "confirmed" ||
            b.status === "in_progress"
        );
      case "completed":
        return mockBookings.filter((b) => b.status === "completed");
      case "cancelled":
        return mockBookings.filter((b) => b.status === "cancelled");
      default:
        return [];
    }
  };

  const filteredBookings = getFilteredBookings();

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
        return "Pending";
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

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/booking-detail/${booking.id}`)}
    >
      <View
        style={[
          styles.statusChip,
          { backgroundColor: getStatusColor(booking.status) },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: getStatusTextColor(booking.status) },
          ]}
        >
          {getStatusText(booking.status)}
        </Text>
      </View>

      <View style={styles.providerSection}>
        <Image
          source={{ uri: booking.providerImage }}
          style={styles.providerImage}
        />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{booking.providerName}</Text>
          <Text style={styles.providerCategory}>{booking.providerCategory}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue}>{booking.serviceName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>
            {new Date(booking.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at {booking.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cost</Text>
          <Text style={styles.costValue}>${booking.cost.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {booking.address}
          </Text>
        </View>
      </View>

      {activeTab === "active" && (
        <>
          <View style={styles.divider} />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <X size={16} color="#EF4444" strokeWidth={2} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/chat/${booking.providerId}`);
              }}
            >
              <MessageCircle size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {activeTab === "completed" && !booking.reviewed && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.reviewButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/review/${booking.id}`);
            }}
          >
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Your bookings</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.activeTab]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.activeTabText,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "completed" && styles.activeTab]}
            onPress={() => setActiveTab("completed")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "completed" && styles.activeTabText,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
            onPress={() => setActiveTab("cancelled")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "cancelled" && styles.activeTabText,
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              No {activeTab} bookings
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === "active" &&
                "Book a service and it will appear here"}
              {activeTab === "completed" &&
                "Completed bookings will show here"}
              {activeTab === "cancelled" &&
                "Cancelled bookings will show here"}
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {filteredBookings.map(renderBookingCard)}
          </View>
        )}
      </ScrollView>
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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  bookingsList: {
    padding: 16,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  providerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  providerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 2,
  },
  providerCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#2C2C2C",
    flex: 2,
    textAlign: "right",
  },
  costValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  reviewButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
});

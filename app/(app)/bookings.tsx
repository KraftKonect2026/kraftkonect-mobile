import { Calendar, MessageCircle, RefreshCw } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";

import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { BOOKINGS_FOR_USER_QUERY } from "@/lib/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";

interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  providerCategory: string;
  providerRating: number;
  serviceName: string;
  listingId?: string;
  date: string;
  time: string;
  address: string;
  cost: number;
  status: BookingStatus;
  bookingRef: string;
  notes?: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapBooking(b: any): Booking {
  const dt = new Date(b.bookingDate);
  return {
    id: b.id,
    providerId: b.provider?.id ?? "",
    providerName: b.provider?.name ?? "Unknown",
    providerImage: b.provider?.avatar ?? "",
    providerCategory:
      b.provider?.categories?.[0] ?? b.provider?.category ?? "",
    providerRating: b.provider?.rating ? parseFloat(b.provider.rating) : 0,
    serviceName: b.listing?.title ?? b.description ?? "Service",
    listingId: b.listing?.id,
    date: dt.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: dt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    address: b.description ?? b.notes ?? "",
    cost: (b.totalPriceCents ?? 0) / 100,
    status: b.status as BookingStatus,
    bookingRef: b.bookingRef ?? b.id,
    notes: b.notes ?? undefined,
  };
}

// ── Status helpers ─────────────────────────────────────────────────────────────

type Tab = "active" | "completed" | "cancelled";

const STATUS_BG: Record<BookingStatus, string> = {
  pending: "#FEF3C7",
  confirmed: "#DBEAFE",
  in_progress: "#E0E7FF",
  completed: "#D1FAE5",
  cancelled: "#FEE2E2",
  refunded: "#FEE2E2",
};

const STATUS_TEXT: Record<BookingStatus, string> = {
  pending: "#92400E",
  confirmed: "#1E3A8A",
  in_progress: "#3730A3",
  completed: "#065F46",
  cancelled: "#991B1B",
  refunded: "#991B1B",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const token = useAppSelector((state) => state.auth.accessToken);

  const { data, loading, error, refetch } = useQuery(BOOKINGS_FOR_USER_QUERY, {
    skip: !token,
    fetchPolicy: "cache-and-network",
  });

  const allBookings: Booking[] = (data?.bookingsForUser ?? []).map(mapBooking);

  const filteredBookings = allBookings.filter((b) => {
    if (activeTab === "active")
      return (
        b.status === "pending" ||
        b.status === "confirmed" ||
        b.status === "in_progress"
      );
    if (activeTab === "completed") return b.status === "completed";
    return b.status === "cancelled" || b.status === "refunded";
  });

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/booking-detail/${booking.id}` as any)}
    >
      <View
        style={[
          styles.statusChip,
          { backgroundColor: STATUS_BG[booking.status] },
        ]}
      >
        <Text style={[styles.statusText, { color: STATUS_TEXT[booking.status] }]}>
          {STATUS_LABEL[booking.status]}
        </Text>
      </View>

      <View style={styles.providerSection}>
        <Image
          source={{ uri: booking.providerImage }}
          style={styles.providerImage}
          contentFit="cover"
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
            {booking.date} at {booking.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cost</Text>
          <Text style={styles.costValue}>
            ₦{booking.cost.toLocaleString()}
          </Text>
        </View>
        {booking.address ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {booking.address}
            </Text>
          </View>
        ) : null}
      </View>

      {activeTab === "active" && (
        <>
          <View style={styles.divider} />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.messageButton}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/chat/${booking.providerId}` as any);
              }}
            >
              <MessageCircle size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {activeTab === "completed" && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.reviewButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/review/${booking.id}` as any);
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
          {(["active", "completed", "cancelled"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !data ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Loading your bookings…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Couldn't load bookings</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#E5E7EB" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={styles.emptyText}>
                {activeTab === "active" && "Book a service and it will appear here"}
                {activeTab === "completed" && "Completed bookings will show here"}
                {activeTab === "cancelled" && "Cancelled bookings will show here"}
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {filteredBookings.map(renderBookingCard)}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  tabContainer: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: "600" as const, color: "#6B7280" },
  activeTabText: { color: "#FFFFFF" },
  content: { flex: 1 },
  bookingsList: { padding: 16, gap: 16 },

  // Loading / error
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
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

  // Empty state
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
  emptyText: { fontSize: 16, color: "#9CA3AF", textAlign: "center", lineHeight: 24 },

  // Booking card
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
  statusText: { fontSize: 12, fontWeight: "600" as const },
  providerSection: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  providerImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6" },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 2 },
  providerCategory: { fontSize: 14, color: "#6B7280" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  detailsSection: { gap: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  detailValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#2C2C2C",
    flex: 2,
    textAlign: "right",
  },
  costValue: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", textAlign: "right" },
  buttonRow: { flexDirection: "row", gap: 12 },
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
  messageButtonText: { fontSize: 14, fontWeight: "600" as const, color: "#FFFFFF" },
  reviewButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  reviewButtonText: { fontSize: 14, fontWeight: "600" as const, color: "#FFFFFF" },
});

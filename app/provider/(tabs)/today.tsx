import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, RefreshControl,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import {
  DollarSign,
  Calendar,
  MessageCircle,
  Plus,
  ArrowUpRight,
  Clock,
  MapPin,
  User as UserIcon,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import {
  MY_PROVIDER_PROFILE_QUERY,
  BOOKINGS_FOR_PROVIDER_QUERY,
  GET_DEMAND_FORECAST_QUERY,
  GET_CONVERSATIONS_QUERY,
} from "@/lib/queries";
import { SET_AVAILABILITY_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(isoDate: string | undefined): string {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toNaira(cents: number): string {
  return `₦${(cents / 100).toLocaleString()}`;
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function todayEarnings(bookings: any[]): number {
  return bookings
    .filter((b) => b.status === "completed" && isToday(b.createdAt))
    .reduce((sum, b) => sum + (b.totalPriceCents ?? 0) / 100, 0);
}

export default function TodayDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [refreshing, setRefreshing] = useState(false);

  // ── Availability toggle ─────────────────────────────────────────────────────
  const [optimisticAvailable, setOptimisticAvailable] = useState<boolean | null>(null);

  const { data: profileData, refetch: refetchProfile } = useQuery(MY_PROVIDER_PROFILE_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: () => setOptimisticAvailable(null),
  });

  const [setAvailability, { loading: mutationLoading }] = useMutation(
    SET_AVAILABILITY_MUTATION,
    {
      update(cache, { data }) {
        if (!data?.setAvailability) return;
        cache.modify({
          id: cache.identify(data.setAvailability),
          fields: { available: () => data.setAvailability.available },
        });
      },
    },
  );

  const backendAvailable: boolean =
    profileData?.myProviderProfile?.available ?? false;
  const displayAvailable: boolean =
    optimisticAvailable !== null ? optimisticAvailable : backendAvailable;

  const handleToggle = async (newValue: boolean) => {
    setOptimisticAvailable(newValue);
    try {
      await setAvailability({ variables: { available: newValue } });
      toast.success(newValue ? "You enter market!" : "You don comot for market");
      setOptimisticAvailable(null);
    } catch {
      setOptimisticAvailable(null);
      toast.error("E no work, try again");
    }
  };

  // ── Jobs feed ───────────────────────────────────────────────────────────────
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(
    BOOKINGS_FOR_PROVIDER_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  // ── Unread messages ──────────────────────────────────────────────────────────
  const { data: conversationsData, refetch: refetchConversations } = useQuery(
    GET_CONVERSATIONS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const unreadMessages = (conversationsData?.getConversations ?? []).reduce(
    (sum: number, c: any) => sum + (c.unreadCount ?? 0),
    0,
  );

  // ── Demand insights ─────────────────────────────────────────────────────────
  const providerSkill: string | null =
    profileData?.myProviderProfile?.categories?.[0] ??
    profileData?.myProviderProfile?.category ??
    null;

  const { data: forecastData, loading: forecastLoading, refetch: refetchForecast } = useQuery(
    GET_DEMAND_FORECAST_QUERY,
    {
      variables: { skill: providerSkill ?? "" },
      skip: !providerSkill,
      fetchPolicy: "cache-and-network",
    },
  );

  const forecasts: any[] = forecastData?.getDemandForecast ?? [];

  const weekLabel = forecasts[0]?.weekStart
    ? `Week of ${new Date(forecasts[0].weekStart).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`
    : null;

  // ── Pull to refresh ─────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchBookings(),
      refetchConversations(),
      providerSkill ? refetchForecast() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [refetchProfile, refetchBookings, refetchConversations, refetchForecast, providerSkill]);

  const allBookings: any[] = bookingsData?.bookingsForProvider ?? [];

  const todayJobs = allBookings.filter((b) =>
    b.bookingDate ? isToday(b.bookingDate) : false,
  );

  const upcomingJobs = allBookings.filter(
    (b) => b.status !== "completed" && b.status !== "cancelled",
  );

  const earningsToday = todayEarnings(allBookings);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Availability toggle ──────────────────────────────────────────── */}
        <View
          style={[
            styles.availabilityCard,
            displayAvailable
              ? styles.availabilityCardOnline
              : styles.availabilityCardOffline,
          ]}
        >
          <View style={styles.availabilityLeft}>
            <View
              style={[
                styles.availabilityIconWrap,
                displayAvailable
                  ? styles.availabilityIconOnline
                  : styles.availabilityIconOffline,
              ]}
            >
              {displayAvailable ? (
                <Wifi size={22} color="#10B981" strokeWidth={2} />
              ) : (
                <WifiOff size={22} color="#6B7280" strokeWidth={2} />
              )}
            </View>
            <View>
              <Text
                style={[
                  styles.availabilityLabel,
                  displayAvailable
                    ? styles.availabilityLabelOnline
                    : styles.availabilityLabelOffline,
                ]}
              >
                {displayAvailable ? "I dey available" : "I no dey available"}
              </Text>
              <Text style={styles.availabilitySubLabel}>
                {displayAvailable
                  ? "Customers fit find you"
                  : "You don hide from search"}
              </Text>
            </View>
          </View>
          {mutationLoading ? (
            <ActivityIndicator
              size="small"
              color={displayAvailable ? "#10B981" : "#6B7280"}
              style={styles.availabilitySpinner}
            />
          ) : (
            <Switch
              value={displayAvailable}
              onValueChange={handleToggle}
              disabled={mutationLoading}
              trackColor={{ false: "#D1D5DB", true: "#BBF7D0" }}
              thumbColor={displayAvailable ? "#10B981" : "#9CA3AF"}
              ios_backgroundColor="#D1D5DB"
            />
          )}
        </View>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        <View style={styles.summaryCards}>
          <TouchableOpacity
            style={[styles.summaryCard, styles.summaryCardPrimary]}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/earnings" as any)}
          >
            <View style={styles.summaryCardIcon}>
              <DollarSign size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValue}>
              ₦{earningsToday.toLocaleString()}
            </Text>
            <Text style={styles.summaryCardLabel}>Today&apos;s Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/(tabs)/calendar" as any)}
          >
            <View style={styles.summaryCardIconSecondary}>
              <Calendar size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValueSecondary}>
              {todayJobs.length}
            </Text>
            <Text style={styles.summaryCardLabelSecondary}>Today&apos;s Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/(tabs)/messages" as any)}
          >
            <View style={styles.summaryCardIconSecondary}>
              <MessageCircle size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValueSecondary}>{unreadMessages}</Text>
            <Text style={styles.summaryCardLabelSecondary}>Unread Messages</Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Demand Insights ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.insightsTitleRow}>
              <Sparkles size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>AI Demand Insights</Text>
            </View>
            {weekLabel ? (
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>{weekLabel}</Text>
              </View>
            ) : null}
          </View>

          {!providerSkill ? (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsEmptyText}>
                Complete your provider profile to see demand insights for your skill.
              </Text>
            </View>
          ) : forecastLoading && forecasts.length === 0 ? (
            <View style={[styles.insightsCard, styles.insightsLoadingCard]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.insightsLoadingText}>Loading insights…</Text>
            </View>
          ) : forecasts.length === 0 ? (
            <View style={styles.insightsCard}>
              <Sparkles size={28} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.insightsEmptyTitle}>
                Insights loading — check back Monday
              </Text>
              <Text style={styles.insightsEmptyText}>
                Our AI analyses demand every week. New insights drop on Monday morning.
              </Text>
            </View>
          ) : (
            <View style={styles.insightsCard}>
              {forecasts.map((f: any, idx: number) => (
                <View
                  key={f.id}
                  style={[
                    styles.insightRow,
                    idx < forecasts.length - 1 && styles.insightRowBorder,
                  ]}
                >
                  {f.area ? (
                    <View style={styles.areaChip}>
                      <MapPin size={11} color={Colors.primary} strokeWidth={2.5} />
                      <Text style={styles.areaChipText}>{f.area}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.insightText}>{f.forecastText}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Today's schedule ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          </View>

          {bookingsLoading && allBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : todayJobs.length > 0 ? (
            <View style={styles.jobsList}>
              {todayJobs.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.jobCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(`/provider/job/${booking.id}` as any)
                  }
                >
                  <View style={styles.jobCardHeader}>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerAvatar}>
                        <UserIcon
                          size={20}
                          color={Colors.primary}
                          strokeWidth={2}
                        />
                      </View>
                      <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>
                          {booking.customer?.name ?? "Customer"}
                        </Text>
                        <Text style={styles.jobCategory}>
                          {booking.listing?.category ??
                            booking.aiParsedSkill ??
                            "Service"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        booking.status === "confirmed" &&
                          styles.statusBadgeConfirmed,
                        booking.status === "pending" &&
                          styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          booking.status === "confirmed" &&
                            styles.statusBadgeTextConfirmed,
                          booking.status === "pending" &&
                            styles.statusBadgeTextPending,
                        ]}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobService}>
                    {booking.listing?.title ??
                      booking.description ??
                      "Service"}
                  </Text>

                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailRow}>
                      <Clock size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.jobDetailText}>
                        {formatTime(booking.bookingDate)}
                      </Text>
                    </View>
                    {booking.notes ? (
                      <View style={styles.jobDetailRow}>
                        <MapPin size={16} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.jobDetailText}>
                          {booking.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.jobCardFooter}>
                    <Text style={styles.jobPrice}>
                      {toNaira(booking.totalPriceCents ?? 0)}
                    </Text>
                    <ArrowUpRight
                      size={20}
                      color={Colors.primary}
                      strokeWidth={2}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#D1D5DB" strokeWidth={2} />
              <Text style={styles.emptyStateTitle}>No jobs scheduled today</Text>
              <Text style={styles.emptyStateDescription}>
                Check your calendar for upcoming bookings
              </Text>
            </View>
          )}
        </View>

        {/* ── Upcoming jobs ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/provider/(tabs)/calendar" as any)}
            >
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingJobs.length === 0 && !bookingsLoading ? (
            <View style={[styles.emptyState, { paddingVertical: 24 }]}>
              <Text style={styles.emptyStateDescription}>
                No upcoming bookings
              </Text>
            </View>
          ) : (
            <View style={styles.upcomingJobsList}>
              {upcomingJobs.slice(0, 3).map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.upcomingJobCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(`/provider/job/${booking.id}` as any)
                  }
                >
                  <View style={styles.upcomingJobInfo}>
                    <Text style={styles.upcomingJobDate}>
                      {booking.bookingDate
                        ? new Date(booking.bookingDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )
                        : "—"}
                    </Text>
                    <Text style={styles.upcomingJobService}>
                      {booking.listing?.title ?? "Service"}
                    </Text>
                    <Text style={styles.upcomingJobCustomer}>
                      {booking.customer?.name ?? "Customer"}
                    </Text>
                  </View>
                  <View style={styles.upcomingJobActions}>
                    <Text style={styles.upcomingJobPrice}>
                      {toNaira(booking.totalPriceCents ?? 0)}
                    </Text>
                    <ArrowUpRight
                      size={16}
                      color={Colors.primary}
                      strokeWidth={2}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionButtons}>
              <TouchableOpacity
                style={styles.quickActionButton}
                activeOpacity={0.8}
                onPress={() => router.push("/provider/add-listing" as any)}
              >
                <Plus size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.quickActionButtonText}>Add Listing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push("/provider/(tabs)/calendar" as any)
                }
              >
                <Calendar size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.quickActionButtonText}>Availability</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 28, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: "#6B7280" },
  content: { flex: 1 },
  contentContainer: { padding: 16 },

  availabilityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  availabilityCardOnline: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  availabilityCardOffline: { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" },
  availabilityLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  availabilityIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  availabilityIconOnline: { backgroundColor: "#DCFCE7" },
  availabilityIconOffline: { backgroundColor: "#F3F4F6" },
  availabilityLabel: { fontSize: 16, fontWeight: "700" as const, marginBottom: 2 },
  availabilityLabelOnline: { color: "#15803D" },
  availabilityLabelOffline: { color: "#374151" },
  availabilitySubLabel: { fontSize: 12, color: "#6B7280" },
  availabilitySpinner: { width: 51, height: 31, justifyContent: "center", alignItems: "center" },

  summaryCards: { flexDirection: "row", gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1, padding: 16, backgroundColor: "#FFFFFF",
    borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6",
  },
  summaryCardPrimary: { backgroundColor: "#EFF6FF", borderColor: Colors.primary },
  summaryCardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  summaryCardIconSecondary: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  summaryCardValue: { fontSize: 20, fontWeight: "700" as const, color: Colors.primary, marginBottom: 4 },
  summaryCardLabel: { fontSize: 12, color: Colors.primary, fontWeight: "500" as const },
  summaryCardValueSecondary: { fontSize: 24, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 4 },
  summaryCardLabelSecondary: { fontSize: 12, color: "#6B7280" },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  sectionLink: { fontSize: 14, fontWeight: "600" as const, color: Colors.primary },

  jobsList: { gap: 12 },
  jobCard: {
    padding: 16, backgroundColor: "#FFFFFF",
    borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6",
  },
  jobCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  customerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  customerDetails: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 2 },
  jobCategory: { fontSize: 13, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeConfirmed: { backgroundColor: "#DBEAFE" },
  statusBadgePending: { backgroundColor: "#FEF3C7" },
  statusBadgeText: { fontSize: 12, fontWeight: "600" as const },
  statusBadgeTextConfirmed: { color: Colors.primary },
  statusBadgeTextPending: { color: "#92400E" },
  jobService: { fontSize: 15, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 12 },
  jobDetails: { gap: 8, marginBottom: 12 },
  jobDetailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  jobDetailText: { fontSize: 14, color: "#6B7280", flex: 1 },
  jobCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  jobPrice: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },

  emptyState: {
    alignItems: "center", paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6",
  },
  emptyStateTitle: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", marginTop: 16, marginBottom: 8 },
  emptyStateDescription: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  upcomingJobsList: { gap: 12 },
  upcomingJobCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#F3F4F6",
  },
  upcomingJobInfo: { flex: 1 },
  upcomingJobDate: { fontSize: 12, fontWeight: "600" as const, color: Colors.primary, marginBottom: 4 },
  upcomingJobService: { fontSize: 15, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 4 },
  upcomingJobCustomer: { fontSize: 13, color: "#6B7280" },
  upcomingJobActions: { alignItems: "flex-end", gap: 8 },
  upcomingJobPrice: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C" },

  quickActionsCard: {
    padding: 20, backgroundColor: "#FFFFFF",
    borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6",
  },
  quickActionsTitle: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 16 },
  quickActionButtons: { flexDirection: "row", gap: 12 },
  quickActionButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#EFF6FF",
    borderRadius: 12, gap: 8,
  },
  quickActionButtonText: { fontSize: 14, fontWeight: "600" as const, color: Colors.primary },

  // ── Demand insights ────────────────────────────────────────────────────────
  insightsTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  weekBadge: {
    backgroundColor: `${Colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  weekBadgeText: { fontSize: 11, fontWeight: "600" as const, color: Colors.primary },

  insightsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "flex-start",
    gap: 4,
  },
  insightsLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  insightsLoadingText: { fontSize: 14, color: "#6B7280" },
  insightsEmptyTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  insightsEmptyText: { fontSize: 13, color: "#9CA3AF", lineHeight: 18, textAlign: "center" },

  insightRow: { width: "100%", paddingVertical: 10, gap: 6 },
  insightRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  areaChipText: { fontSize: 11, fontWeight: "700" as const, color: Colors.primary },
  insightText: { fontSize: 14, color: "#374151", lineHeight: 20 },
});

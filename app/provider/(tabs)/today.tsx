import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, RefreshControl, Animated } from "react-native";
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
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import {
  MY_PROVIDER_PROFILE_QUERY,
  BOOKINGS_FOR_PROVIDER_QUERY,
  GET_DEMAND_FORECAST_QUERY,
  GET_CONVERSATIONS_QUERY,
} from "@/lib/queries";
import { SET_AVAILABILITY_MUTATION, START_KYC_INQUIRY_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";
import * as WebBrowser from "expo-web-browser";
import { Inquiry, Environment } from "react-native-persona";
import { BlurView } from "expo-blur";
import { ShieldAlert } from "lucide-react-native";

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
  const scrollY = useRef(new Animated.Value(0)).current;

  // Stagger entry animations
  const mountAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.stagger(
      90,
      mountAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 })
      )
    ).start();
  }, []);

  const makeSectionStyle = (index: number) => ({
    opacity: mountAnims[index],
    transform: [
      {
        translateY: mountAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  // ── Availability toggle ─────────────────────────────────────────────────────
  const [optimisticAvailable, setOptimisticAvailable] = useState<boolean | null>(null);

  const { data: profileData, refetch: refetchProfile } = useQuery(MY_PROVIDER_PROFILE_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: () => setOptimisticAvailable(null),
  });

  const [startKycInquiry, { loading: kycLoading }] = useMutation(START_KYC_INQUIRY_MUTATION);
  const [isVerifying, setIsVerifying] = useState(false);

  const pollKycStatus = () => {
    setIsVerifying(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await refetchProfile();
        const currentStatus = result.data?.myProviderProfile?.kycStatus;
        if (currentStatus === "approved" || attempts >= 8) {
          clearInterval(interval);
          setIsVerifying(false);
          if (currentStatus === "approved") {
            toast.success("Identity verification approved!");
          }
        }
      } catch (err) {
        console.warn("[pollKycStatus] refetch failed:", err);
        if (attempts >= 8) {
          clearInterval(interval);
          setIsVerifying(false);
        }
      }
    }, 2500);
  };

  const handleVerifyKyc = async () => {
    const providerId = profileData?.myProviderProfile?.id;
    if (!providerId) {
      toast.error("Failed to load provider profile. Please refresh.");
      return;
    }
    try {
      setIsVerifying(true);
      const res = await startKycInquiry({ variables: { providerId } });
      const { inquiryId, clientToken, inquiryUrl } = res.data?.startKycInquiry || {};
      if (!inquiryId || !inquiryUrl) {
        throw new Error("Failed to generate secure verification session.");
      }

      try {
        Inquiry.fromInquiry(inquiryId)
          .sessionToken(clientToken || "")
          .onComplete((completedInquiryId: string, status: string) => {
            console.log(`[Persona SDK] Inquiry completed: ${completedInquiryId}, status: ${status}`);
            toast.success("Identity verified successfully! Syncing status...");
            pollKycStatus();
          })
          .onCanceled((canceledInquiryId?: string) => {
            console.log(`[Persona SDK] Inquiry canceled: ${canceledInquiryId}`);
            toast.info("Identity verification canceled.");
            refetchProfile();
            setIsVerifying(false);
          })
          .onError((error: Error) => {
            console.warn(`[Persona SDK Error, falling back to WebBrowser]:`, error);
            WebBrowser.openBrowserAsync(inquiryUrl).then(() => {
              pollKycStatus();
            });
          })
          .build()
          .start();
      } catch (sdkErr) {
        console.warn("[Persona SDK Exception, falling back to WebBrowser]:", sdkErr);
        await WebBrowser.openBrowserAsync(inquiryUrl);
        pollKycStatus();
      }
    } catch (error: any) {
      console.error("KYC start failed:", error);
      toast.error(error.message || "Failed to start identity verification.");
      setIsVerifying(false);
    }
  };

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
    <ScreenBackground>
      <Animated.View style={{ zIndex: 1, transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -15], extrapolate: "clamp" }) }] }}>
        <LinearGradient
          colors={Gradients.brandDiagonal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Animated.View style={[styles.headerBubble1, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 150], outputRange: [0, 40], extrapolate: "clamp" }) }] }]} pointerEvents="none" />
          <Animated.View style={[styles.headerBubble2, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 150], outputRange: [0, -20], extrapolate: "clamp" }) }] }]} pointerEvents="none" />
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
      </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Availability toggle ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.availabilityCard,
            displayAvailable
              ? styles.availabilityCardOnline
              : styles.availabilityCardOffline,
            makeSectionStyle(0),
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
                {displayAvailable ? "I'm available" : "I'm not available"}
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
        </Animated.View>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        <Animated.View style={[styles.summaryCards, makeSectionStyle(1)]}>
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
        </Animated.View>

        {/* ── AI Demand Insights ───────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(2)]}>
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
        </Animated.View>

        {/* ── Today's schedule ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(3)]}>
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
        </Animated.View>

        {/* ── Upcoming jobs ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(4)]}>
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
        </Animated.View>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(5)]}>
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
        </Animated.View>
      </Animated.ScrollView>

      {/* KYC Lock Overlay */}
      {profileData?.myProviderProfile && profileData.myProviderProfile.kycStatus !== "approved" && (
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="light">
          <View style={styles.lockOverlayContainer}>
            <View style={styles.lockIconCircle}>
              <ShieldAlert size={48} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.lockTitle}>Verification Required</Text>
            <Text style={styles.lockDescription}>
              To continue using KraftKonect provider services, please verify your identity securely. This takes less than 2 minutes.
            </Text>
            <TouchableOpacity
              style={styles.lockButton}
              activeOpacity={0.8}
              disabled={isVerifying || kycLoading}
              onPress={handleVerifyKyc}
            >
              {isVerifying || kycLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.lockButtonText}>Verify with Persona</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.lockSecondaryButton}
              activeOpacity={0.8}
              disabled={isVerifying || kycLoading}
              onPress={() => router.replace("/(app)/(tabs)/profile" as any)}
            >
              <Text style={styles.lockSecondaryButtonText}>Switch back to Client mode</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  headerBubble1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.10)",
    top: -70,
    right: -40,
  },
  headerBubble2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -50,
    left: -10,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" as const, color: "#FFFFFF", marginBottom: 4, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: "500" as const },
  content: { flex: 1 },
  contentContainer: { padding: 16 },

  availabilityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    ...Shadows.soft,
  },
  availabilityCardOnline: { backgroundColor: "rgba(220,252,231,0.7)", borderColor: "rgba(134,239,172,0.8)" },
  availabilityCardOffline: { backgroundColor: "rgba(255,255,255,0.62)", borderColor: "rgba(255,255,255,0.65)" },
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
    flex: 1, padding: 16, ...glassSurface,
    borderRadius: Radius.lg, ...Shadows.soft,
  },
  summaryCardPrimary: { backgroundColor: "rgba(219,234,254,0.7)", borderColor: "rgba(37,99,235,0.35)" },
  summaryCardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  summaryCardIconSecondary: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.6)",
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
    padding: 16, ...glassSurface,
    borderRadius: Radius.lg, ...Shadows.soft,
  },
  jobCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  customerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(219,234,254,0.8)",
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
  jobCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(17,24,39,0.06)" },
  jobPrice: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },

  emptyState: {
    alignItems: "center", paddingVertical: 48, paddingHorizontal: 24,
    ...glassSurface, borderRadius: Radius.lg, ...Shadows.soft,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", marginTop: 16, marginBottom: 8 },
  emptyStateDescription: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  upcomingJobsList: { gap: 12 },
  upcomingJobCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, ...glassSurface, borderRadius: Radius.md, ...Shadows.soft,
  },
  upcomingJobInfo: { flex: 1 },
  upcomingJobDate: { fontSize: 12, fontWeight: "600" as const, color: Colors.primary, marginBottom: 4 },
  upcomingJobService: { fontSize: 15, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 4 },
  upcomingJobCustomer: { fontSize: 13, color: "#6B7280" },
  upcomingJobActions: { alignItems: "flex-end", gap: 8 },
  upcomingJobPrice: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C" },

  quickActionsCard: {
    padding: 20, ...glassSurface,
    borderRadius: Radius.lg, ...Shadows.soft,
  },
  quickActionsTitle: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 16 },
  quickActionButtons: { flexDirection: "row", gap: 12 },
  quickActionButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "rgba(219,234,254,0.7)",
    borderRadius: Radius.md, gap: 8, borderWidth: 1, borderColor: "rgba(37,99,235,0.18)",
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
    ...glassSurface,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: "flex-start",
    gap: 4,
    ...Shadows.soft,
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
  insightRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(17,24,39,0.06)" },
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

  lockOverlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  lockIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  lockDescription: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  lockButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  lockButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  lockSecondaryButton: {
    paddingVertical: 12,
  },
  lockSecondaryButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
});

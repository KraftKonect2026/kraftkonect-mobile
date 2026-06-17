import {
  AlertCircle,
  MapPin,
  Navigation,
  Search,
  Star,
  Zap,
  Droplet,
  Hammer,
  Paintbrush,
  Wind,
  Lock,
  Grid,
  Wrench,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Animated,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Input } from "@/components/Input";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useLazyQuery, useQuery } from "@apollo/client";

import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { PARSE_JOB_DESCRIPTION_QUERY, NEARBY_ARTISANS_QUERY } from "@/lib/queries";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Category tile data ────────────────────────────────────────────────────────

const CATEGORY_TILES = [
  { skill: "plumbing",   label: "Plumber",     image: require("@/assets/images/categories/uber_plumber_1781628659473.png") },
  { skill: "electrical", label: "Electrician", image: require("@/assets/images/categories/uber_electrician_1781628670944.png") },
  { skill: "carpentry",  label: "Carpenter",   image: require("@/assets/images/categories/uber_carpenter_1781628686657.png") },
  { skill: "painting",   label: "Painter",     image: require("@/assets/images/categories/uber_painter_1781628699760.png") },
  { skill: "tiling",     label: "Tiler",       image: require("@/assets/images/categories/uber_tiler_1781628786498.png") },
  { skill: "aircon",     label: "AC Repair",   image: require("@/assets/images/categories/uber_aircon_1781628725161.png") },
  { skill: "security",   label: "Locksmith",   image: require("@/assets/images/categories/uber_locksmith_1781628736111.png") },
  { skill: null,         label: "More",        image: require("@/assets/images/categories/uber_more_1781628813979.png") },
] as const;

const SKILL_LABEL: Record<string, string> = {
  plumbing:   "Plumbers",
  electrical: "Electricians",
  carpentry:  "Carpenters",
  painting:   "Painters",
  tiling:     "Tilers",
  aircon:     "AC Technicians",
  security:   "Locksmiths",
  cleaning:   "Cleaners",
  generator:  "Generator Technicians",
  general:    "Artisans",
};

const AI_TIMEOUT_MS = 5_000;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);

  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationState, setLocationState] = useState<"requesting" | "granted" | "denied">("requesting");
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animations ────────────────────────────────────────────────────────────

  const mountAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const tileScales = useRef(CATEGORY_TILES.map(() => new Animated.Value(1))).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const nearbyCardAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    Animated.stagger(
      80,
      mountAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 })
      )
    ).start();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (aiLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }
  }, [aiLoading]);

  const searchBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", Colors.primary],
  });

  const makeSectionStyle = (index: number) => ({
    opacity: mountAnims[index],
    transform: [
      {
        translateY: mountAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [32, 0],
        }),
      },
    ],
  });

  // ── Location ──────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          setLocationState("granted");
        } catch {
          setLocationState("denied");
        }
      } else {
        setLocationState("denied");
      }
    })();
  }, []);

  // ── Near you now ──────────────────────────────────────────────────────────

  const { data: nearbyData, loading: nearbyLoading, refetch: refetchNearby } = useQuery(NEARBY_ARTISANS_QUERY, {
    variables: {
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      radiusKm: 10,
    },
    skip: !token || locationState === "requesting",
    fetchPolicy: "cache-and-network",
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchNearby();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [refetchNearby]);

  const nearbyArtisans: any[] = nearbyData?.nearbyArtisans ?? [];

  useEffect(() => {
    if (nearbyArtisans.length === 0) return;
    nearbyCardAnims.current = nearbyArtisans.map(() => new Animated.Value(0));
    Animated.stagger(
      50,
      nearbyCardAnims.current.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 })
      )
    ).start();
  }, [nearbyArtisans.length]);

  // ── AI search ─────────────────────────────────────────────────────────────

  const [parseJob] = useLazyQuery(PARSE_JOB_DESCRIPTION_QUERY, { fetchPolicy: "no-cache" });

  const navigateToResults = useCallback(
    (skill: string | null, skillLabel: string) => {
      const params: Record<string, string> = { skillLabel };
      if (skill) params.skill = skill;
      if (coords) {
        params.lat = String(coords.lat);
        params.lon = String(coords.lon);
      }
      const qs = new URLSearchParams(params).toString();
      router.push(`/(app)/search?${qs}` as any);
    },
    [coords, router],
  );

  const handleAiSearch = useCallback(async () => {
    const text = query.trim();
    if (!text || aiLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAiLoading(true);
    setAiError(null);

    const timedOut = { value: false };
    timeoutRef.current = setTimeout(() => {
      timedOut.value = true;
      setAiLoading(false);
      // Timeout: just navigate to all artisans with the typed text as label
      navigateToResults(null, text);
    }, AI_TIMEOUT_MS);

    try {
      const { data, error } = await parseJob({ variables: { description: text } });
      if (timedOut.value) return;
      clearTimeout(timeoutRef.current!);

      // If AI succeeded and returned a skill, use it. Otherwise fall back to all artisans.
      const skill = data?.parseJobDescription?.skill ?? null;
      const suggestedTitle = data?.parseJobDescription?.suggestedTitle;
      const label = skill ? (SKILL_LABEL[skill] ?? suggestedTitle ?? "Artisans") : suggestedTitle ?? "Artisans near you";
      navigateToResults(skill, label);
    } catch {
      if (timedOut.value) return;
      clearTimeout(timeoutRef.current!);
      // AI failed (e.g. no credits) — still navigate to show all nearby artisans
      navigateToResults(null, "Artisans near you");
    } finally {
      if (!timedOut.value) setAiLoading(false);
    }
  }, [query, aiLoading, parseJob, navigateToResults]);

  const handleCategoryTap = useCallback(
    (index: number, skill: string | null, label: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const scale = tileScales[index];
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 65, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }),
      ]).start(() => {
        if (!skill) {
          router.push("/(app)/explore" as any);
          return;
        }
        navigateToResults(skill, label + "s");
      });
    },
    [tileScales, navigateToResults, router],
  );

  // ── Greeting ──────────────────────────────────────────────────────────────

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenBackground>
      {/* ── Hero Header ───────────────────────────────────────────────── */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 90], outputRange: [0, -90], extrapolate: "clamp" }) }]
      }}>
        <LinearGradient
          colors={Gradients.brandDiagonal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 24 }]}
        >
          {/* Decorative circles */}
          <Animated.View style={[styles.heroBubble1, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 150], outputRange: [0, 45], extrapolate: "clamp" }) }] }]} pointerEvents="none" />
          <Animated.View style={[styles.heroBubble2, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 150], outputRange: [0, -25], extrapolate: "clamp" }) }] }]} pointerEvents="none" />

          <Animated.View style={[styles.heroContent, makeSectionStyle(0), {
            opacity: scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: "clamp" })
          }]}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.greetingName}>{firstName} 👋</Text>
              </View>
              {locationState === "granted" && coords && (
                <View style={styles.locationPill}>
                  <Navigation size={12} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.locationPillText}>Near you</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroSubtitle}>What do you need fixed today?</Text>
          </Animated.View>

          {/* ── AI Search ──────────────────────────────────────────────── */}
          <Animated.View style={[styles.searchWrapper, makeSectionStyle(1)]}>
            <View style={styles.searchContainer}>
              <Sparkles size={18} color={Colors.primary} strokeWidth={2} style={styles.searchSparkle} />
              <Input
                placeholder="Describe your problem or search..."
                value={query}
                onChangeText={(t) => { setQuery(t); setAiError(null); }}
                onSubmitEditing={handleAiSearch}
                returnKeyType="search"
                editable={!aiLoading}
                blurOnSubmit={false}
                icon={<Search size={18} color={aiLoading ? "#D1D5DB" : "#9CA3AF"} strokeWidth={2} />}
                style={{ borderColor: searchBorderColor, borderWidth: 1.5, backgroundColor: "#FFFFFF" }}
              />
            </View>
            {aiLoading && (
              <View style={styles.aiLoadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.aiLoadingText}>Finding the right artisan for you…</Text>
              </View>
            )}
            {aiError && !aiLoading && (
              <View style={styles.aiErrorBanner}>
                <AlertCircle size={14} color="#92400E" strokeWidth={2} />
                <Text style={styles.aiErrorText}>{aiError}</Text>
              </View>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={{ height: insets.top + 190 }} />

        {/* ── Category tiles ───────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(2)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by category</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/explore" as any)}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <View style={styles.tilesGrid}>
            {CATEGORY_TILES.map((cat, index) => (
              <Animated.View
                key={cat.label}
                style={{ transform: [{ scale: tileScales[index] }], width: "22%" }}
              >
                <TouchableOpacity
                  style={styles.tile}
                  activeOpacity={0.85}
                  onPress={() => handleCategoryTap(index, cat.skill as string | null, cat.label)}
                >
                  <View style={[styles.tileIconContainer, { backgroundColor: "#FFFFFF", overflow: "hidden", ...Shadows.soft }]}>
                    <Image source={cat.image} style={{ width: 64, height: 64 }} contentFit="cover" />
                  </View>
                  <Text style={styles.tileLabel}>{cat.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── Near you now ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, makeSectionStyle(3)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Near you now</Text>
            {nearbyArtisans.length > 0 && (
              <View style={styles.countBadge}>
                <View style={styles.countDot} />
                <Text style={styles.countBadgeText}>{nearbyArtisans.length} available</Text>
              </View>
            )}
          </View>

          {locationState === "requesting" && (
            <View style={styles.placeholderCard}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.placeholderText}>Getting your location…</Text>
            </View>
          )}

          {locationState === "denied" && (
            <TouchableOpacity
              style={styles.locationDeniedCard}
              activeOpacity={0.8}
              onPress={() => Linking.openSettings()}
            >
              <View style={styles.locationDeniedIcon}>
                <MapPin size={22} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.locationDeniedText}>
                <Text style={styles.locationDeniedTitle}>Enable location</Text>
                <Text style={styles.locationDeniedBody}>Tap to allow access and see artisans near you</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}

          {locationState === "granted" && nearbyLoading && !nearbyData && (
            <View style={styles.placeholderCard}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.placeholderText}>Finding artisans near you…</Text>
            </View>
          )}

          {locationState === "granted" && !nearbyLoading && nearbyArtisans.length === 0 && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>No artisans found nearby. Try searching above.</Text>
            </View>
          )}

          {nearbyArtisans.length > 0 && (
            <View style={styles.nearbyGrid}>
              {nearbyArtisans.slice(0, 8).map((artisan: any, i: number) => {
                const cardAnim = nearbyCardAnims.current[i] ?? new Animated.Value(1);
                return (
                  <Animated.View
                    key={artisan.id}
                    style={{
                      width: "48%",
                      marginBottom: 14,
                      opacity: cardAnim,
                      transform: [
                        { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                        { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.artisanCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/(app)/provider/${artisan.id}` as any)}
                    >
                      {/* Banner image */}
                      <View style={styles.artisanImageWrap}>
                        <Image
                          source={{ uri: artisan.avatar }}
                          style={styles.artisanAvatar}
                          contentFit="cover"
                        />
                        {/* Gradient overlay */}
                        <View style={styles.artisanImageOverlay} />
                        {artisan.gpsEnabled && (
                          <View style={styles.nearBadge}>
                            <Navigation size={9} color="#fff" strokeWidth={2.5} />
                            <Text style={styles.nearBadgeText}>Near</Text>
                          </View>
                        )}
                        {artisan.verified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>✓</Text>
                          </View>
                        )}
                      </View>

                      {/* Info */}
                      <View style={styles.artisanInfo}>
                        <Text style={styles.artisanName} numberOfLines={1}>{artisan.name}</Text>
                        <Text style={styles.artisanSkill} numberOfLines={1}>
                          {artisan.categories?.[0] ?? artisan.category ?? ""}
                        </Text>
                        <View style={styles.artisanMeta}>
                          <Star size={11} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.artisanRating}>
                            {(artisan.rating || 0).toFixed(1)}
                          </Text>
                          {typeof artisan.distanceMeters === "number" && (
                            <>
                              <View style={styles.metaDot} />
                              <Text style={styles.artisanDist}>
                                {(artisan.distanceMeters / 1000).toFixed(1)} km
                              </Text>
                            </>
                          )}
                        </View>
                        {artisan.minFee != null && (
                          <Text style={styles.artisanPrice} numberOfLines={1}>
                            {artisan.maxFee
                              ? `₦${Number(artisan.minFee).toLocaleString("en-NG")} - ₦${Number(artisan.maxFee).toLocaleString("en-NG")}`
                              : `₦${Number(artisan.minFee).toLocaleString("en-NG")}`}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </ScreenBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 0 },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    ...Shadows.glow,
  },
  heroBubble1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -50,
  },
  heroBubble2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -40,
    left: -20,
  },
  heroContent: { marginBottom: 20 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  greeting: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "400",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  locationPillText: { fontSize: 11, color: "#FFFFFF", fontWeight: "600" },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrapper: {},
  searchContainer: { position: "relative" },
  searchSparkle: { display: "none" }, // reserved
  aiLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  aiLoadingText: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  aiErrorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  aiErrorText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  countBadgeText: { fontSize: 12, fontWeight: "600", color: "#065F46" },

  // ── Category tiles ────────────────────────────────────────────────────────
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "100%",
    aspectRatio: 0.88,
    ...glassSurface,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.soft,
  },
  tileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: 11, fontWeight: "700", color: "#374151", textAlign: "center", letterSpacing: 0.1 },

  // ── Nearby artisans ───────────────────────────────────────────────────────
  placeholderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 28,
    ...glassSurface,
    borderRadius: Radius.lg,
    ...Shadows.soft,
  },
  placeholderText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  locationDeniedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...glassSurface,
    borderRadius: Radius.lg,
    padding: 16,
    ...Shadows.soft,
  },
  locationDeniedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  locationDeniedText: { flex: 1 },
  locationDeniedTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 },
  locationDeniedBody: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  nearbyGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  // Artisan card
  artisanCard: {
    ...glassSurface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.medium,
  },
  artisanImageWrap: { position: "relative" },
  artisanAvatar: { width: "100%", height: 130, backgroundColor: "#F3F4F6" },
  artisanImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  nearBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B981",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nearBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  artisanInfo: { padding: 11, gap: 3 },
  artisanName: { fontSize: 14, fontWeight: "700", color: "#111827", letterSpacing: -0.2 },
  artisanSkill: { fontSize: 11, color: "#6B7280", textTransform: "capitalize" },
  artisanMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  artisanRating: { fontSize: 12, fontWeight: "700", color: "#111827" },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D1D5DB" },
  artisanDist: { fontSize: 11, color: "#9CA3AF" },
  artisanPrice: { fontSize: 15, fontWeight: "800", color: Colors.primary, marginTop: 4 },
  artisanPriceUnit: { fontSize: 11, fontWeight: "500", color: "#9CA3AF" },
});

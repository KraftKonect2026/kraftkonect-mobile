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
} from "lucide-react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, Platform, Animated,  } from "react-native";
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
import { PARSE_JOB_DESCRIPTION_QUERY, NEARBY_ARTISANS_QUERY } from "@/lib/queries";

// ── Category tile data ────────────────────────────────────────────────────────

const CATEGORY_TILES = [
  { skill: "plumbing",   label: "Plumber",     Icon: Droplet   },
  { skill: "electrical", label: "Electrician", Icon: Zap       },
  { skill: "carpentry",  label: "Carpenter",   Icon: Hammer    },
  { skill: "painting",   label: "Painter",     Icon: Paintbrush},
  { skill: "tiling",     label: "Tiler",       Icon: Layers    },
  { skill: "aircon",     label: "AC Repair",   Icon: Wind      },
  { skill: "security",   label: "Locksmith",   Icon: Lock      },
  { skill: null,         label: "More",        Icon: Grid      },
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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animations ────────────────────────────────────────────────────────────

  // Staggered section entrance: header, search, categories, nearby
  const mountAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Per-tile scale values
  const tileScales = useRef(CATEGORY_TILES.map(() => new Animated.Value(1))).current;

  // Search bar border pulse during AI loading
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Nearby cards slide-in
  const nearbyCardAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    Animated.stagger(
      90,
      mountAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 })
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
          outputRange: [28, 0],
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

  const { data: nearbyData, loading: nearbyLoading } = useQuery(NEARBY_ARTISANS_QUERY, {
    variables: {
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      radiusKm: 10,
    },
    skip: !token || locationState === "requesting",
    fetchPolicy: "cache-and-network",
  });

  const nearbyArtisans: any[] = nearbyData?.nearbyArtisans ?? [];

  // Animate nearby cards when they arrive
  useEffect(() => {
    if (nearbyArtisans.length === 0) return;
    nearbyCardAnims.current = nearbyArtisans.map(() => new Animated.Value(0));
    Animated.stagger(
      55,
      nearbyCardAnims.current.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 })
      )
    ).start();
  }, [nearbyArtisans.length]);

  // ── AI search ─────────────────────────────────────────────────────────────

  const [parseJob] = useLazyQuery(PARSE_JOB_DESCRIPTION_QUERY, {
    fetchPolicy: "no-cache",
  });

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
      setAiError("Taking too long — browse by category below or try again.");
    }, AI_TIMEOUT_MS);

    try {
      const { data, error } = await parseJob({ variables: { description: text } });
      if (timedOut.value) return;
      clearTimeout(timeoutRef.current!);

      if (error || !data?.parseJobDescription) {
        setAiError("Couldn't understand that. Try a different description or pick a category.");
        return;
      }

      const { skill, suggestedTitle } = data.parseJobDescription;
      const label = SKILL_LABEL[skill] ?? suggestedTitle ?? "Artisans";
      navigateToResults(skill, label);
    } catch {
      if (timedOut.value) return;
      clearTimeout(timeoutRef.current!);
      setAiError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      if (!timedOut.value) setAiLoading(false);
    }
  }, [query, aiLoading, parseJob, navigateToResults]);

  const handleCategoryTap = useCallback(
    (index: number, skill: string | null, label: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const scale = tileScales[index];
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View style={[styles.header, { paddingTop: insets.top + 20 }, makeSectionStyle(0)]}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>What do you need fixed today?</Text>
          </View>
          {locationState === "granted" && coords && (
            <View style={styles.locationBadge}>
              <MapPin size={12} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.locationBadgeText}>Near you</Text>
            </View>
          )}
        </Animated.View>

        {/* AI Search bar */}
        <Animated.View style={[styles.searchWrapper, makeSectionStyle(1)]}>
          <Input
            placeholder="Describe your problem or search..."
            value={query}
            onChangeText={(t) => { setQuery(t); setAiError(null); }}
            onSubmitEditing={handleAiSearch}
            returnKeyType="search"
            editable={!aiLoading}
            blurOnSubmit={false}
            icon={<Search size={20} color={aiLoading ? "#D1D5DB" : "#9CA3AF"} strokeWidth={2} />}
            style={{ borderColor: searchBorderColor, opacity: aiLoading ? 0.7 : 1 }}
          />

          {aiLoading && (
            <Text style={styles.aiLoadingText}>Finding the right artisan for you…</Text>
          )}
          {aiError && !aiLoading && (
            <View style={styles.aiErrorBanner}>
              <AlertCircle size={14} color="#92400E" strokeWidth={2} />
              <Text style={styles.aiErrorText}>{aiError}</Text>
            </View>
          )}
        </Animated.View>

        {/* Category tiles */}
        <Animated.View style={[styles.section, makeSectionStyle(2)]}>
          <Text style={styles.sectionTitle}>Browse by category</Text>
          <View style={styles.tilesGrid}>
            {CATEGORY_TILES.map(({ skill, label, Icon }, index) => (
              <Animated.View
                key={label}
                style={{ transform: [{ scale: tileScales[index] }], width: "22%" }}
              >
                <TouchableOpacity
                  style={styles.tile}
                  activeOpacity={0.85}
                  onPress={() => handleCategoryTap(index, skill as string | null, label)}
                >
                  <View style={styles.tileIcon}>
                    <Icon size={22} color={Colors.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.tileLabel}>{label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Near you now */}
        <Animated.View style={[styles.section, makeSectionStyle(3)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Near you now</Text>
            {nearbyArtisans.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{nearbyArtisans.length} available</Text>
              </View>
            )}
          </View>

          {locationState === "requesting" && (
            <View style={styles.nearbyPlaceholder}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.nearbyPlaceholderText}>Getting your location…</Text>
            </View>
          )}

          {locationState === "denied" && (
            <TouchableOpacity
              style={styles.locationDeniedCard}
              activeOpacity={0.8}
              onPress={() => Linking.openSettings()}
            >
              <MapPin size={24} color="#9CA3AF" strokeWidth={1.5} />
              <Text style={styles.locationDeniedTitle}>Enable location</Text>
              <Text style={styles.locationDeniedBody}>
                Tap to allow location access and see artisans near you
              </Text>
            </TouchableOpacity>
          )}

          {locationState === "granted" && nearbyLoading && !nearbyData && (
            <View style={styles.nearbyPlaceholder}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.nearbyPlaceholderText}>Finding artisans near you…</Text>
            </View>
          )}

          {locationState === "granted" && !nearbyLoading && nearbyArtisans.length === 0 && (
            <View style={styles.nearbyPlaceholder}>
              <Text style={styles.nearbyPlaceholderText}>No artisans found nearby. Try searching above.</Text>
            </View>
          )}

          {nearbyArtisans.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyScroll}
            >
              {nearbyArtisans.slice(0, 8).map((artisan: any, i: number) => {
                const cardAnim = nearbyCardAnims.current[i] ?? new Animated.Value(1);
                return (
                  <Animated.View
                    key={artisan.id}
                    style={{
                      opacity: cardAnim,
                      transform: [
                        {
                          translateX: cardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0],
                          }),
                        },
                        { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.artisanCard}
                      activeOpacity={0.85}
                      onPress={() => router.push(`/(app)/provider/${artisan.id}` as any)}
                    >
                      <Image
                        source={{ uri: artisan.avatar }}
                        style={styles.artisanAvatar}
                        contentFit="cover"
                      />
                      {artisan.gpsEnabled && (
                        <View style={styles.nearBadge}>
                          <Navigation size={10} color="#fff" strokeWidth={2.5} />
                          <Text style={styles.nearBadgeText}>Near</Text>
                        </View>
                      )}
                      <View style={styles.artisanInfo}>
                        <Text style={styles.artisanName} numberOfLines={1}>{artisan.name}</Text>
                        <Text style={styles.artisanSkill} numberOfLines={1}>
                          {artisan.categories?.[0] ?? artisan.category ?? ""}
                        </Text>
                        <View style={styles.artisanMeta}>
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.artisanRating}>
                            {(artisan.rating || 0).toFixed(1)}
                          </Text>
                          {artisan.experience && (
                            <Text style={styles.artisanExp}> · {artisan.experience}</Text>
                          )}
                        </View>
                        {artisan.verified && (
                          <View style={styles.verifiedChip}>
                            <Text style={styles.verifiedChipText}>✓ Verified</Text>
                          </View>
                        )}
                        {typeof artisan.distanceMeters === "number" && (
                          <Text style={styles.artisanDistance}>
                            {(artisan.distanceMeters / 1000).toFixed(1)} km away
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "700" as const, color: "#111827", marginBottom: 2 },
  subGreeting: { fontSize: 14, color: "#6B7280" },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  locationBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: "600" as const },

  // Search
  searchWrapper: { marginBottom: 28 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  searchBarDisabled: { opacity: 0.7 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  aiLoadingText: { marginTop: 8, fontSize: 13, color: Colors.primary, textAlign: "center" },
  aiErrorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  aiErrorText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: "#111827" },
  countBadge: {
    backgroundColor: `${Colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countBadgeText: { fontSize: 12, fontWeight: "600" as const, color: Colors.primary },

  // Category tiles
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: 11, fontWeight: "600" as const, color: "#374151", textAlign: "center" },

  // Near you now
  nearbyPlaceholder: { alignItems: "center", gap: 8, paddingVertical: 24 },
  nearbyPlaceholderText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  locationDeniedCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed" as const,
  },
  locationDeniedTitle: { fontSize: 16, fontWeight: "600" as const, color: "#374151" },
  locationDeniedBody: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 18 },
  nearbyScroll: { gap: 12 },
  artisanCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  artisanAvatar: { width: "100%", height: 110, backgroundColor: "#F3F4F6" },
  nearBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nearBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#fff" },
  artisanInfo: { padding: 10, gap: 3 },
  artisanName: { fontSize: 14, fontWeight: "700" as const, color: "#111827" },
  artisanSkill: { fontSize: 12, color: "#6B7280", textTransform: "capitalize" as const },
  artisanMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  artisanRating: { fontSize: 12, fontWeight: "600" as const, color: "#111827" },
  artisanExp: { fontSize: 12, color: "#9CA3AF" },
  verifiedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  verifiedChipText: { fontSize: 10, fontWeight: "600" as const, color: "#065F46" },
  artisanDistance: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});

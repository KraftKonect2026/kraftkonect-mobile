import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  Sparkles,
  Zap,
  Droplet,
  Paintbrush,
  Wrench,
  Hammer,
  Grid,
  Wind,
  Lock,
  Power,
} from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, RefreshControl, Platform, ActivityIndicator, Linking,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useQuery } from "@apollo/client";
import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { categories as categoriesData } from "@/constants/categories";
import { NEARBY_ARTISANS_QUERY } from "@/lib/queries";

const LAGOS_LGAS = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
];

const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  zap: Zap,
  droplet: Droplet,
  paintbrush: Paintbrush,
  wrench: Wrench,
  hammer: Hammer,
  grid: Grid,
  wind: Wind,
  lock: Lock,
  power: Power,
};

type LocationState = "requesting" | "granted" | "denied";

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([]);
  const heartScales = useRef<Record<string, Animated.Value>>({});

  const [locationState, setLocationState] = useState<LocationState>("requesting");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<string | null>(null);
  const [showNeighbourhoodPicker, setShowNeighbourhoodPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const token = useAppSelector((state) => state.auth.accessToken);

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
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

  // Query is ready to fire when:
  //   GPS granted → always (lat/lon present)
  //   GPS denied  → only after a neighbourhood is chosen
  const queryReady =
    token != null &&
    locationState !== "requesting" &&
    (locationState === "granted" || selectedNeighbourhood != null);

  const { data, loading, error, refetch } = useQuery(NEARBY_ARTISANS_QUERY, {
    variables: {
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      skill: selectedCategory ?? null,
      radiusKm: 10,
      neighbourhood: selectedNeighbourhood ?? null,
    },
    skip: !queryReady,
    notifyOnNetworkStatusChange: true,
  });

  const providers: any[] = data?.nearbyArtisans ?? [];

  // Stagger card entrances when results arrive or change
  useEffect(() => {
    if (providers.length === 0) return;
    cardAnims.current = providers.map(() => new Animated.Value(0));
    Animated.stagger(
      65,
      cardAnims.current.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 })
      )
    ).start();
  }, [providers.length]);

  const getHeartScale = useCallback((id: string) => {
    if (!heartScales.current[id]) {
      heartScales.current[id] = new Animated.Value(1);
    }
    return heartScales.current[id];
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggleFavorite = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const scale = getHeartScale(id);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, tension: 300, friction: 5 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 7 }),
      ]).start();
      setFavorites((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [getHeartScale],
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const sectionTitle = selectedCategory
    ? (categoriesData.find((c) => c.id === selectedCategory)?.name ?? selectedCategory) + " Providers"
    : locationState === "granted"
    ? "Artisans near you"
    : selectedNeighbourhood
    ? `Artisans in ${selectedNeighbourhood}`
    : "Nearby Artisans";

  return (
    <View style={styles.container}>
      <View style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + 12, opacity: headerOpacity }]}
        >
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.8}
            onPress={() => router.push("/(app)/search" as any)}
          >
            <Search size={20} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>What service do you need?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterIcon}
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/filter" as any)}
          >
            <SlidersHorizontal size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Location status banner */}
          {locationState === "requesting" && (
            <View style={styles.locationBanner}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.locationBannerText}>Detecting your location…</Text>
            </View>
          )}

          {locationState === "granted" && coords && (
            <View style={[styles.locationBanner, styles.locationBannerGranted]}>
              <Navigation size={14} color={Colors.success} strokeWidth={2} />
              <Text style={[styles.locationBannerText, styles.locationBannerTextGranted]}>
                Showing artisans near you
              </Text>
            </View>
          )}

          {locationState === "denied" && (
            <View style={styles.locationDeniedCard}>
              <View style={styles.locationDeniedHeader}>
                <AlertCircle size={18} color="#D97706" strokeWidth={2} />
                <Text style={styles.locationDeniedTitle}>Location access denied</Text>
              </View>
              <Text style={styles.locationDeniedBody}>
                Pick your neighbourhood to find artisans nearby, or{" "}
                <Text
                  style={styles.locationDeniedLink}
                  onPress={() => Linking.openSettings()}
                >
                  enable location in Settings
                </Text>
                .
              </Text>

              {/* Neighbourhood selector toggle */}
              <TouchableOpacity
                style={styles.neighbourhoodToggle}
                activeOpacity={0.7}
                onPress={() => setShowNeighbourhoodPicker((v) => !v)}
              >
                <MapPin size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.neighbourhoodToggleText}>
                  {selectedNeighbourhood ?? "Select your neighbourhood"}
                </Text>
                {showNeighbourhoodPicker ? (
                  <ChevronUp size={16} color={Colors.primary} strokeWidth={2} />
                ) : (
                  <ChevronDown size={16} color={Colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>

              {showNeighbourhoodPicker && (
                <View style={styles.lgaGrid}>
                  {LAGOS_LGAS.map((lga) => (
                    <TouchableOpacity
                      key={lga}
                      style={[
                        styles.lgaChip,
                        selectedNeighbourhood === lga && styles.lgaChipActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedNeighbourhood(lga);
                        setShowNeighbourhoodPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.lgaChipText,
                          selectedNeighbourhood === lga && styles.lgaChipTextActive,
                        ]}
                      >
                        {lga}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categoriesData.map((category) => {
              const IconComponent = iconMap[category.icon];
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(isSelected ? null : category.id)}
                  activeOpacity={0.7}
                >
                  {IconComponent && (
                    <IconComponent
                      size={18}
                      color={isSelected ? "#FFFFFF" : "#2C2C2C"}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Results */}
          <View style={styles.providersSection}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>

            {/* Requesting state — waiting for permission response */}
            {locationState === "requesting" ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Getting your location…</Text>
              </View>
            ) : /* Denied + no neighbourhood chosen yet */
            locationState === "denied" && !selectedNeighbourhood ? (
              <View style={styles.emptyContainer}>
                <MapPin size={40} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>
                  Select a neighbourhood above to see nearby artisans
                </Text>
              </View>
            ) : loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Finding best providers…</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load providers</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : providers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedCategory
                    ? "No providers found for this category nearby"
                    : "No artisans found in this area yet"}
                </Text>
              </View>
            ) : (
              <View style={styles.providersGrid}>
                {providers.map((provider: any, index: number) => {
                  const cardAnim = cardAnims.current[index] ?? new Animated.Value(1);
                  const heartScale = getHeartScale(provider.id);
                  const distanceKm =
                    typeof provider.distanceMeters === "number"
                      ? provider.distanceMeters / 1000
                      : null;
                  const categoryName =
                    provider.categories?.length > 0
                      ? provider.categories
                          .map((catId: string) => categoriesData.find((c) => c.id === catId)?.name)
                          .filter(Boolean)
                          .join(", ")
                      : categoriesData.find((c) => c.id === provider.category)?.name ??
                        provider.category;

                  return (
                    <Animated.View
                      key={provider.id}
                      style={[
                        styles.gridItem,
                        {
                          opacity: cardAnim,
                          transform: [
                            { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                            { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.providerCard}
                        activeOpacity={0.9}
                        onPress={() => router.push(`/(app)/provider/${provider.id}` as any)}
                      >
                        <Image
                          source={{ uri: provider.banner }}
                          style={styles.providerImage}
                          contentFit="cover"
                        />

                        <TouchableOpacity
                          style={styles.favoriteButton}
                          activeOpacity={0.7}
                          onPress={() => toggleFavorite(provider.id)}
                        >
                          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Heart
                              size={18}
                              color={favorites.has(provider.id) ? "#EF4444" : "#F3F4F6"}
                              fill={favorites.has(provider.id) ? "#EF4444" : "transparent"}
                              strokeWidth={2}
                            />
                          </Animated.View>
                        </TouchableOpacity>

                        {provider.gpsEnabled && (
                          <View style={styles.nearYouBadge}>
                            <Navigation size={10} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.nearYouBadgeText}>Near you</Text>
                          </View>
                        )}

                        <View style={styles.providerInfo}>
                          <View style={styles.nameRow}>
                            <Text style={styles.providerName} numberOfLines={1}>
                              {provider.name}
                            </Text>
                            {provider.verified && (
                              <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>✓</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.categoryLabel} numberOfLines={1}>
                            {categoryName}
                          </Text>

                          <View style={styles.ratingRow}>
                            <Star size={13} color="#FFA500" fill="#FFA500" />
                            <Text style={styles.rating}>
                              {(provider.rating || 0).toFixed(1)} ({provider.reviewCount || 0})
                            </Text>
                          </View>

                          <View style={styles.providerFooter}>
                            <View style={styles.priceContainer}>
                              <Text style={styles.price}>₦{provider.pricePerHour}</Text>
                              <Text style={styles.priceLabel}>/hr</Text>
                            </View>
                          </View>

                          <View style={styles.distanceContainer}>
                            <MapPin size={12} color="#9CA3AF" />
                            <Text style={styles.distance} numberOfLines={1}>
                              {distanceKm != null
                                ? `${distanceKm.toFixed(1)} km away`
                                : selectedNeighbourhood ?? "Nearby"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6FB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E8EAF0",
  },
  filterIcon: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, color: "#9CA3AF", fontWeight: "500" },

  // Location banners
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  locationBannerGranted: { backgroundColor: "#D1FAE5" },
  locationBannerText: { fontSize: 13, color: "#6B7280", flex: 1 },
  locationBannerTextGranted: { color: "#065F46" },

  // Denied card
  locationDeniedCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 8,
  },
  locationDeniedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationDeniedTitle: { fontSize: 14, fontWeight: "600" as const, color: "#92400E" },
  locationDeniedBody: { fontSize: 13, color: "#78350F", lineHeight: 18 },
  locationDeniedLink: { color: Colors.primary, textDecorationLine: "underline" },

  neighbourhoodToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 4,
  },
  neighbourhoodToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.primary,
  },

  lgaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 8,
  },
  lgaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lgaChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  lgaChipText: { fontSize: 13, fontWeight: "500" as const, color: "#374151" },
  lgaChipTextActive: { color: "#FFFFFF" },

  // Categories
  scrollContent: { paddingBottom: 100 },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E8EAF0",
    gap: 7,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontWeight: "600" as const, color: "#374151" },
  categoryTextActive: { color: "#FFFFFF" },

  // Results
  providersSection: { paddingHorizontal: 18, paddingTop: 4 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#111827",
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  providersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "48.5%", marginBottom: 16 },
  providerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  providerImage: { width: "100%", height: 140, backgroundColor: "#F3F4F6" },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  nearYouBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nearYouBadgeText: { fontSize: 9, fontWeight: "700" as const, color: "#FFFFFF", letterSpacing: 0.3 },

  providerInfo: { padding: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  providerName: { flex: 1, fontSize: 14, fontWeight: "800" as const, color: "#111827", letterSpacing: -0.2 },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  verifiedText: { fontSize: 9, fontWeight: "800" as const, color: "#FFFFFF" },
  categoryLabel: { fontSize: 11, color: "#6B7280", marginBottom: 5, textTransform: "capitalize" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  rating: { fontSize: 12, fontWeight: "700" as const, color: "#111827" },

  providerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  priceContainer: { flexDirection: "row", alignItems: "baseline", gap: 1 },
  price: { fontSize: 17, fontWeight: "800" as const, color: Colors.primary },
  priceLabel: { fontSize: 11, color: "#9CA3AF", marginLeft: 1 },
  distanceContainer: { flexDirection: "row", alignItems: "center", gap: 3 },
  distance: { flex: 1, fontSize: 11, color: "#9CA3AF" },

  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorContainer: { padding: 40, alignItems: "center" },
  errorText: { fontSize: 16, color: "#EF4444", marginBottom: 16 },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" as const },
  emptyContainer: { padding: 40, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
});

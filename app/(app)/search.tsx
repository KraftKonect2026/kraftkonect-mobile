import {
  ArrowLeft,
  Heart,
  MapPin,
  Navigation,
  Star,
} from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, RefreshControl, Animated,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery } from "@apollo/client";

import Colors from "@/constants/colors";
import { NEARBY_ARTISANS_QUERY } from "@/lib/queries";

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { skill, skillLabel, lat, lon } = useLocalSearchParams<{
    skill?: string;
    skillLabel?: string;
    lat?: string;
    lon?: string;
  }>();

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const parsedLat = lat ? parseFloat(lat) : null;
  const parsedLon = lon ? parseFloat(lon) : null;

  // ── Animations ────────────────────────────────────────────────────────────

  // Header slide-down entrance
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Per-card stagger entrance
  const cardAnims = useRef<Animated.Value[]>([]);

  // Per-artisan heart scale values (keyed by id)
  const heartScales = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);

  const getHeartScale = useCallback((id: string) => {
    if (!heartScales.current[id]) {
      heartScales.current[id] = new Animated.Value(1);
    }
    return heartScales.current[id];
  }, []);

  // ── Query ─────────────────────────────────────────────────────────────────

  const { data, loading, error, refetch } = useQuery(NEARBY_ARTISANS_QUERY, {
    variables: {
      skill: skill ?? null,
      lat: parsedLat,
      lon: parsedLon,
      radiusKm: 10,
    },
    fetchPolicy: "cache-and-network",
  });

  const artisans: any[] = data?.nearbyArtisans ?? [];

  // Stagger card entrances when results arrive
  useEffect(() => {
    if (artisans.length === 0) return;
    cardAnims.current = artisans.map(() => new Animated.Value(0));
    Animated.stagger(
      60,
      cardAnims.current.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 })
      )
    ).start();
  }, [artisans.length]);

  const heading = skillLabel ? `${skillLabel} near you` : "Artisans near you";

  // ── Actions ───────────────────────────────────────────────────────────────

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{heading}</Text>
          {!loading && artisans.length > 0 && (
            <Text style={styles.headerCount}>{artisans.length} found</Text>
          )}
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateText}>Finding the best artisans…</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>Failed to load results</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : artisans.length === 0 ? (
          <View style={styles.centeredState}>
            <MapPin size={44} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.stateText}>
              No {skillLabel ?? "artisans"} found nearby.{"\n"}Try a wider search or browse categories.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Text style={styles.browseButtonText}>Browse categories</Text>
            </TouchableOpacity>
          </View>
        ) : (
          artisans.map((artisan: any, index: number) => {
            const cardAnim = cardAnims.current[index] ?? new Animated.Value(1);
            const heartScale = getHeartScale(artisan.id);
            const isFav = favorites.has(artisan.id);
            const distanceKm =
              typeof artisan.distanceMeters === "number"
                ? artisan.distanceMeters / 1000
                : null;

            return (
              <Animated.View
                key={artisan.id}
                style={{
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                    {
                      scale: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/(app)/provider/${artisan.id}` as any)}
                >
                  <Image
                    source={{ uri: artisan.banner }}
                    style={styles.cardBanner}
                    contentFit="cover"
                  />

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    activeOpacity={0.7}
                    onPress={() => toggleFavorite(artisan.id)}
                  >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Heart
                        size={20}
                        color={isFav ? "#EF4444" : "#F3F4F6"}
                        fill={isFav ? "#EF4444" : "transparent"}
                        strokeWidth={2}
                      />
                    </Animated.View>
                  </TouchableOpacity>

                  {artisan.gpsEnabled && (
                    <View style={styles.nearBadge}>
                      <Navigation size={12} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.nearBadgeText}>Near you now</Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Image
                        source={{ uri: artisan.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                      <View style={styles.cardDetails}>
                        <View style={styles.nameRow}>
                          <Text style={styles.artisanName} numberOfLines={1}>
                            {artisan.name}
                          </Text>
                          {artisan.verified && (
                            <View style={styles.verifiedBadge}>
                              <Text style={styles.verifiedText}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.artisanCategory} numberOfLines={1}>
                          {artisan.categories?.[0] ?? artisan.category ?? ""}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Star size={14} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {(artisan.rating || 0).toFixed(1)} ({artisan.reviewCount || 0})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      {artisan.pricePerHour != null && (
                        <View style={styles.priceRow}>
                          <Text style={styles.price}>₦{artisan.pricePerHour}</Text>
                          <Text style={styles.priceLabel}>/hr</Text>
                        </View>
                      )}
                      <View style={styles.distanceRow}>
                        <MapPin size={13} color="#9CA3AF" />
                        <Text style={styles.distanceText}>
                          {distanceKm != null ? `${distanceKm.toFixed(1)} km away` : "Nearby"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: "#111827" },
  headerCount: { fontSize: 13, color: "#6B7280", marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  centeredState: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 24 },
  stateText: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  errorText: { fontSize: 15, color: "#EF4444" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" as const, fontSize: 14 },
  browseButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  browseButtonText: { color: "#FFFFFF", fontWeight: "600" as const, fontSize: 15 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardBanner: { width: "100%", height: 180, backgroundColor: "#F3F4F6" },
  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  nearBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  nearBadgeText: { fontSize: 12, fontWeight: "600" as const, color: "#fff" },

  cardBody: { padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  cardDetails: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  artisanName: { fontSize: 17, fontWeight: "700" as const, color: "#111827" },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: { fontSize: 11, fontWeight: "700" as const, color: "#fff" },
  artisanCategory: { fontSize: 13, color: "#6B7280", marginBottom: 3, textTransform: "capitalize" as const },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "600" as const, color: "#111827" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { fontSize: 20, fontWeight: "700" as const, color: "#111827" },
  priceLabel: { fontSize: 13, color: "#9CA3AF" },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  distanceText: { fontSize: 13, color: "#9CA3AF" },
});

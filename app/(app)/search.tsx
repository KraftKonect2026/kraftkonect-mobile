import {
  ArrowLeft,
  Heart,
  MapPin,
  Navigation,
  Star,
} from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Animated,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery } from "@apollo/client";

import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { NEARBY_ARTISANS_QUERY } from "@/lib/queries";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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

  const heading = skillLabel ? (skillLabel.toLowerCase().includes("near you") ? skillLabel : `${skillLabel} near you`) : "Artisans near you";

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
    <ScreenBackground>
      {/* Header */}
      <AnimatedLinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{heading}</Text>
          {!loading && artisans.length > 0 && (
            <Text style={styles.headerCount}>{artisans.length} found</Text>
          )}
        </View>
      </AnimatedLinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
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
          <View style={styles.resultsGrid}>
            {artisans.map((artisan: any, index: number) => {
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
                      
                      {/* Favorite Button */}
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        activeOpacity={0.7}
                        onPress={() => toggleFavorite(artisan.id)}
                      >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                          <Heart
                            size={16}
                            color={isFav ? "#EF4444" : "#F3F4F6"}
                            fill={isFav ? "#EF4444" : "transparent"}
                            strokeWidth={2}
                          />
                        </Animated.View>
                      </TouchableOpacity>
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
                        {distanceKm != null && (
                          <>
                            <View style={styles.metaDot} />
                            <Text style={styles.artisanDist}>
                              {distanceKm.toFixed(1)} km
                            </Text>
                          </>
                        )}
                      </View>
                      {artisan.pricePerHour != null && (
                        <Text style={styles.artisanPrice}>
                          ₦{Number(artisan.pricePerHour).toLocaleString("en-NG")}
                          <Text style={styles.artisanPriceUnit}>/hr</Text>
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    gap: 12,
    ...Shadows.glow,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: "#FFFFFF" },
  headerCount: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 1 },

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

  resultsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  
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
  nearBadgeText: { fontSize: 9, fontWeight: "700" as const, color: "#fff", letterSpacing: 0.3 },
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
  verifiedBadgeText: { fontSize: 10, fontWeight: "800" as const, color: "#FFFFFF" },
  favoriteButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.28)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  artisanInfo: { padding: 11, gap: 3 },
  artisanName: { fontSize: 14, fontWeight: "700" as const, color: "#111827", letterSpacing: -0.2 },
  artisanSkill: { fontSize: 11, color: "#6B7280", textTransform: "capitalize" as const },
  artisanMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  artisanRating: { fontSize: 12, fontWeight: "700" as const, color: "#111827" },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D1D5DB" },
  artisanDist: { fontSize: 11, color: "#9CA3AF" },
  artisanPrice: { fontSize: 15, fontWeight: "800" as const, color: Colors.primary, marginTop: 4 },
  artisanPriceUnit: { fontSize: 11, fontWeight: "500" as const, color: "#9CA3AF" },
});

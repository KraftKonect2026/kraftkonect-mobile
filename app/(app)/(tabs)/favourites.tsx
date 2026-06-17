import { Heart, MapPin, Search, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform, Animated,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@apollo/client";

import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { GET_FAVOURITES_QUERY } from "@/lib/queries";
import { REMOVE_FROM_FAVOURITES_MUTATION } from "@/lib/mutations";

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data, loading, error, refetch } = useQuery(GET_FAVOURITES_QUERY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [removeFromFavourites] = useMutation(REMOVE_FROM_FAVOURITES_MUTATION, {
    refetchQueries: [{ query: GET_FAVOURITES_QUERY }],
  });

  const favourites: any[] = data?.favorites ?? [];

  // ── Animations ────────────────────────────────────────────────────────────

  // Staggered card entrance when data arrives
  const cardAnims = useRef<Animated.Value[]>([]);
  const heartScales = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    if (favourites.length === 0) return;
    cardAnims.current = favourites.map(() => new Animated.Value(0));
    Animated.stagger(
      60,
      cardAnims.current.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 })
      )
    ).start();
  }, [favourites.length]);

  const getHeartScale = useCallback((id: string) => {
    if (!heartScales.current[id]) {
      heartScales.current[id] = new Animated.Value(1);
    }
    return heartScales.current[id];
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (providerId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const scale = getHeartScale(providerId);
      // Animate heart out before removing
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, tension: 300, friction: 5 }),
        Animated.timing(scale, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      try {
        await removeFromFavourites({ variables: { providerId } });
      } catch {
        // Restore scale if mutation fails
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }
    },
    [getHeartScale, removeFromFavourites],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenBackground>
      {/* Header */}
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Favourites</Text>
        {!loading && favourites.length > 0 && (
          <Text style={styles.subtitle}>{favourites.length} saved artisan{favourites.length !== 1 ? "s" : ""}</Text>
        )}
        {loading && !data && (
          <Text style={styles.subtitle}>Loading…</Text>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Initial loading */}
        {loading && !data ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateText}>Loading your favourites…</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>Couldn't load favourites</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : favourites.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <Heart size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart on any artisan to save them here for quick rebooking
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/explore" as any)}
            >
              <Search size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.exploreButtonText}>Explore Artisans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Grid of saved artisans */
          <View style={styles.grid}>
            {favourites.map((provider: any, index: number) => {
              const cardAnim = cardAnims.current[index] ?? new Animated.Value(1);
              const heartScale = getHeartScale(provider.id);

              return (
                <Animated.View
                  key={provider.id}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: cardAnim,
                      transform: [
                        { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                        { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.providerCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(app)/provider/${provider.id}` as any)}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: provider.banner ?? provider.avatar }}
                        style={styles.providerImage}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        activeOpacity={0.7}
                        onPress={() => handleRemove(provider.id)}
                      >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                          <Heart size={18} color="#EF4444" strokeWidth={2} fill="#EF4444" />
                        </Animated.View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardContent}>
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

                      <Text style={styles.category} numberOfLines={1}>
                        {provider.categories?.[0] ?? provider.category ?? ""}
                      </Text>

                      <View style={styles.ratingRow}>
                        <Star size={13} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {(provider.rating || 0).toFixed(1)} ({provider.reviewCount || 0})
                        </Text>
                      </View>

                      <View style={styles.footer}>
                        {provider.minFee != null && (
                          <View style={styles.priceRow}>
                            <Text style={styles.price} numberOfLines={1}>
                              {provider.maxFee
                                ? `₦${Number(provider.minFee).toLocaleString("en-NG")} - ₦${Number(provider.maxFee).toLocaleString("en-NG")}`
                                : `₦${Number(provider.minFee).toLocaleString("en-NG")}`}
                            </Text>
                          </View>
                        )}
                        {provider.distanceMeters != null && (
                          <View style={styles.distanceRow}>
                            <MapPin size={11} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.distance}>
                              {(provider.distanceMeters / 1000).toFixed(1)} km
                            </Text>
                          </View>
                        )}
                      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  content: { flex: 1 },
  contentContainer: { padding: 16 },

  centeredState: { alignItems: "center", paddingTop: 80, gap: 12 },
  stateText: { fontSize: 15, color: "#6B7280" },
  errorText: { fontSize: 15, color: "#EF4444" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" as const, fontSize: 14 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 0,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  exploreButtonText: { fontSize: 16, fontWeight: "600" as const, color: "#FFFFFF" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  cardWrapper: { width: "47.5%" },

  providerCard: {
    ...glassSurface,
    borderRadius: Radius.md,
    overflow: "hidden",
    ...Shadows.medium,
  },
  imageContainer: { position: "relative", width: "100%", height: 150 },
  providerImage: { width: "100%", height: "100%", backgroundColor: "#F3F4F6" },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: { padding: 10, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 1 },
  providerName: { fontSize: 14, fontWeight: "600" as const, color: "#2C2C2C", flex: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: { fontSize: 9, color: "#FFFFFF", fontWeight: "700" as const },
  category: { fontSize: 12, color: "#6B7280", textTransform: "capitalize" as const },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: "600" as const, color: "#2C2C2C" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  price: { fontSize: 14, fontWeight: "700" as const, color: "#2C2C2C" },
  priceUnit: { fontSize: 11, color: "#6B7280", marginLeft: 2 },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distance: { fontSize: 11, color: "#6B7280" },
});

import {
  ArrowLeft,
  Heart,
  Star,
  MessageCircle,
  Calendar,
  Clock,
} from "lucide-react-native";
import React, { useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Animated,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import * as Haptics from "expo-haptics";
import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { PROVIDER_QUERY, GET_FAVOURITES_QUERY } from "@/lib/queries";
import { useOpenChat } from "@/lib/useOpenChat";
import { ADD_TO_FAVOURITES_MUTATION, REMOVE_FROM_FAVOURITES_MUTATION } from "@/lib/mutations";
import { ActivityIndicator } from "react-native";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import { formatPriceCents } from "@/utils/currency";


const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;

export default function ProviderProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const token = useAppSelector((state) => state.auth.accessToken);

  const { data, loading, error, refetch } = useQuery(PROVIDER_QUERY, {
    variables: { providerId: `${id}` },
    skip: !id,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const provider = data?.provider;

  // Favourites
  const { data: favsData } = useQuery(GET_FAVOURITES_QUERY, {
    skip: !token,
    fetchPolicy: "cache-first",
  });
  const isFav = !!(favsData?.favorites ?? []).find((f: any) => f.id === id);
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const isFavourite = localFav !== null ? localFav : isFav;

  const [addToFavourites] = useMutation(ADD_TO_FAVOURITES_MUTATION, {
    refetchQueries: [{ query: GET_FAVOURITES_QUERY }],
  });
  const [removeFromFavourites] = useMutation(REMOVE_FROM_FAVOURITES_MUTATION, {
    refetchQueries: [{ query: GET_FAVOURITES_QUERY }],
  });

  const openChat = useOpenChat();

  const handleChat = useCallback(() => {
    if (!provider?.user?.id) return;
    openChat(provider.user.id, provider.name ?? "", provider.avatar ?? "");
  }, [provider, openChat]);

  const handleFavouriteToggle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isFavourite;
    setLocalFav(next);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.45, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 7 }),
    ]).start();
    try {
      if (next) {
        await addToFavourites({ variables: { providerId: id } });
      } else {
        await removeFromFavourites({ variables: { providerId: id } });
      }
    } catch {
      setLocalFav(!next); // revert on error
    }
  }, [isFavourite, id, addToFavourites, removeFromFavourites, heartScale]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error ? "Failed to load provider" : "Provider not found"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, (HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT) / 2, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  return (
    <ScreenBackground>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.View style={{ opacity: imageOpacity }}>
          <Image
            source={{ uri: provider.banner }}
            style={styles.bannerImage}
            contentFit="cover"
          />
        </Animated.View>

        <View style={[styles.headerButtons, { top: insets.top + 12 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.8} onPress={handleFavouriteToggle}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={24}
                color={isFavourite ? "#EF4444" : "#F3F4F6"}
                fill={isFavourite ? "#EF4444" : "transparent"}
                strokeWidth={2}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: provider.avatar }}
            style={styles.profileImage}
            contentFit="cover"
          />
          {provider.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT - 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{provider.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={18} color="#FFA500" fill="#FFA500" />
              <Text style={styles.rating}>
                {(provider.rating || 0).toFixed(1)} ({provider.reviewCount || 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{provider.bio}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Experience</Text>
                <Text style={styles.statValue}>{provider.experience}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bids</Text>
                <Text style={styles.statValue}>
                  {provider.minFee != null
                    ? provider.maxFee
                      ? `₦${Number(provider.minFee).toLocaleString("en-NG")} - ₦${Number(provider.maxFee).toLocaleString("en-NG")}`
                      : `From ₦${Number(provider.minFee).toLocaleString("en-NG")}`
                    : "Varies"}
                </Text>
              </View>
            </View>
          </View>

          {(provider.expertise || []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expertise</Text>
              <View style={styles.expertiseContainer}>
                {(provider.expertise as string[]).map((skill, index) => (
                  <View key={index} style={styles.expertiseChip}>
                    <Text style={styles.expertiseText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {(provider.services || []).map((service: any) => (
              <View
                key={service.id}
                style={styles.serviceCard}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.servicePrice}>
                    {service.minPriceCents != null && service.maxPriceCents != null && service.minPriceCents !== service.maxPriceCents
                      ? `${formatPriceCents(service.minPriceCents, service.currency)} - ${formatPriceCents(service.maxPriceCents, service.currency)}`
                      : formatPriceCents(service.minPriceCents ?? service.priceCents, service.currency)}
                  </Text>
                </View>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <View style={styles.serviceDuration}>
                  <Clock size={14} color="#9CA3AF" />
                  <Text style={styles.durationText}>{service.durationMinutes} min</Text>
                </View>
              </View>
            ))}
          </View>

          {(provider.portfolio || []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolio}>
                {(provider.portfolio as string[]).map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.portfolioImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reviews{provider.reviewCount > 0 ? ` (${provider.reviewCount})` : ""}
            </Text>
            {(provider.reviews || []).length === 0 ? (
              <Text style={styles.emptyReviews}>No reviews yet. Be the first to book!</Text>
            ) : (
              (provider.reviews as any[]).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.userAvatar }}
                      style={styles.reviewAvatar}
                      contentFit="cover"
                    />
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewName}>{review.userName}</Text>
                      <View style={styles.reviewRatingRow}>
                        {Array.from({ length: review.rating || 0 }).map((_, i) => (
                          <Star key={i} size={12} color="#FFA500" fill="#FFA500" />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {review.date ? new Date(review.date).toLocaleDateString("en-NG", {
                        month: "short",
                        year: "numeric",
                      }) : ""}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.chatButton} activeOpacity={0.8} onPress={handleChat}>
          <MessageCircle size={20} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.8}
          onPress={() => router.push(`/(app)/booking/${provider.id}/select-service` as any)}
        >
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookButtonGradient}
          >
            <Calendar size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.bookButtonText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    
  },
  bannerImage: {
    width: "100%",
    height: HEADER_MAX_HEIGHT,
    backgroundColor: "#F3F4F6",
  },
  headerButtons: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageContainer: {
    position: "absolute",
    bottom: -40,
    alignSelf: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 120,
    zIndex: -1
  },
  content: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 60,
    zIndex: -1
  },
  nameSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#6B7280",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    ...glassSurface,
    padding: 16,
    borderRadius: Radius.md,
    ...Shadows.soft,
  },
  statLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  expertiseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(219,234,254,0.7)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  expertiseText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  serviceCard: {
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadows.soft,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    flex: 1,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  portfolio: {
    gap: 12,
  },
  portfolioImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.06)",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
  },
  emptyReviews: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.65)",
    gap: 12,
    ...Shadows.medium,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(219,234,254,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: Radius.pill,
    overflow: "hidden",
    ...Shadows.glow,
  },
  bookButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});

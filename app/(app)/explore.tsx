import {
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
  Scissors,
  Hammer,
  Leaf,
} from "lucide-react-native";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";
import { useAppSelector } from "@/store";
import Colors from "@/constants/colors";
import { categories as categoriesData } from "@/mocks/providers";
import { PROVIDERS_QUERY } from "@/lib/queries";
import { ActivityIndicator } from "react-native";



const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  zap: Zap,
  droplet: Droplet,
  paintbrush: Paintbrush,
  wrench: Wrench,
  scissors: Scissors,
  hammer: Hammer,
  leaf: Leaf,
};

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  const toggleFavorite = (providerId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(providerId)) {
        newFavorites.delete(providerId);
      } else {
        newFavorites.add(providerId);
      }
      return newFavorites;
    });
  };

  const token = useAppSelector((state) => state.auth.accessToken);

  const { data, loading, error, refetch } = useQuery(PROVIDERS_QUERY, {
    variables: { limit: 20, offset: 0 },
    skip: !token,
    notifyOnNetworkStatusChange: true,
  });

  

  const providers = data?.providers || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProviders = selectedCategory
    ? providers.filter((p: any) => p.categories?.includes(selectedCategory) || p.category === selectedCategory)
    : providers;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <View style={styles.safeArea}>
        <Animated.View style={[styles.header, { paddingTop: insets.top + 12, opacity: headerOpacity }]}>
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
            <SlidersHorizontal size={22} color="#2C2C2C" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
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
                  onPress={() =>
                    setSelectedCategory(isSelected ? null : category.id)
                  }
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

          <View style={styles.providersSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? categoriesData.find((c) => c.id === selectedCategory)?.name +
                " Providers"
                : "Featured Providers"}
            </Text>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Finding best providers...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load providers</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredProviders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No providers found in this category</Text>
              </View>
            ) : (
              filteredProviders.map((provider: any, index: number) => (
                <TouchableOpacity
                  key={provider.id}
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
                    <Heart
                      size={20}
                      color={favorites.has(provider.id) ? "#EF4444" : "#F3F4F6"}
                      fill={favorites.has(provider.id) ? "#EF4444" : "transparent"}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>

                  {provider.gpsEnabled && (
                    <View style={styles.nearYouBadge}>
                      <Navigation size={12} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.nearYouBadgeText}>Near you now</Text>
                    </View>
                  )}

                  <View style={styles.providerInfo}>
                    <View style={styles.providerHeader}>
                      <Image
                        source={{ uri: provider.avatar }}
                        style={styles.providerAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.providerDetails}>
                        <View style={styles.nameRow}>
                          <Text style={styles.providerName}>{provider.name}</Text>
                          {provider.verified && (
                            <View style={styles.verifiedBadge}>
                              <Text style={styles.verifiedText}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.categoryLabel}>
                          {provider.categories?.length > 0
                            ? provider.categories
                              .map((catId: string) => categoriesData.find((c) => c.id === catId)?.name)
                              .filter(Boolean)
                              .join(", ")
                            : categoriesData.find((c) => c.id === provider.category)?.name || provider.category}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Star size={14} color="#FFA500" fill="#FFA500" />
                          <Text style={styles.rating}>
                            {(provider.rating || 0).toFixed(1)} ({provider.reviewCount || 0})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.providerFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>${provider.pricePerHour}</Text>
                        <Text style={styles.priceLabel}>/hour</Text>
                      </View>
                      <View style={styles.distanceContainer}>
                        <MapPin size={14} color="#9CA3AF" />
                        <Text style={styles.distance}>
                          {typeof provider.distance === "number" ? provider.distance.toFixed(1) : "0.0"} km away
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterIcon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#9CA3AF",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: "#2C2C2C",
    borderColor: "#2C2C2C",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  providersSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  providerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  providerImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  nearYouBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  nearYouBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  providerInfo: {
    padding: 16,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  categoryLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  providerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  priceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distance: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});

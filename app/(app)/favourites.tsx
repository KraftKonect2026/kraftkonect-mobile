import { Heart, MapPin, Star } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { mockFavorites, FavoriteProvider } from "@/mocks/favorites";
import Colors from "@/constants/colors";

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [favorites, setFavorites] = useState(mockFavorites);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  const renderProviderCard = (provider: FavoriteProvider) => (
    <TouchableOpacity
      key={provider.id}
      style={styles.providerCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/provider/${provider.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: provider.image }}
          style={styles.providerImage}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(provider.id);
          }}
        >
          <Heart
            size={20}
            color="#EF4444"
            strokeWidth={2}
            fill="#EF4444"
          />
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
        <Text style={styles.category}>{provider.category}</Text>
        <View style={styles.ratingRow}>
          <Star
            size={14}
            color="#F59E0B"
            strokeWidth={2}
            fill="#F59E0B"
          />
          <Text style={styles.ratingText}>
            {provider.rating} ({provider.reviewCount})
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>From ${provider.pricePerHour}</Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </View>
          <View style={styles.distanceRow}>
            <MapPin size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.distance}>{provider.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Favourites</Text>
        <Text style={styles.subtitle}>Your saved providers</Text>
      </View>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptyText}>
              Save providers you like to find them quickly later
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/explore")}
            >
              <Text style={styles.exploreButtonText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map(renderProviderCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  providerCard: {
    width: "47.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 160,
  },
  providerImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    flex: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  category: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  priceUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 2,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

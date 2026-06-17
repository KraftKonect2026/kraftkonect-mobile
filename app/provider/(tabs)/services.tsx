import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { MY_LISTINGS_QUERY } from "@/lib/queries";
import { UPDATE_LISTING_MUTATION, DELETE_LISTING_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const { data, loading, refetch } = useQuery(MY_LISTINGS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const [updateListing] = useMutation(UPDATE_LISTING_MUTATION);
  const [deleteListing] = useMutation(DELETE_LISTING_MUTATION);

  // Refresh whenever the tab regains focus (e.g. after adding a listing).
  useFocusEffect(
    useCallback(() => {
      refetch().catch(() => {});
    }, [refetch]),
  );

  const listings: any[] = data?.myProviderProfile?.listings ?? [];

  const toggleVisibility = async (id: string, currentActive: boolean) => {
    try {
      await updateListing({ variables: { id, input: { active: !currentActive } } });
      await refetch();
    } catch {
      showToast("error", "Couldn't update visibility. Please try again.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this service listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteListing({ variables: { id } });
              await refetch();
              showToast("success", "Listing deleted.");
            } catch {
              showToast("error", "Couldn't delete the listing. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenBackground>
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerBubble1} pointerEvents="none" />
        <View style={styles.headerBubble2} pointerEvents="none" />
        <Text style={styles.headerTitle}>My Services</Text>
        <Text style={styles.headerSubtitle}>
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading && listings.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : listings.length > 0 ? (
          <View style={styles.listingsList}>
            {listings.map((listing) => {
              const pricePerHour = (listing.priceCents ?? 0) / 100;
              const durationHrs = ((listing.durationMinutes ?? 0) / 60).toFixed(
                listing.durationMinutes % 60 === 0 ? 0 : 1,
              );
              const currencySymbol = listing.currency?.toUpperCase() === "NGN" ? "₦" : "$";
              return (
                <View key={listing.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    <View style={styles.listingHeaderLeft}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {listing.category}
                        </Text>
                      </View>
                      <View style={styles.visibilityToggle}>
                        {listing.active ? (
                          <Eye size={16} color={Colors.primary} strokeWidth={2} />
                        ) : (
                          <EyeOff size={16} color="#9CA3AF" strokeWidth={2} />
                        )}
                        <Switch
                          value={!!listing.active}
                          onValueChange={() =>
                            toggleVisibility(listing.id, !!listing.active)
                          }
                          trackColor={{ false: "#E5E7EB", true: Colors.primary }}
                          thumbColor="#FFFFFF"
                          ios_backgroundColor="#E5E7EB"
                        />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <Text style={styles.listingDescription} numberOfLines={2}>
                    {listing.description}
                  </Text>

                  <View style={styles.listingDetails}>
                    <View style={styles.listingDetail}>
                      <Text style={styles.listingDetailText}>
                        {currencySymbol}{pricePerHour.toLocaleString()}/hr
                      </Text>
                    </View>
                    <View style={styles.listingDetail}>
                      <Clock size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.listingDetailText}>
                        {durationHrs}h duration
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listingActions}>
                    <TouchableOpacity
                      style={styles.actionButtonSecondary}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/provider/edit-listing/${listing.id}` as any)}
                    >
                      <Edit3 size={16} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.actionButtonSecondaryText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonDanger}
                      activeOpacity={0.7}
                      onPress={() => handleDelete(listing.id)}
                    >
                      <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                      <Text style={styles.actionButtonDangerText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Plus size={48} color="#D1D5DB" strokeWidth={2} />
            </View>
            <Text style={styles.emptyStateTitle}>No services yet</Text>
            <Text style={styles.emptyStateDescription}>
              Create your first listing to start receiving bookings
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 96 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/provider/add-listing" as any)}
        >
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabButton}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.fabButtonText}>Add Listing</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  listingsList: {
    gap: 16,
  },
  listingCard: {
    padding: 16,
    ...glassSurface,
    borderRadius: Radius.lg,
    ...Shadows.soft,
  },
  listingHeader: {
    marginBottom: 12,
  },
  listingHeaderLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(219,234,254,0.7)",
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  visibilityToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  listingDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },
  listingDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listingDetailText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  listingActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(219,234,254,0.7)",
    gap: 6,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  actionButtonDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(254,226,226,0.7)",
    gap: 6,
  },
  actionButtonDangerText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: Radius.pill,
    gap: 8,
    ...Shadows.glow,
  },
  fabButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

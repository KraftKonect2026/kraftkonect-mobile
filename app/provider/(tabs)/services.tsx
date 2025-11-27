import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useProvider } from "@/contexts/ProviderContext";

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings, updateListing, deleteListing } = useProvider();

  const toggleVisibility = (id: string, currentVisibility: boolean) => {
    updateListing(id, { visible: !currentVisibility });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>My Services</Text>
        <Text style={styles.headerSubtitle}>
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {listings.length > 0 ? (
          <View style={styles.listingsList}>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <View style={styles.listingHeaderLeft}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {listing.category}
                      </Text>
                    </View>
                    <View style={styles.visibilityToggle}>
                      {listing.visible ? (
                        <Eye size={16} color={Colors.primary} strokeWidth={2} />
                      ) : (
                        <EyeOff size={16} color="#9CA3AF" strokeWidth={2} />
                      )}
                      <Switch
                        value={listing.visible}
                        onValueChange={() =>
                          toggleVisibility(listing.id, listing.visible)
                        }
                        trackColor={{
                          false: "#E5E7EB",
                          true: Colors.primary,
                        }}
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
                    <DollarSign size={16} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.listingDetailText}>
                      ${listing.pricePerHour}/hr
                    </Text>
                  </View>
                  <View style={styles.listingDetail}>
                    <Clock size={16} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.listingDetailText}>
                      {listing.duration}h duration
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
                    onPress={() => deleteListing(listing.id)}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                    <Text style={styles.actionButtonDangerText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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

      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.9}
          onPress={() => router.push("/provider/add-listing" as any)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabButtonText}>Add Listing</Text>
        </TouchableOpacity>
      </View>
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
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
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
    backgroundColor: "#EFF6FF",
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
    borderColor: "#F3F4F6",
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
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
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
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
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
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

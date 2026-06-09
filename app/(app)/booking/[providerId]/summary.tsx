import { ArrowLeft, Clock, Calendar, MapPin, ChevronRight } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { PROVIDER_QUERY } from "@/lib/queries";
import { ActivityIndicator } from "react-native";

export default function SummaryScreen() {
  const router = useRouter();
  const { providerId, serviceId, date, time } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
  }>();

  const { data, loading, error, refetch } = useQuery(PROVIDER_QUERY, {
    variables: { providerId: `${providerId}` },
    skip: !providerId,
    notifyOnNetworkStatusChange: true,
  });

  const provider = data?.provider;
  const service = (provider?.services || []).find((s: any) => s.id === serviceId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider || !service || !date || !time) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load booking summary" : "Booking information not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const bookingDate = new Date(date);
  const basePrice = service.priceCents ? service.priceCents / 100 : 0;
  const serviceFee = basePrice * 0.1;
  const totalAmount = basePrice + serviceFee;
  const currencySymbol = service.currency === "NGN" ? "₦" : "$";

  const handleContinue = () => {
    router.push(
      `/(app)/booking/${providerId}/payment?serviceId=${serviceId}&date=${date}&time=${time}` as any
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Summary</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.providerCard}>
            <Image
              source={{ uri: provider.avatar }}
              style={styles.providerAvatar}
              contentFit="cover"
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#9CA3AF" />
                <Text style={styles.locationText}>{provider.distance} km away</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Service Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{service.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <View style={styles.durationContainer}>
                <Clock size={14} color="#2C2C2C" />
                <Text style={styles.detailValue}>{service.durationMinutes} min</Text>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <View style={styles.dateContainer}>
                <Calendar size={14} color="#2C2C2C" />
                <Text style={styles.detailValue}>
                  {bookingDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Price Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{service.title}</Text>
              <Text style={styles.priceValue}>{currencySymbol}{basePrice.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee (10%)</Text>
              <Text style={styles.priceValue}>{currencySymbol}{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{currencySymbol}{totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              By continuing, you agree to book this service. You can cancel free of charge up to 24 hours before the scheduled time.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalFooterLabel}>Total Amount</Text>
          <Text style={styles.totalFooterValue}>{currencySymbol}{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Proceed to Payment</Text>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 160,
  },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoText: {
    fontSize: 14,
    color: "#2C2C2C",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalFooterLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  totalFooterValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});

import { ArrowLeft, Clock, Calendar, MapPin, ChevronRight, AlertCircle } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { PROVIDER_QUERY } from "@/lib/queries";
import { formatCurrency, formatNumberSafe } from "@/utils/currency";
import { formatBookingDate } from "@/utils/datetime";
import { ActivityIndicator } from "react-native";
import { Input } from "@/components/Input";

export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [bidAmount, setBidAmount] = useState<string>("");

  const defaultPrice = service?.minPriceCents != null ? service.minPriceCents / 100 : (service?.priceCents ?? 0) / 100;

  useEffect(() => {
    if (defaultPrice > 0 && !bidAmount) {
      setBidAmount(defaultPrice.toString());
    }
  }, [defaultPrice]);

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      </ScreenBackground>
    );
  }

  const parsedBid = parseFloat(bidAmount) || 0;
  const minAllowed = service?.minPriceCents != null ? service.minPriceCents / 100 : 0;
  const maxAllowed = service?.maxPriceCents != null ? service.maxPriceCents / 100 : 0;

  const isBidTooLow = minAllowed > 0 && parsedBid < minAllowed;
  const isBidTooHigh = maxAllowed > 0 && parsedBid > maxAllowed;
  const isValidBid = parsedBid > 0 && !isBidTooLow && !isBidTooHigh;

  if (error || !provider || !service || !date || !time) {
    return (
      <ScreenBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load booking summary" : "Booking information not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
    );
  }

  const basePrice = parsedBid;
  const serviceFee = basePrice * 0.1;
  const totalAmount = basePrice + serviceFee;
  const hasValidPrice = isValidBid;

  const handleContinue = () => {
    if (isValidBid) {
      router.push(
        `/(app)/booking/${providerId}/payment?serviceId=${serviceId}&date=${date}&time=${time}&bidAmount=${parsedBid}` as any
      );
    }
  };

  return (
    <ScreenBackground>
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

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
                <Text style={styles.detailValue}>{formatBookingDate(date)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Offer (Bid)</Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12, lineHeight: 20 }}>
              The bidding range for this service is{" "}
              <Text style={{ fontWeight: "700" }}>
                {minAllowed > 0
                  ? maxAllowed > 0
                    ? `₦${formatNumberSafe(minAllowed)} - ₦${formatNumberSafe(maxAllowed)}`
                    : `₦${formatNumberSafe(minAllowed)} minimum`
                  : "any amount"}
              </Text>
              . Please enter your custom offer below.
            </Text>
            
            <Input
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={bidAmount}
              onChangeText={setBidAmount}
              style={[
                isBidTooLow || isBidTooHigh ? { borderColor: "#EF4444" } : null
              ]}
            />
            {isBidTooLow && (
              <Text style={{ fontSize: 13, color: "#EF4444", marginTop: 4 }}>
                Offer must be at least ₦{formatNumberSafe(minAllowed)}
              </Text>
            )}
            {isBidTooHigh && (
              <Text style={{ fontSize: 13, color: "#EF4444", marginTop: 4 }}>
                Offer cannot exceed ₦{formatNumberSafe(maxAllowed)}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Price Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{service.title}</Text>
              <Text style={styles.priceValue}>{formatCurrency(basePrice, service.currency)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee (10%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(serviceFee, service.currency)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount, service.currency)}</Text>
            </View>
          </View>

          {!hasValidPrice && (
            <View style={styles.priceWarning}>
              <AlertCircle size={16} color="#D97706" strokeWidth={2} />
              <Text style={styles.priceWarningText}>
                This service has no price set. The provider needs to update their listing before you can book it.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              By continuing, you agree to book this service. You can cancel free of charge up to 24 hours before the scheduled time.
            </Text>
          </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalFooterLabel}>Total Amount</Text>
          <Text style={styles.totalFooterValue}>{formatCurrency(totalAmount, service.currency)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, !hasValidPrice && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={!hasValidPrice}
        >
          {hasValidPrice ? (
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Proceed to Payment</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          ) : (
            <View style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Proceed to Payment</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
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
  priceWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  priceWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
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
    borderRadius: Radius.pill,
    overflow: "hidden",
    ...Shadows.glow,
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB",
    ...Shadows.soft,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  continueButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
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

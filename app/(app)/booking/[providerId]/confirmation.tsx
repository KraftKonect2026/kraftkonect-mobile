import { CheckCircle, Calendar, Clock, MessageCircle, Home } from "lucide-react-native";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Animated,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { PROVIDER_QUERY } from "@/lib/queries";
import { formatCurrency } from "@/utils/currency";
import { formatBookingDate } from "@/utils/datetime";
import { ActivityIndicator } from "react-native";
import { useOpenChat } from "@/lib/useOpenChat";

export default function ConfirmationScreen() {
  const router = useRouter();
  const openChat = useOpenChat();
  const { providerId, serviceId, date, time, bookingId } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
    bookingId: string;
  }>();

  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

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
          <Text style={styles.loadingText}>Finalizing booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider || !service || !date || !time || !bookingId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load booking confirmation" : "Booking information not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const basePrice = service.priceCents ? service.priceCents / 100 : 0;
  const serviceFee = basePrice * 0.1;
  const totalAmount = basePrice + serviceFee;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color="#10B981" fill="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successMessage}>
              Your booking has been successfully placed and is awaiting provider confirmation.
            </Text>
          </Animated.View>

          <View style={styles.statusCard}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending Provider Confirmation</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Booking Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={[styles.detailValue, styles.bookingId]}>{bookingId}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider</Text>
              <Text style={styles.detailValue}>{provider.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{service.title}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Calendar size={16} color="#9CA3AF" />
              <Text style={[styles.detailLabel, styles.iconLabel]}>Date</Text>
              <Text style={styles.detailValue}>{formatBookingDate(date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#9CA3AF" />
              <Text style={[styles.detailLabel, styles.iconLabel]}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#9CA3AF" />
              <Text style={[styles.detailLabel, styles.iconLabel]}>Duration</Text>
              <Text style={styles.detailValue}>{service.durationMinutes} min</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount, service.currency)}</Text>
            </View>
          </View>

          <View style={styles.providerCard}>
            <Image
              source={{ uri: provider.avatar }}
              style={styles.providerAvatar}
              contentFit="cover"
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerBio} numberOfLines={2}>
                {provider.bio}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.8}
            onPress={() =>
              provider?.user?.id &&
              openChat(provider.user.id, provider.name ?? "", provider.avatar ?? "")
            }
          >
            <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.chatButtonText}>Message Provider</Text>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What's Next?</Text>
            <Text style={styles.infoText}>
              • The provider will confirm your booking shortly{"\n"}
              • You'll receive a notification once confirmed{"\n"}
              • Payment will be held securely in escrow{"\n"}
              • Funds will be released after service completion
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.8}
          onPress={() => router.replace("/(app)" as any)}
        >
          <Home size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.homeButtonText}>Back to Home</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  statusCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F59E0B" + "40",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#D97706",
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
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
    flex: 1,
  },
  iconLabel: {
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    textAlign: "right",
  },
  bookingId: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    flex: 1,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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
  providerBio: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  chatButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
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
  homeButton: {
    flexDirection: "row",
    backgroundColor: "#2C2C2C",
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  homeButtonText: {
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

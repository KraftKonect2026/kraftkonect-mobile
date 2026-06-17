import { ArrowLeft, Clock, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView,  } from "react-native";
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
import { formatPriceCents } from "@/utils/currency";
import { ActivityIndicator } from "react-native";

export default function SelectServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery(PROVIDER_QUERY, {
    variables: { providerId: `${providerId}` },
    skip: !providerId,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const provider = data?.provider;

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching available services...</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (error || !provider) {
    return (
      <ScreenBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load provider services" : "Provider not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
    );
  }

  const selectedService = (provider.services || []).find((s: any) => s.id === selectedServiceId);

  const handleContinue = () => {
    if (selectedServiceId) {
      router.push(`/(app)/booking/${providerId}/date-time?serviceId=${selectedServiceId}` as any);
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
        <Text style={styles.headerTitle}>Select Service</Text>
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
              <Text style={styles.providerBio} numberOfLines={2}>
                {provider.bio}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Available Services</Text>

          {(provider.services || []).map((service: any) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedServiceId(service.id)}
              >
                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <View style={styles.serviceFooter}>
                    <View style={styles.durationContainer}>
                      <Clock size={16} color="#9CA3AF" />
                      <Text style={styles.durationText}>{service.durationMinutes} min</Text>
                    </View>
                    <Text style={styles.servicePrice}>
                      {service.minPriceCents != null && service.maxPriceCents != null && service.maxPriceCents > service.minPriceCents
                        ? `${formatPriceCents(service.minPriceCents, service.currency)} - ${formatPriceCents(service.maxPriceCents, service.currency)}`
                        : formatPriceCents(service.minPriceCents ?? service.priceCents, service.currency)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.summaryContainer}>
          {selectedService && (
            <>
              <Text style={styles.summaryLabel}>Selected Service</Text>
              <Text style={styles.summaryValue}>{selectedService.title}</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={[styles.continueButton, !selectedServiceId && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={!selectedServiceId}
        >
          {selectedServiceId ? (
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          ) : (
            <View style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingBottom: 120,
  },
  providerCard: {
    flexDirection: "row",
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 24,
    ...Shadows.soft,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  serviceCard: {
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    ...Shadows.soft,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(219,234,254,0.7)",
  },
  serviceContent: {
    gap: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.65)",
    padding: 20,
    ...Shadows.medium,
  },
  summaryContainer: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  continueButton: {
    borderRadius: Radius.pill,
    overflow: "hidden",
    ...Shadows.glow,
  },
  continueButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
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

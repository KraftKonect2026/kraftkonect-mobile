import { ArrowLeft, Clock, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { PROVIDER_QUERY } from "@/lib/queries";
import { formatPriceCents } from "@/utils/currency";
import { ActivityIndicator } from "react-native";

export default function SelectServiceScreen() {
  const router = useRouter();
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching available services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load provider services" : "Provider not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedService = (provider.services || []).find((s: any) => s.id === selectedServiceId);

  const handleContinue = () => {
    if (selectedServiceId) {
      router.push(`/(app)/booking/${providerId}/date-time?serviceId=${selectedServiceId}` as any);
    }
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
          <Text style={styles.headerTitle}>Select Service</Text>
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
                      {formatPriceCents(service.priceCents, service.currency)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
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
          <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingBottom: 120,
  },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
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
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
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
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB",
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

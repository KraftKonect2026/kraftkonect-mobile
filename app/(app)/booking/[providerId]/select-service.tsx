import { ArrowLeft, Clock, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { providers } from "@/mocks/providers";

export default function SelectServiceScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Provider not found</Text>
      </SafeAreaView>
    );
  }

  const selectedService = provider.services.find((s) => s.id === selectedServiceId);

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

          {provider.services.map((service) => {
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
                      <Text style={styles.durationText}>{service.duration} min</Text>
                    </View>
                    <Text style={styles.servicePrice}>${service.price}</Text>
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
  errorText: {
    fontSize: 18,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

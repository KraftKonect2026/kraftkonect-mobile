import React from "react";
import { View, Text, StyleSheet, ScrollView,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CheckCircle2, ArrowRight } from "lucide-react-native";
import Colors from "@/constants/colors";

import { useMutation } from "@apollo/client";
import { ONBOARD_PROVIDER_MUTATION, START_KYC_INQUIRY_MUTATION } from "@/lib/mutations";
import { useProviderOnboarding } from "./context";
import { ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { useToast } from "@/lib/toast";
import * as WebBrowser from "expo-web-browser";
import { Inquiry, Environment } from "react-native-persona";

import { Button } from "@/components/Button";

export default function SubmitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basicInfo, selectedCategories, verification, experience } = useProviderOnboarding();

  const [submitProvider, { loading: submitLoading }] = useMutation(ONBOARD_PROVIDER_MUTATION);
  const [startKycInquiry, { loading: kycLoading }] = useMutation(START_KYC_INQUIRY_MUTATION);
  const [isVerifying, setIsVerifying] = useState(false);
  const { showToast } = useToast()

  const isComplete =
    !!basicInfo.name &&
    !!basicInfo.email &&
    !!basicInfo.phone &&
    selectedCategories.length > 0 &&
    !!experience.description;

  const handleSubmit = async () => {
    if (!isComplete) {
      showToast("error", "Please complete all steps before submitting.");
      return;
    }
    try {
      setIsVerifying(true);
      // 1. Submit basic provider profile with placeholder document URLs
      const submitRes = await submitProvider({
        variables: {
          input: {
            name: basicInfo.name,
            email: basicInfo.email,
            phone: basicInfo.phone,
            selectedCategories: selectedCategories,
            idUrl: "", // placeholder for backward-compatibility
            selfieUrl: "", // placeholder for backward-compatibility
            experience: experience.years,
            description: experience.description,
          }
        }
      });

      const providerId = submitRes.data?.onboardProvider?.id;
      if (!providerId) {
        throw new Error("Failed to retrieve provider profile registration ID.");
      }

      // 2. Request the Persona Inquiry link from backend
      const kycRes = await startKycInquiry({
        variables: { providerId }
      });

      const { inquiryId, clientToken, inquiryUrl } = kycRes.data?.startKycInquiry || {};
      if (!inquiryId || !inquiryUrl) {
        throw new Error("Failed to generate secure verification session.");
      }

      // 3. Launch the native Persona SDK Flow (or fall back to WebBrowser on error/simulator)
      try {
        Inquiry.fromInquiry(inquiryId)
          .sessionToken(clientToken || "")
          .onComplete((completedInquiryId: string, status: string) => {
            console.log(`[Persona SDK] Inquiry completed: ${completedInquiryId}, status: ${status}`);
            showToast("success", "Identity verification complete!");
            router.replace("/provider-onboarding/pending-approval" as any);
          })
          .onCanceled((canceledInquiryId?: string, sessionToken?: string) => {
            console.log(`[Persona SDK] Inquiry canceled: ${canceledInquiryId}`);
            showToast("info", "Identity verification was canceled.");
            router.replace("/provider-onboarding/pending-approval" as any);
          })
          .onError((error: Error) => {
            console.warn(`[Persona SDK Error, falling back to WebBrowser]:`, error);
            WebBrowser.openBrowserAsync(inquiryUrl).then(() => {
              router.replace("/provider-onboarding/pending-approval" as any);
            });
          })
          .build()
          .start();
      } catch (sdkErr) {
        console.warn("[Persona SDK Exception, falling back to WebBrowser]:", sdkErr);
        await WebBrowser.openBrowserAsync(inquiryUrl);
        router.replace("/provider-onboarding/pending-approval" as any);
      }
    } catch (error: any) {
      console.error("Submission/KYC failed:", error);
      showToast("error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const loading = submitLoading || kycLoading || isVerifying;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color={Colors.primary} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ready to submit?</Text>
          <Text style={styles.subtitle}>
            Review your information before submitting your provider application
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Profile Information</Text>
            <Text style={styles.summaryValue}>{basicInfo.name ? "Complete ✓" : "Missing"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Categories Selected</Text>
            <Text style={styles.summaryValue}>{selectedCategories.length > 0 ? "Complete ✓" : "Missing"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Identity Verification</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>Required Next ➜</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Experience & Description</Text>
            <Text style={styles.summaryValue}>{experience.description ? "Complete ✓" : "Missing"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            1. Our team will review your application{"\n"}
            2. This typically takes 24-48 hours{"\n"}
            3. You&apos;ll receive an email with the decision{"\n"}
            4. Once approved, you can start creating listings
          </Text>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By submitting, you agree to KraftKonect&apos;s{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Provider Agreement</Text>
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Submit Application"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isComplete}
          icon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Go back to edit"
          variant="outline"
          style={{ borderWidth: 0, height: 48 }}
          textStyle={{ color: "#6B7280", fontWeight: "500", fontSize: 15 }}
          onPress={() => router.back()}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#2C2C2C",
    fontWeight: "500" as const,
  },
  summaryValue: {
    fontSize: 15,
    color: "#22C55E",
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  infoCard: {
    padding: 20,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 24,
  },
  termsContainer: {
    paddingHorizontal: 4,
  },
  termsText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: "500" as const,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  backButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
});

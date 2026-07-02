import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useProviderOnboarding } from "./context";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function ExperienceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { experience, setExperience } = useProviderOnboarding();

  const handleUpdate = (updates: Partial<typeof experience>) => {
    setExperience({ ...experience, ...updates });
  };

  const isValid = experience.years.length > 0 && experience.description.length > 50;

  return (
    <ScreenBackground>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.step}>Step 3 of 4</Text>
          <Text style={styles.title}>Tell us about your experience</Text>
          <Text style={styles.subtitle}>
            Share your skills and what makes you great at what you do
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Years of Experience"
            placeholder="e.g., 5 years"
            value={experience.years}
            onChangeText={(text) => handleUpdate({ years: text })}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>About Your Services</Text>
            <Text style={styles.characterCount}>
              {experience.description.length} / 200 characters (min 50)
            </Text>
            <Input
              placeholder="Describe your experience, specialties, and what customers can expect when working with you..."
              value={experience.description}
              onChangeText={(text) => handleUpdate({ description: text })}
              multiline
              numberOfLines={8}
              maxLength={200}
              style={{ height: 160, borderRadius: 20 }}
              inputStyle={{ textAlignVertical: "top", paddingTop: 12, height: "100%" }}
            />
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Tips for a great profile:</Text>
            <Text style={styles.tipText}>
              • Highlight your unique skills and expertise{"\n"}
              • Mention any certifications or training{"\n"}
              • Share what sets you apart from others{"\n"}
              • Be clear about what services you offer
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Continue"
          onPress={() => router.push("/provider-onboarding/submit" as any)}
          disabled={!isValid}
          icon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
        />
      </View>
    </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  titleContainer: {
    marginBottom: 32,
  },
  step: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  characterCount: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "right",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    fontSize: 16,
    color: "#2C2C2C",
  },
  textArea: {
    minHeight: 160,
    paddingTop: 14,
  },
  tipCard: {
    padding: 20,
    backgroundColor: "rgba(219,234,254,0.7)",
    borderRadius: Radius.md,
    marginTop: 8,
    ...Shadows.soft,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.65)",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

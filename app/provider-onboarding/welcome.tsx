import React from "react";
import { View, Text, StyleSheet, ScrollView,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, DollarSign, Calendar, Users } from "lucide-react-native";
import Colors from "@/constants/colors";

import { Button } from "@/components/Button";

export default function ProviderWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const benefits = [
    {
      icon: DollarSign,
      title: "Earn on your terms",
      description: "Set your own rates and schedule",
    },
    {
      icon: Calendar,
      title: "Flexible schedule",
      description: "Work when it suits you best",
    },
    {
      icon: Users,
      title: "Growing customer base",
      description: "Connect with customers in your area",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Start earning by{"\n"}offering your skills</Text>
          <Text style={styles.subtitle}>
            Join thousands of providers on KraftKonect
          </Text>
        </View>

        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationPlaceholder}>
            <Users size={80} color={Colors.primary} strokeWidth={1.5} />
          </View>
        </View>

        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <benefit.icon size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Get Started"
          onPress={() => router.push("/provider-onboarding/basic-info" as any)}
          icon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Maybe later"
          variant="outline"
          style={{ borderWidth: 0, height: 48 }}
          textStyle={{ color: "#6B7280", fontWeight: "500", fontSize: 15 }}
          onPress={() => router.back()}
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  benefitsContainer: {
    gap: 16,
  },
  benefitCard: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  benefitTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
});

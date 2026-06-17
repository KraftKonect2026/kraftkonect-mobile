import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { SafeAreaView } from "react-native-safe-area-context";
import { Formik } from "formik";
import * as Yup from "yup";
import Colors from "@/constants/colors";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Shadows } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { GlassCard } from "@/components/GlassCard";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const handleSendLink = async () => {
    setTimeout(() => {
      Alert.alert("Success", "Recovery link sent to your email!", [
        {
          text: "OK",
          onPress: () => router.push("/forgot-password/reset" as any),
        },
      ]);
    }, 1000);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Formik
            initialValues={{ email: "" }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleSendLink}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                  <View style={styles.icon}>
                    <Mail size={48} color={Colors.primary} strokeWidth={1.5} />
                  </View>
                </View>

                <View style={styles.header}>
                  <Text style={styles.title}>Forgot Password?</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address and we&apos;ll send you a link to reset
                    your password
                  </Text>
                </View>

                <GlassCard padding={20} elevation="medium" style={styles.formCard}>
                  <View style={styles.form}>
                    <Input
                      label="Email Address"
                      placeholder="john@example.com"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      touched={touched.email}
                      error={errors.email}
                    />

                    <Button
                      title={isSubmitting ? "Sending..." : "Send Recovery Link"}
                      onPress={handleSubmit}
                      loading={isSubmitting}
                    />

                    <TouchableOpacity
                      style={styles.backToSignInButton}
                      onPress={() => router.back()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backToSignInText}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </ScrollView>
            )}
          </Formik>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    ...Shadows.soft,
  },
  formCard: {
    marginBottom: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  icon: {
    width: 100,
    height: 100,
    backgroundColor: "#EFF6FF",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  backToSignInButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  backToSignInText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});

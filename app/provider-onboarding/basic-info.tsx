import React from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, User, Mail, Phone } from "lucide-react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useProviderOnboarding } from "./context";
import { useAppSelector } from "@/store";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const basicInfoSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9+\-\s()]*$/, "Invalid phone number")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone number is required"),
});

export default function BasicInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basicInfo, setBasicInfo } = useProviderOnboarding();
  const user = useAppSelector((state) => state.auth.user);

  // Prefill from the logged-in account so the user doesn't re-type known details.
  const initialValues = {
    name: basicInfo.name || user?.name || "",
    email: basicInfo.email || user?.email || "",
    phone: basicInfo.phone || user?.phone || "",
  };

  return (
    <ScreenBackground>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={basicInfoSchema}
        onSubmit={(values) => {
          setBasicInfo(values);
          router.push("/provider-onboarding/category" as any);
        }}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
          <>
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
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
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
                <Text style={styles.step}>Step 1 of 5</Text>
                <Text style={styles.title}>Tell us about yourself</Text>
                <Text style={styles.subtitle}>
                  We&apos;ll use this information to set up your provider profile
                </Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  autoCapitalize="words"
                  touched={touched.name}
                  error={errors.name}
                  icon={<User size={20} color="#9CA3AF" strokeWidth={2} />}
                />

                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  touched={touched.email}
                  error={errors.email}
                  icon={<Mail size={20} color="#9CA3AF" strokeWidth={2} />}
                />

                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={values.phone}
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  keyboardType="phone-pad"
                  touched={touched.phone}
                  error={errors.phone}
                  icon={<Phone size={20} color="#9CA3AF" strokeWidth={2} />}
                />
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
              <Button
                title="Continue"
                onPress={handleSubmit}
                disabled={!isValid}
                icon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
              />
            </View>
          </>
        )}
      </Formik>
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    gap: 12,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
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

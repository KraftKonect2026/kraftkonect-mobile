import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, User, Mail, Phone } from "lucide-react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import Colors from "@/constants/colors";
import { useProviderOnboarding } from "./context";
import { useAppSelector } from "@/store";

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
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
              </View>
              <View style={styles.placeholder} />
            </View>

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
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, touched.name && errors.name && styles.inputWrapperError]}>
                    <User size={20} color="#9CA3AF" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      autoCapitalize="words"
                    />
                  </View>
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputWrapper, touched.email && errors.email && styles.inputWrapperError]}>
                    <Mail size={20} color="#9CA3AF" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputWrapper, touched.phone && errors.phone && styles.inputWrapperError]}>
                    <Phone size={20} color="#9CA3AF" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#9CA3AF"
                      value={values.phone}
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
                activeOpacity={0.8}
                disabled={!isValid}
                onPress={() => handleSubmit()}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </Formik>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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

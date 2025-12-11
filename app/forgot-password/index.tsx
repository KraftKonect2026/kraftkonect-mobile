import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Formik } from "formik";
import * as Yup from "yup";
import Colors from "@/constants/colors";

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
    <View style={styles.wrapper}>
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

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.input, touched.email && errors.email && styles.inputError]}
                      placeholder="john@example.com"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.sendButton, isSubmitting && styles.disabledButton]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendButtonText}>
                      {isSubmitting ? "Sending..." : "Send Recovery Link"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToSignInButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backToSignInText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Formik>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    justifyContent: "center",
    marginBottom: 20,
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

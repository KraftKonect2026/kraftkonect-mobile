import { useRouter } from "expo-router";
import { ArrowLeft, Lock } from "lucide-react-native";
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

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

export default function ResetPasswordScreen() {
  const router = useRouter();

  const handleResetPassword = async () => {
    setTimeout(() => {
      Alert.alert(
        "Success",
        "Your password has been reset successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/sign-in" as any),
          },
        ]
      );
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
            initialValues={{ newPassword: "", confirmPassword: "" }}
            validationSchema={resetPasswordSchema}
            onSubmit={handleResetPassword}
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
                    <Lock size={48} color={Colors.primary} strokeWidth={1.5} />
                  </View>
                </View>

                <View style={styles.header}>
                  <Text style={styles.title}>Set New Password</Text>
                  <Text style={styles.subtitle}>
                    Create a strong password for your account
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={[styles.input, touched.newPassword && errors.newPassword && styles.inputError]}
                      placeholder="Enter new password"
                      value={values.newPassword}
                      onChangeText={handleChange("newPassword")}
                      onBlur={handleBlur("newPassword")}
                      secureTextEntry
                      placeholderTextColor={Colors.textSecondary}
                    />
                    {touched.newPassword && errors.newPassword && (
                      <Text style={styles.errorText}>{errors.newPassword}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={[styles.input, touched.confirmPassword && errors.confirmPassword && styles.inputError]}
                      placeholder="Re-enter new password"
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      secureTextEntry
                      placeholderTextColor={Colors.textSecondary}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.resetButton, isSubmitting && styles.disabledButton]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resetButtonText}>
                      {isSubmitting ? "Resetting..." : "Reset Password"}
                    </Text>
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
  resetButton: {
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
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
});

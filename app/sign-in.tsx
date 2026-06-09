import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
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
import Svg, { Path } from "react-native-svg";
import { Formik } from "formik";
import * as Yup from "yup";
import Colors from "@/constants/colors";
import { useAppDispatch } from "@/store";
import { setUser, setTokens, setIsAuthenticated } from "@/store/authSlice";
import { useMutation } from "@apollo/client";
import { SIGN_IN_MUTATION } from "@/lib/mutations";
import { AuthPayload } from "@/types";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import { useToast } from "@/lib/toast";

const signInSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required"),
});

export default function SignInScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signIn] = useMutation(SIGN_IN_MUTATION)
  const { showToast } = useToast()

  const handleSignIn = async (values: { email: string; password: string }) => {
    try {
      const res = await signIn({
        variables: {
          email: values.email,
          password: values.password,
        },
      });

      if (res.data?.signIn) {
        showToast("success", "Sign in successful 🎉")
        const authPayload = res.data.signIn as AuthPayload;
        dispatch(setUser(authPayload.user));
        if (authPayload.accessToken && authPayload.refreshToken) {
          dispatch(setTokens({
            accessToken: authPayload.accessToken,
            refreshToken: authPayload.refreshToken,
          }));
        }
        if (authPayload.user?.metadata?.email_verified) {
          // Flip auth state first so the root layout mounts the (app) stack,
          // then navigate — otherwise the target route isn't registered yet.
          dispatch(setIsAuthenticated(true));
          router.replace("/(app)" as any);
        } else {
          router.replace("/sign-up/verify-email" as any);
        }
      }

    } catch (e: any) {

      const message = getApolloErrorMessage(e);
      showToast("error", `${message} 😢`)

    }
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={signInSchema}
            onSubmit={handleSignIn}
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

                <View style={styles.header}>
                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to continue to KraftKonect
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={[styles.input, touched.password && errors.password && styles.inputError]}
                      placeholder="Enter your password"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      secureTextEntry
                      placeholderTextColor={Colors.textSecondary}
                    />
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push("/forgot-password" as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.signInButton, isSubmitting && styles.disabledButton]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signInButtonText}>
                      {isSubmitting ? "Signing In..." : "Login"}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </Svg>
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08l.02-.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000" />
                    </Svg>
                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>

                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/sign-up" as any)}>
                      <Text style={styles.signUpLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
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
  forgotPassword: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600" as const,
    textAlign: "right",
  },
  signInButton: {
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
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  signUpText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  signUpLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
});

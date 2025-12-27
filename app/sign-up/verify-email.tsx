import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useState, useRef } from "react";
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
import Colors from "@/constants/colors";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import { setTokens, setUser } from "@/store/authSlice";
import { AuthPayload } from "@/types";
import { useToast } from "@/lib/toast";
import { useMutation } from "@apollo/client";
import { useAppDispatch, useAppSelector } from "@/store";
import { RESEND_OTP_MUTATION, VERIFY_EMAIL_MUTATION } from "@/lib/mutations";
import { useCountdown } from "@/lib/hooks/useCountdown";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const token = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [verifyEmail, { loading: isVerifyEmailLoading }] = useMutation(VERIFY_EMAIL_MUTATION)
  const [resendOtp, { loading: isResendOtpLoading }] = useMutation(RESEND_OTP_MUTATION)
  const { showToast } = useToast()
  const { seconds, isActive, start, reset, formattedTime } = useCountdown({
    initialSeconds: 60,
    autoStart: false,
    onComplete: () => {
      showToast("info", "Verification code expired. Please request a new one.");
    },
  });

  const handleVerifyEmail = async (values: { email: string; otp: string, }) => {
    try {
      const res = await verifyEmail({
        variables: {
          email: values.email,
          otp: values.otp,
        },
      });

      if (res.data?.verifyEmail) {
        const authPayload = res.data.verifyEmail as AuthPayload;
        showToast("success", `${authPayload?.message} 🎉`)
        dispatch(setUser(authPayload?.user));
        if (authPayload.accessToken && authPayload.refreshToken) {
          dispatch(setTokens({
            accessToken: authPayload.accessToken,
            refreshToken: authPayload.refreshToken,
          }));
        }
        router.replace("/(app)/explore" as any);
      }

    } catch (e: any) {

      const message = getApolloErrorMessage(e);
      showToast("error", `${message} 😢`)

    }
  };

  const handleResendOtp = async (values: { email: string }) => {
    try {
      const res = await resendOtp({
        variables: {
          email: values.email,
        },
      });

      if (res.data?.resendOtp?.success) {
        const authPayload = res.data.resendOtp as AuthPayload;
        showToast("success", `${authPayload?.message} 🎉`)

      }

    } catch (e: any) {

      const message = getApolloErrorMessage(e);
      showToast("error", `${message} 😢`)

    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };



  const handleResend = () => {
    if (!user?.email) {
      showToast("error", "Email not found. Please go back and try again. 😢");
      return;
    }
    handleResendOtp({ email: user?.email || '' });
    setOtp(['', '', '', '', '', '']);
    reset();
    start();
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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

            <View style={styles.textContainer}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.message}>
                We&apos;ve sent a 6-digit verification code to your email address. Please enter it below.
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.continueButton, isVerifyEmailLoading && styles.disabledButton]}
                onPress={handleVerifyEmail.bind(null, { email: user?.email || '', otp: otp.join('') })}
                disabled={isVerifyEmailLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {isVerifyEmailLoading ? "Verifying..." : "Verify"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                disabled={isResendOtpLoading || isActive}
                activeOpacity={0.8}
              >
                <Text style={styles.resendButtonText}>
                  {isActive ? `Resend Code in ${formattedTime}` : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  icon: {
    width: 120,
    height: 120,
    backgroundColor: "#EFF6FF",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    backgroundColor: "#F9FAFB",
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  resendButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});

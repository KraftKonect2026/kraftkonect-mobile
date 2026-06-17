import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Smartphone } from "lucide-react-native";
import React, { useState, useRef, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAppDispatch } from "@/store";
import { setIsAuthenticated, setTokens, setUser } from "@/store/authSlice";
import { Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/lib/toast";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import {
  REQUEST_PHONE_OTP_MUTATION,
  VERIFY_PHONE_OTP_MUTATION,
} from "@/lib/mutations";

const RESEND_COOLDOWN = 60;

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  // Optional param: when passed, OTP is sent automatically on mount (AC1)
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();

  const [phone, setPhone] = useState(phoneParam ?? "");
  const [pinId, setPinId] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [codeSent, setCodeSent] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { isActive: cooldownActive, start: startCooldown, reset: resetCooldown, formattedTime } =
    useCountdown({ initialSeconds: RESEND_COOLDOWN, autoStart: false });

  const [requestPhoneOTP, { loading: sendingOtp }] = useMutation(
    REQUEST_PHONE_OTP_MUTATION,
  );
  const [verifyPhoneOTP, { loading: verifying }] = useMutation(
    VERIFY_PHONE_OTP_MUTATION,
  );

  // ── Core send logic (used by both auto-send and Resend button) ────────────
  const sendOtp = async (phoneNumber: string) => {
    try {
      const res = await requestPhoneOTP({
        variables: { phone: phoneNumber },
      });
      const id: string | undefined = res.data?.requestPhoneOTP?.pinId;
      if (!id) throw new Error("No pinId returned");
      setPinId(id);
      setCodeSent(true);
      resetCooldown();
      startCooldown();
    } catch (e: any) {
      const msg = getApolloErrorMessage(e);
      toast.error(msg);
    }
  };

  // AC1: auto-send when phone is in route params
  useEffect(() => {
    if (phoneParam) {
      sendOtp(phoneParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── OTP input helpers (6-box, same UX as verify-email) ───────────────────
  const handleOtpChange = (text: string, index: number) => {
    const char = text.slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify (AC2 + AC3) ───────────────────────────────────────────────────
  const handleVerify = async () => {
    const pin = otp.join("");
    if (pin.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    if (!pinId) {
      toast.error("No active OTP session — tap Resend");
      return;
    }
    try {
      const res = await verifyPhoneOTP({
        variables: { phone, pin, pinId },
      });
      if (res.data?.verifyPhoneOTP) {
        const { accessToken, refreshToken, user } = res.data.verifyPhoneOTP;
        dispatch(setUser(user));
        if (accessToken && refreshToken) {
          dispatch(setTokens({ accessToken, refreshToken }));
          dispatch(setIsAuthenticated(true));
        }
        toast.success("Phone verified!");
        router.replace("/provider-onboarding/welcome" as any);
      }
    } catch (e: any) {
      const msg = getApolloErrorMessage(e);
      // AC3: show clear error and clear OTP boxes for retry
      toast.error(msg.includes("OTP") ? msg : "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  // ── Resend (AC4) ──────────────────────────────────────────────────────────
  const handleResend = () => {
    if (!phone) {
      toast.error("Enter your phone number first");
      return;
    }
    setOtp(["", "", "", "", "", ""]);
    sendOtp(phone);
    inputRefs.current[0]?.focus();
  };

  // ── Phase 1: phone entry ──────────────────────────────────────────────────
  if (!codeSent) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
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
                  <Smartphone size={48} color={Colors.primary} strokeWidth={1.5} />
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>Verify Your Phone</Text>
                <Text style={styles.message}>
                  Enter your Nigerian phone number. We&apos;ll send you a
                  6-digit SMS code via Termii.
                </Text>
              </View>

              <GlassCard padding={20} elevation="medium" style={styles.formCard}>
                <View style={styles.form}>
                  <Input
                    label="Phone Number"
                    placeholder="+2348012345678"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                  />

                  <Button
                    title="Send Code"
                    onPress={() => {
                      if (!phone || phone.length < 10) {
                        toast.error("Please enter a valid phone number");
                        return;
                      }
                      sendOtp(phone);
                    }}
                    loading={sendingOtp}
                    style={{ marginTop: 8, marginBottom: 8 }}
                  />

                  <Button
                    title="Do it later"
                    variant="outline"
                    style={{ borderWidth: 0, height: 48 }}
                    textStyle={{ color: Colors.textSecondary, fontWeight: "500", fontSize: 15 }}
                    onPress={() => router.replace("/provider-onboarding/welcome" as any)}
                  />
                </View>
              </GlassCard>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  // ── Phase 2: OTP entry ────────────────────────────────────────────────────
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setCodeSent(false);
                setOtp(["", "", "", "", "", ""]);
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Smartphone size={48} color={Colors.primary} strokeWidth={1.5} />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Enter the Code</Text>
              <Text style={styles.message}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>
            </View>

            <GlassCard padding={20} elevation="medium" style={styles.formCard}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
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
                <Button
                  title="Verify"
                  onPress={handleVerify}
                  loading={verifying}
                  style={{ marginBottom: 12 }}
                />

                <Button
                  title={cooldownActive ? `Resend in ${formattedTime}` : sendingOtp ? "Sending…" : "Resend Code"}
                  variant="outline"
                  style={{ borderWidth: 0, height: 48, marginBottom: 12 }}
                  textStyle={{ color: Colors.primary, fontWeight: "600", fontSize: 16 }}
                  onPress={handleResend}
                  disabled={cooldownActive || sendingOtp}
                />

                <Button
                  title="Do it later"
                  variant="outline"
                  style={{ borderWidth: 0, height: 48 }}
                  textStyle={{ color: Colors.textSecondary, fontWeight: "500", fontSize: 15 }}
                  onPress={() => router.replace("/provider-onboarding/welcome" as any)}
                />
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
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
  header: {
    marginBottom: 24,
  },
  formCard: {
    marginBottom: 8,
  },
  iconContainer: { alignItems: "center", marginTop: 16, marginBottom: 24 },
  icon: {
    width: 100,
    height: 100,
    backgroundColor: "#EFF6FF",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { alignItems: "center", paddingHorizontal: 20, marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  message: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24, textAlign: "center" },
  phoneHighlight: { fontWeight: "600" as const, color: Colors.textPrimary },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 15, fontWeight: "600" as const, color: Colors.textPrimary },
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    ...(glassSurface as any),
    ...Shadows.soft,
  },
  otpInputFilled: { borderColor: Colors.primary },
  buttonContainer: { gap: 12, marginTop: 8 },
  primaryButton: {
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
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" as const },
  resendButton: { paddingVertical: 16, alignItems: "center" },
  resendDisabled: { opacity: 0.5 },
  resendButtonText: { color: Colors.primary, fontSize: 16, fontWeight: "600" as const },
  resendButtonTextDisabled: { color: Colors.textSecondary },
  skipButton: { paddingVertical: 12, alignItems: "center" },
  skipButtonText: { color: Colors.textSecondary, fontSize: 15, fontWeight: "500" as const },
});

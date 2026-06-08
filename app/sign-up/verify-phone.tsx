import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Smartphone } from "lucide-react-native";
import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { useAppDispatch } from "@/store";
import { setIsAuthenticated, setTokens, setUser } from "@/store/authSlice";
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
      <View style={styles.wrapper}>
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

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+2348012345678"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textSecondary}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, sendingOtp && styles.disabledButton]}
                  onPress={() => {
                    if (!phone || phone.length < 10) {
                      toast.error("Please enter a valid phone number");
                      return;
                    }
                    sendOtp(phone);
                  }}
                  disabled={sendingOtp}
                  activeOpacity={0.8}
                >
                  {sendingOtp ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Phase 2: OTP entry ────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
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
              <TouchableOpacity
                style={[styles.primaryButton, verifying && styles.disabledButton]}
                onPress={handleVerify}
                disabled={verifying}
                activeOpacity={0.8}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              {/* AC4: resend with 60-second cooldown */}
              <TouchableOpacity
                style={[styles.resendButton, (cooldownActive || sendingOtp) && styles.resendDisabled]}
                onPress={handleResend}
                disabled={cooldownActive || sendingOtp}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    (cooldownActive || sendingOtp) && styles.resendButtonTextDisabled,
                  ]}
                >
                  {cooldownActive
                    ? `Resend in ${formattedTime}`
                    : sendingOtp
                    ? "Sending…"
                    : "Resend Code"}
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
  wrapper: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backButton: { width: 40, height: 40, justifyContent: "center", marginBottom: 4 },
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
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    backgroundColor: "#F9FAFB",
  },
  otpInputFilled: { borderColor: Colors.primary, backgroundColor: "#EFF6FF" },
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
});

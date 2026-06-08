import { ArrowLeft, Shield, Lock, AlertCircle, CheckCircle2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { PROVIDER_QUERY } from "@/lib/queries";
import { CREATE_BOOKING_MUTATION, VERIFY_PAYMENT_MUTATION } from "@/lib/mutations";

// The Paystack callback URL matches the app scheme so openAuthSessionAsync
// can detect the redirect and close the browser automatically.
const PAYSTACK_CALLBACK = "kraftkonect-app://payment-callback";

type PaymentStep = "idle" | "creating" | "checkout" | "verifying" | "success" | "failed";

export default function PaymentScreen() {
  const router = useRouter();
  const { providerId, serviceId, date, time } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
  }>();

  const [step, setStep] = useState<PaymentStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(PROVIDER_QUERY, {
    variables: { providerId: `${providerId}` },
    skip: !providerId,
    notifyOnNetworkStatusChange: true,
  });

  const [createBooking] = useMutation(CREATE_BOOKING_MUTATION);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT_MUTATION);

  const provider = data?.provider;
  const service = (provider?.services || []).find((s: any) => s.id === serviceId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider || !service || !date || !time) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>
            {error ? "Failed to load payment details" : "Booking information not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const basePrice = service.priceCents ? service.priceCents / 100 : 0;
  const serviceFee = basePrice * 0.1;
  const totalAmount = basePrice + serviceFee;
  const currencySymbol = service.currency?.toUpperCase() === "NGN" ? "₦" : "$";

  const handlePay = async () => {
    if (step !== "idle" && step !== "failed") return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMessage(null);

    // ── Step 1: Create booking ────────────────────────────────────────────────
    setStep("creating");

    let bookingId: string;
    let reference: string;
    let authorizationUrl: string;

    try {
      const bookingDate = new Date(`${date}T${time}`).toISOString();
      const { data: bookingData, errors } = await createBooking({
        variables: {
          input: {
            listingId: serviceId,
            bookingDate,
            description: `Booking for ${service.title}`,
          },
        },
      });

      if (errors?.length || !bookingData?.createBooking) {
        throw new Error(errors?.[0]?.message || "Could not create booking");
      }

      const booking = bookingData.createBooking;
      bookingId = booking.id;
      reference = booking.paystackReference;
      authorizationUrl = booking.paystackAuthorizationUrl;

      if (!authorizationUrl || !reference) {
        throw new Error("Payment could not be initialized. Please try again.");
      }
    } catch (err: any) {
      setStep("failed");
      setErrorMessage(err.message || "Failed to create booking. Please try again.");
      return;
    }

    // ── Step 2: Open Paystack checkout ────────────────────────────────────────
    setStep("checkout");

    try {
      const browserResult = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        PAYSTACK_CALLBACK,
        { showInRecents: false },
      );

      // User dismissed the browser without completing payment
      if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
        setStep("failed");
        setErrorMessage("Payment was not completed. You can retry when ready.");
        return;
      }
    } catch {
      // Browser error — proceed to verify anyway in case payment went through
    }

    // ── Step 3: Verify with backend ───────────────────────────────────────────
    setStep("verifying");

    try {
      const { data: verifyData, errors: verifyErrors } = await verifyPayment({
        variables: { reference },
      });

      if (verifyErrors?.length) {
        throw new Error(verifyErrors[0].message);
      }

      const confirmedBooking = verifyData?.verifyPayment;

      if (confirmedBooking?.status === "confirmed") {
        setStep("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to confirmation screen with the real booking ID
        setTimeout(() => {
          router.replace(
            `/(app)/booking/${providerId}/confirmation?serviceId=${serviceId}&date=${date}&time=${time}&bookingId=${bookingId}` as any,
          );
        }, 800);
      } else {
        setStep("failed");
        setErrorMessage(
          "Payment could not be confirmed. If your bank was charged, please contact support.",
        );
      }
    } catch (err: any) {
      setStep("failed");
      setErrorMessage(
        err.message || "Could not verify payment. If you were charged, please contact support.",
      );
    }
  };

  const isProcessing = step === "creating" || step === "checkout" || step === "verifying";
  const stepLabel =
    step === "creating" ? "Creating your booking…"
    : step === "checkout" ? "Waiting for payment…"
    : step === "verifying" ? "Confirming payment…"
    : step === "success" ? "Payment confirmed!"
    : `Pay ${currencySymbol}${totalAmount.toFixed(2)}`;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <ArrowLeft size={24} color={isProcessing ? "#D1D5DB" : "#2C2C2C"} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Escrow banner */}
          <View style={styles.secureBanner}>
            <Shield size={20} color="#10B981" strokeWidth={2} />
            <View style={styles.secureBannerText}>
              <Text style={styles.secureBannerTitle}>Secure Escrow Payment</Text>
              <Text style={styles.secureBannerBody}>
                Your payment is held safely until the job is complete.
              </Text>
            </View>
          </View>

          {/* Payment summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{service.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{date}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service price</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{basePrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform fee (10%)</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{currencySymbol}{totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Paystack badge */}
          <View style={styles.paystackBadge}>
            <Lock size={14} color="#10B981" strokeWidth={2} />
            <Text style={styles.paystackBadgeText}>
              Secured by Paystack · PCI DSS compliant
            </Text>
          </View>

          {/* Error state */}
          {errorMessage && step === "failed" && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#DC2626" strokeWidth={2} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Success state (brief flash before navigation) */}
          {step === "success" && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.successBannerText}>Payment confirmed! Redirecting…</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Pay button — fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            isProcessing && styles.payButtonProcessing,
            step === "success" && styles.payButtonSuccess,
          ]}
          activeOpacity={0.85}
          onPress={handlePay}
          disabled={isProcessing || step === "success"}
        >
          {isProcessing ? (
            <View style={styles.payButtonInner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.payButtonText}>{stepLabel}</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>{stepLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  placeholder: { width: 40 },

  scrollContent: { padding: 20, paddingBottom: 140 },

  secureBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  secureBannerText: { flex: 1 },
  secureBannerTitle: { fontSize: 15, fontWeight: "700" as const, color: "#065F46", marginBottom: 2 },
  secureBannerBody: { fontSize: 13, color: "#047857", lineHeight: 18 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { fontSize: 17, fontWeight: "700" as const, color: "#111827", marginBottom: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, fontWeight: "600" as const, color: "#111827", maxWidth: "55%" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: "700" as const, color: "#111827" },
  totalValue: { fontSize: 22, fontWeight: "700" as const, color: Colors.primary },

  paystackBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  paystackBadgeText: { fontSize: 12, color: "#10B981", fontWeight: "500" as const },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 4,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: "#DC2626", lineHeight: 18 },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: 4,
  },
  successBannerText: { fontSize: 13, color: "#065F46", fontWeight: "600" as const },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  payButtonProcessing: { backgroundColor: "#6B7280" },
  payButtonSuccess: { backgroundColor: "#10B981" },
  payButtonInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  payButtonText: { fontSize: 17, fontWeight: "700" as const, color: "#FFFFFF" },

  centeredState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  loadingText: { fontSize: 15, color: "#6B7280" },
  errorText: { fontSize: 15, color: "#EF4444", textAlign: "center" },
  retryButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 15 },
});

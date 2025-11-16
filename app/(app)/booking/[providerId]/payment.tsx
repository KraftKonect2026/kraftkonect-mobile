import { ArrowLeft, CreditCard, Lock, Shield } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";
import { providers } from "@/mocks/providers";

export default function PaymentScreen() {
  const router = useRouter();
  const { providerId, serviceId, date, time } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
  }>();

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const provider = providers.find((p) => p.id === providerId);
  const service = provider?.services.find((s) => s.id === serviceId);

  if (!provider || !service || !date || !time) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Booking information not found</Text>
      </SafeAreaView>
    );
  }

  const serviceFee = service.price * 0.1;
  const totalAmount = service.price + serviceFee;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const bookingId = `BK${Date.now()}`;
      router.push(
        `/(app)/booking/${providerId}/confirmation?serviceId=${serviceId}&date=${date}&time=${time}&bookingId=${bookingId}` as any
      );
    }, 1500);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4));
    } else {
      setExpiryDate(cleaned);
    }
  };

  const isFormValid =
    cardNumber.length >= 15 &&
    expiryDate.length === 5 &&
    cvv.length >= 3 &&
    cardholderName.length > 0;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.secureCard}>
            <Shield size={24} color={Colors.primary} />
            <View style={styles.secureTextContainer}>
              <Text style={styles.secureTitle}>Secure Escrow Payment</Text>
              <Text style={styles.secureDescription}>
                Your payment is held securely until the service is marked completed. This protects both you and the provider.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{service.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={styles.summaryValue}>${service.price.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee</Text>
              <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.paymentHeader}>
              <CreditCard size={24} color="#2C2C2C" />
              <Text style={styles.cardTitle}>Card Details</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9CA3AF"
                value={cardNumber}
                onChangeText={formatCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#9CA3AF"
                  value={expiryDate}
                  onChangeText={formatExpiryDate}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Smith"
                placeholderTextColor="#9CA3AF"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.securePaymentRow}>
              <Lock size={16} color="#10B981" />
              <Text style={styles.securePaymentText}>Secure payment powered by Stripe</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (!isFormValid || isProcessing) && styles.payButtonDisabled]}
          activeOpacity={0.8}
          onPress={handlePayment}
          disabled={!isFormValid || isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
  },
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  secureCard: {
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#10B981" + "30",
  },
  secureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  secureTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  secureDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C2C2C",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  securePaymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  securePaymentText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600" as const,
  },
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
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  payButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 18,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

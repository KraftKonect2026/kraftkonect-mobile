import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiry: string;
}

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "visa",
      last4: "4242",
      expiry: "12/25",
    },
    {
      id: "2",
      type: "mastercard",
      last4: "8888",
      expiry: "06/26",
    },
  ]);

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const getCardIcon = (type: string) => {
    return "💳";
  };

  const getCardName = (type: string) => {
    switch (type) {
      case "visa":
        return "Visa";
      case "mastercard":
        return "Mastercard";
      case "amex":
        return "American Express";
      default:
        return "Card";
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptyText}>
              Add a payment method to book services faster
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>{getCardIcon(method.type)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{getCardName(method.type)}</Text>
                    <Text style={styles.cardDetails}>
                      •••• {method.last4} • Expires {method.expiry}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePaymentMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  cardsList: {
    gap: 16,
    marginBottom: 24,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    color: "#6B7280",
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
});

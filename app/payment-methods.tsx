import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCard, setNewCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

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

  const confirmDelete = (id: string) => {
    setMethodToDelete(id);
    setDeleteModalVisible(true);
  };

  const removePaymentMethod = () => {
    if (methodToDelete) {
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== methodToDelete));
      setDeleteModalVisible(false);
      setMethodToDelete(null);
    }
  };

  const handleAddCard = () => {
    if (newCard.number && newCard.expiry && newCard.cvv && newCard.name) {
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: newCard.number.startsWith("4") ? "visa" : "mastercard",
        last4: newCard.number.slice(-4),
        expiry: newCard.expiry,
      };
      setPaymentMethods((prev) => [...prev, newMethod]);
      setAddModalVisible(false);
      setNewCard({ number: "", expiry: "", cvv: "", name: "" });
    }
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
                  onPress={() => confirmDelete(method.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => setAddModalVisible(true)}
        >
          <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Payment Method?</Text>
            <Text style={styles.modalDescription}>
              This payment method will be permanently removed from your account.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setMethodToDelete(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={removePaymentMethod}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addCardModal}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Cardholder Name"
              placeholderTextColor="#9CA3AF"
              value={newCard.name}
              onChangeText={(text) => setNewCard({ ...newCard, name: text })}
            />
            <TextInput
              style={styles.cardInput}
              placeholder="Card Number"
              placeholderTextColor="#9CA3AF"
              value={newCard.number}
              onChangeText={(text) => setNewCard({ ...newCard, number: text })}
              keyboardType="numeric"
              maxLength={16}
            />
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.cardInput, styles.cardInputHalf]}
                placeholder="MM/YY"
                placeholderTextColor="#9CA3AF"
                value={newCard.expiry}
                onChangeText={(text) => setNewCard({ ...newCard, expiry: text })}
                maxLength={5}
              />
              <TextInput
                style={[styles.cardInput, styles.cardInputHalf]}
                placeholder="CVV"
                placeholderTextColor="#9CA3AF"
                value={newCard.cvv}
                onChangeText={(text) => setNewCard({ ...newCard, cvv: text })}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewCard({ number: "", expiry: "", cvv: "", name: "" });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) &&
                    styles.modalAddButtonDisabled,
                ]}
                onPress={handleAddCard}
                activeOpacity={0.7}
                disabled={!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name}
              >
                <Text style={styles.modalAddButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  addCardModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  cardInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardInputHalf: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  modalAddButtonDisabled: {
    backgroundColor: "#93C5FD",
    opacity: 0.6,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

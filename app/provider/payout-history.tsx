import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Banknote, X } from "lucide-react-native";
import { useQuery, useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { Button } from "@/components/Button";
import { useToast } from "@/lib/toast";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import { MY_PAYOUTS_QUERY, MY_AVAILABLE_BALANCE_QUERY, MY_PAYOUT_METHOD_QUERY } from "@/lib/queries";
import { REQUEST_PAYOUT_MUTATION } from "@/lib/mutations";
import { formatPriceCents, formatCurrency } from "@/utils/currency";

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#D97706", label: "Pending" },
  processing: { bg: "#DBEAFE", fg: "#2563EB", label: "Processing" },
  completed: { bg: "#D1FAE5", fg: "#065F46", label: "Completed" },
  paid: { bg: "#D1FAE5", fg: "#065F46", label: "Paid" },
  failed: { bg: "#FEE2E2", fg: "#DC2626", label: "Failed" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function PayoutHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const { data, loading, error, refetch } = useQuery(MY_PAYOUTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: balanceData, loading: balanceLoading, refetch: refetchBalance } = useQuery(
    MY_AVAILABLE_BALANCE_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: methodData } = useQuery(MY_PAYOUT_METHOD_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const [requestPayout, { loading: requesting }] = useMutation(REQUEST_PAYOUT_MUTATION);

  const payouts: any[] = data?.myPayouts ?? [];
  const availableBalance: number = balanceData?.myAvailableBalance ?? 0;
  const hasBankAccount = !!methodData?.myPayoutMethod?.accountNumber;

  const [modalOpen, setModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");

  const openModal = () => {
    // Pre-fill with full available balance in naira
    setAmountInput(availableBalance > 0 ? String(Math.floor(availableBalance / 100)) : "");
    setModalOpen(true);
  };

  const handleRequest = async () => {
    const amountNaira = parseInt(amountInput.replace(/[^0-9]/g, ""), 10);
    if (!amountNaira || amountNaira < 100) {
      showToast("error", "Minimum payout amount is ₦100");
      return;
    }
    const amountCents = amountNaira * 100;
    try {
      await requestPayout({
        variables: { amountCents },
        refetchQueries: [{ query: MY_PAYOUTS_QUERY }, { query: MY_AVAILABLE_BALANCE_QUERY }],
      });
      setModalOpen(false);
      refetch();
      refetchBalance();
      showToast("success", "Payout requested! We'll process it within 24 hours.");
    } catch (e: any) {
      showToast("error", getApolloErrorMessage(e));
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Available balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {balanceLoading ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={styles.balanceAmount}>{formatPriceCents(availableBalance, "NGN")}</Text>
          )}
          <Text style={styles.balanceNote}>90% of completed booking earnings, minus pending withdrawals</Text>

          {hasBankAccount ? (
            <TouchableOpacity
              style={[styles.requestButton, (availableBalance === 0 || balanceLoading) && styles.requestButtonDisabled]}
              onPress={openModal}
              activeOpacity={0.8}
              disabled={availableBalance === 0 || balanceLoading}
            >
              <Banknote size={16} color={availableBalance === 0 ? "#9CA3AF" : Colors.primary} strokeWidth={2} />
              <Text style={[styles.requestButtonText, availableBalance === 0 && styles.requestButtonTextDisabled]}>
                {availableBalance === 0 ? "No balance to withdraw" : "Request Payout"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push("/provider/payout-methods" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.setupButtonText}>Set up payout method first →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payout list */}
        {loading && payouts.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Couldn&apos;t load your payouts.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : payouts.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.emptyIcon}>
              <Banknote size={40} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No payouts yet</Text>
            <Text style={styles.emptyText}>
              Your payouts will appear here once you start completing jobs.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {payouts.map((payout) => {
              const status =
                STATUS_STYLES[payout.status] ?? {
                  bg: "#F3F4F6",
                  fg: "#6B7280",
                  label: payout.status,
                };
              return (
                <View key={payout.id} style={styles.row}>
                  <View style={styles.rowIcon}>
                    <Banknote size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.rowMiddle}>
                    <Text style={styles.amount}>
                      {formatPriceCents(payout.amountCents, "NGN")}
                    </Text>
                    <Text style={styles.date}>{formatDate(payout.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.fg }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Request payout modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} activeOpacity={0.7}>
                <X size={24} color="#2C2C2C" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Available: <Text style={{ fontWeight: "700" }}>{formatPriceCents(availableBalance, "NGN")}</Text>
            </Text>

            <Text style={styles.fieldLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.input}
              value={amountInput}
              onChangeText={(t) => setAmountInput(t.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 5000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              autoFocus
            />
            {amountInput ? (
              <Text style={styles.amountPreview}>
                = {formatCurrency(parseInt(amountInput || "0", 10), "NGN")}
              </Text>
            ) : null}

            <Text style={styles.modalNote}>
              Payout requests are reviewed by our team and processed within 24 hours on business days. The actual Paystack transfer fires only after admin approval.
            </Text>

            <View style={{ height: 24 }} />
            <Button
              title={requesting ? "Requesting…" : "Submit Request"}
              onPress={handleRequest}
              loading={requesting}
              disabled={!amountInput || requesting}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: "#2C2C2C" },
  placeholder: { width: 40 },
  content: { padding: 16, flexGrow: 1 },

  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" as const, marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 4 },
  balanceNote: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 16, marginBottom: 16 },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  requestButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  requestButtonText: { fontSize: 15, fontWeight: "600" as const, color: Colors.primary },
  requestButtonTextDisabled: { color: "#9CA3AF" },
  setupButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  setupButtonText: { fontSize: 14, color: "#FFFFFF", fontWeight: "500" as const },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, color: "#2C2C2C" },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" as const, fontSize: 15 },
  list: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowMiddle: { flex: 1 },
  amount: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 2 },
  date: { fontSize: 13, color: "#9CA3AF" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600" as const },

  modalWrapper: { flex: 1 },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, color: "#2C2C2C" },
  modalSub: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  fieldLabel: { fontSize: 14, fontWeight: "600" as const, color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  amountPreview: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  modalNote: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
    marginTop: 16,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
  },
});

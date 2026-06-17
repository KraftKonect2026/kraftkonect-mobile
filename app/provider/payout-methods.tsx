import React, { useEffect, useMemo, useState } from "react";
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
import {
  ChevronDown,
  CheckCircle2,
  Search,
  X,
  CreditCard,
} from "lucide-react-native";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import Colors from "@/constants/colors";
import { Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { GradientHeader } from "@/components/GradientHeader";
import { Button } from "@/components/Button";
import { useToast } from "@/lib/toast";
import { getApolloErrorMessage } from "@/utils/getApolloErrorMessage";
import {
  MY_PAYOUT_METHOD_QUERY,
  BANKS_QUERY,
  RESOLVE_BANK_ACCOUNT_QUERY,
} from "@/lib/queries";
import { SAVE_PAYOUT_METHOD_MUTATION } from "@/lib/mutations";

type Bank = { name: string; code: string };

export default function PayoutMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: methodData, loading: methodLoading } = useQuery(
    MY_PAYOUT_METHOD_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const saved = methodData?.myPayoutMethod;

  const [loadBanks, { data: banksData, loading: banksLoading }] =
    useLazyQuery(BANKS_QUERY);
  const [resolveAccount, { loading: resolving }] = useLazyQuery(
    RESOLVE_BANK_ACCOUNT_QUERY,
    { fetchPolicy: "no-cache" },
  );
  const [savePayoutMethod, { loading: saving }] = useMutation(
    SAVE_PAYOUT_METHOD_MUTATION,
  );

  const [bank, setBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const banks: Bank[] = banksData?.banks ?? [];
  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
  }, [banks, search]);

  // Verify the account once a bank is chosen and a 10-digit NUBAN is entered.
  useEffect(() => {
    setAccountName(null);
    setResolveError(null);
    if (!bank || accountNumber.length !== 10) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await resolveAccount({
          variables: { accountNumber, bankCode: bank.code },
        });
        if (cancelled) return;
        if (data?.resolveBankAccount?.accountName) {
          setAccountName(data.resolveBankAccount.accountName);
        } else {
          setResolveError("Couldn't verify this account. Check the number and bank.");
        }
      } catch (e: any) {
        if (!cancelled) setResolveError(getApolloErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bank, accountNumber, resolveAccount]);

  const openPicker = () => {
    setPickerOpen(true);
    if (banks.length === 0) loadBanks();
  };

  const handleSave = async () => {
    if (!bank || !accountName) return;
    try {
      await savePayoutMethod({
        variables: {
          input: {
            bankName: bank.name,
            bankCode: bank.code,
            accountNumber,
            accountName,
          },
        },
        refetchQueries: [{ query: MY_PAYOUT_METHOD_QUERY }],
      });
      showToast("success", "Payout method saved 🎉");
      router.back();
    } catch (e: any) {
      showToast("error", getApolloErrorMessage(e));
    }
  };

  const canSave = !!bank && !!accountName && !saving;

  return (
    <ScreenBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <GradientHeader title="Payout Method" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Currently saved method */}
          {methodLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : saved ? (
            <View style={styles.currentCard}>
              <View style={styles.currentIcon}>
                <CreditCard size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.currentName}>{saved.accountName}</Text>
                <Text style={styles.currentDetails}>
                  {saved.bankName} ·{" "}
                  {`••••${saved.accountNumber.slice(-4)}`}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>
            {saved ? "UPDATE BANK ACCOUNT" : "ADD BANK ACCOUNT"}
          </Text>

          {/* Bank selector */}
          <Text style={styles.fieldLabel}>Bank</Text>
          <TouchableOpacity style={styles.selector} activeOpacity={0.7} onPress={openPicker}>
            <Text style={[styles.selectorText, !bank && styles.selectorPlaceholder]}>
              {bank ? bank.name : "Select your bank"}
            </Text>
            <ChevronDown size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Account number */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Account Number</Text>
          <TextInput
            style={styles.input as any}
            value={accountNumber}
            onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="0123456789"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={10}
          />

          {/* Resolution feedback */}
          {resolving && (
            <View style={styles.resolveRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.resolveText}>Verifying account…</Text>
            </View>
          )}
          {accountName && !resolving && (
            <View style={styles.resolvedBanner}>
              <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.resolvedName}>{accountName}</Text>
            </View>
          )}
          {resolveError && !resolving && (
            <Text style={styles.errorText}>{resolveError}</Text>
          )}

          <View style={{ height: 24 }} />
          <Button
            title={saving ? "Saving…" : "Save Payout Method"}
            onPress={handleSave}
            loading={saving}
            disabled={!canSave}
          />
          <Text style={styles.helperText}>
            We verify your account with Paystack and use it to send your payouts.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bank picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top + 12 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bank</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} activeOpacity={0.7}>
              <X size={24} color="#2C2C2C" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search banks"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
            />
          </View>

          {banksLoading && banks.length === 0 ? (
            <View style={styles.modalCentered}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredBanks.map((b) => (
                <TouchableOpacity
                  key={`${b.code}-${b.name}`}
                  style={styles.bankRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setBank(b);
                    setPickerOpen(false);
                    setSearch("");
                  }}
                >
                  <Text style={styles.bankName}>{b.name}</Text>
                  {bank?.code === b.code && (
                    <CheckCircle2 size={18} color={Colors.primary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
              {filteredBanks.length === 0 && (
                <Text style={styles.noBanks}>No banks match “{search}”.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20 },

  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 24,
    ...Shadows.soft,
  },
  currentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(219,234,254,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  currentName: { fontSize: 16, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 2 },
  currentDetails: { fontSize: 13, color: "#6B7280" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 14, fontWeight: "600" as const, color: "#374151", marginBottom: 8 },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...glassSurface,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Shadows.soft,
  },
  selectorText: { fontSize: 16, color: "#2C2C2C" },
  selectorPlaceholder: { color: "#9CA3AF" },
  input: {
    ...glassSurface,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C2C2C",
    ...Shadows.soft,
  },
  resolveRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  resolveText: { fontSize: 14, color: "#6B7280" },
  resolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  resolvedName: { fontSize: 15, fontWeight: "600" as const, color: "#065F46" },
  errorText: { fontSize: 13, color: "#DC2626", marginTop: 8, lineHeight: 18 },
  helperText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 12, lineHeight: 18 },

  modalContainer: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, color: "#2C2C2C" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#2C2C2C" },
  modalCentered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bankName: { fontSize: 16, color: "#2C2C2C", flex: 1 },
  noBanks: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingVertical: 32 },
});

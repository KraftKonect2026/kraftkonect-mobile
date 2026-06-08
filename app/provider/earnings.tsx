import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useQuery } from "@apollo/client";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  ArrowDownCircle,
  CheckCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { BOOKINGS_FOR_PROVIDER_QUERY } from "@/lib/queries";

// ── Helpers ────────────────────────────────────────────────────────────────────

function toNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

function isThisMonth(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function centsToCurrency(cents: number): number {
  return cents / 100;
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

  const { data, loading } = useQuery(BOOKINGS_FOR_PROVIDER_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const allBookings: any[] = data?.bookingsForProvider ?? [];
  const completed = allBookings.filter((b) => b.status === "completed");

  // ── Computed totals ─────────────────────────────────────────────────────────
  const totalToday = completed
    .filter((b) => isToday(b.createdAt))
    .reduce((s, b) => s + centsToCurrency(b.totalPriceCents ?? 0), 0);

  const totalThisWeek = completed
    .filter((b) => isThisWeek(b.createdAt))
    .reduce((s, b) => s + centsToCurrency(b.totalPriceCents ?? 0), 0);

  const totalAllTime = completed.reduce(
    (s, b) => s + centsToCurrency(b.totalPriceCents ?? 0),
    0,
  );

  // ── Transactions for the selected period ────────────────────────────────────
  const periodFilter = (b: any): boolean => {
    if (!b.createdAt) return false;
    if (selectedPeriod === "week") return isThisWeek(b.createdAt);
    if (selectedPeriod === "month") return isThisMonth(b.createdAt);
    return true;
  };

  const transactions = completed
    .filter(periodFilter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const handleWithdraw = () => {
    if (totalThisWeek < 5000) {
      Alert.alert("Minimum Withdrawal", "Minimum withdrawal amount is ₦5,000.");
      return;
    }
    Alert.alert(
      "Withdraw Funds",
      `Withdraw ${toNaira(totalThisWeek)} to your bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          onPress: () =>
            Alert.alert(
              "Initiated",
              "Withdrawal initiated. Funds arrive in 2–3 business days.",
            ),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color="#2C2C2C" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <DollarSign size={32} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.balanceLabel}>This Week&apos;s Earnings</Text>
          {loading && completed.length === 0 ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.balanceValue}>{toNaira(totalThisWeek)}</Text>
          )}
          <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.8} onPress={handleWithdraw}>
            <ArrowDownCircle size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{toNaira(totalThisWeek)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{toNaira(totalToday)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* All-time total */}
        <View style={styles.totalEarningsCard}>
          <View style={styles.totalEarningsHeader}>
            <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
            <CheckCircle size={20} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={styles.totalEarningsValue}>{toNaira(totalAllTime)}</Text>
          <Text style={styles.totalEarningsSublabel}>Lifetime earnings · {completed.length} job{completed.length !== 1 ? "s" : ""} completed</Text>
        </View>

        {/* Transaction history */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>

          <View style={styles.periodSelector}>
            {(["week", "month", "all"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodButton, selectedPeriod === p && styles.periodButtonActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodButtonText, selectedPeriod === p && styles.periodButtonTextActive]}>
                  {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && transactions.length === 0 ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={40} color="#D1D5DB" strokeWidth={2} />
              <Text style={styles.emptyText}>No completed jobs in this period</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((booking) => (
                <View key={booking.id} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <TrendingUp size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {booking.listing?.title ?? "Service"}{booking.customer?.name ? ` — ${booking.customer.name}` : ""}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(booking.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    +{toNaira(centsToCurrency(booking.totalPriceCents ?? 0))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Information</Text>
          <Text style={styles.infoText}>
            {"• Earnings are held in escrow until job completion\n"}
            {"• Minimum withdrawal amount is ₦5,000\n"}
            {"• Automatic payouts every Monday\n"}
            {"• Manual withdrawals take 2–3 business days"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: "#2C2C2C" },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  balanceCard: { padding: 24, backgroundColor: Colors.primary, borderRadius: 20, marginBottom: 24 },
  balanceHeader: { alignSelf: "flex-start", width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  balanceValue: { fontSize: 40, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 20 },
  withdrawButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, backgroundColor: "#FFFFFF", borderRadius: 12, gap: 8 },
  withdrawButtonText: { fontSize: 16, fontWeight: "600" as const, color: Colors.primary },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 20, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6" },
  statIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: "700" as const, color: "#2C2C2C", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#6B7280" },
  totalEarningsCard: { padding: 24, backgroundColor: "#ECFDF5", borderRadius: 16, borderWidth: 1, borderColor: "#A7F3D0", marginBottom: 24 },
  totalEarningsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  totalEarningsLabel: { fontSize: 14, color: "#065F46", fontWeight: "600" as const },
  totalEarningsValue: { fontSize: 32, fontWeight: "700" as const, color: "#065F46", marginBottom: 4 },
  totalEarningsSublabel: { fontSize: 13, color: "#059669" },
  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: "#2C2C2C" },
  periodSelector: { flexDirection: "row", padding: 4, backgroundColor: "#F3F4F6", borderRadius: 12, marginBottom: 16 },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  periodButtonActive: { backgroundColor: "#FFFFFF" },
  periodButtonText: { fontSize: 13, fontWeight: "500" as const, color: "#6B7280" },
  periodButtonTextActive: { fontWeight: "600" as const, color: "#2C2C2C" },
  transactionsList: { gap: 12 },
  transactionCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#F3F4F6" },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 15, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 4 },
  transactionDate: { fontSize: 13, color: "#6B7280" },
  transactionAmount: { fontSize: 16, fontWeight: "700" as const, color: "#10B981" },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 14, color: "#6B7280" },
  infoCard: { padding: 20, backgroundColor: "#EFF6FF", borderRadius: 16 },
  infoTitle: { fontSize: 16, fontWeight: "600" as const, color: "#2C2C2C", marginBottom: 12 },
  infoText: { fontSize: 14, color: "#6B7280", lineHeight: 24 },
});

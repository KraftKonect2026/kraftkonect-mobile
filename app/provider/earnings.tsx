import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
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
import { useProvider } from "@/contexts/ProviderContext";

const transactions = [
  {
    id: "1",
    type: "earning",
    description: "Home Cleaning - Sarah Johnson",
    amount: 85,
    date: "2025-01-15",
    status: "completed",
  },
  {
    id: "2",
    type: "earning",
    description: "Electrical Repair - Michael Chen",
    amount: 120,
    date: "2025-01-14",
    status: "completed",
  },
  {
    id: "3",
    type: "payout",
    description: "Bank Transfer",
    amount: -450,
    date: "2025-01-10",
    status: "completed",
  },
  {
    id: "4",
    type: "earning",
    description: "Kitchen Plumbing - Emma Wilson",
    amount: 95,
    date: "2025-01-13",
    status: "completed",
  },
];

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { earnings } = useProvider();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

  const handleWithdraw = () => {
    if (earnings.nextPayout < 50) {
      Alert.alert("Minimum Withdrawal", "Minimum withdrawal amount is $50.");
      return;
    }

    Alert.alert(
      "Withdraw Funds",
      `Withdraw $${earnings.nextPayout} to your bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          onPress: () => {
            Alert.alert("Success", "Withdrawal initiated. Funds will arrive in 2-3 business days.");
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <DollarSign size={32} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>${earnings.nextPayout}</Text>
          <View style={styles.nextPayoutInfo}>
            <Calendar size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.nextPayoutText}>
              Next payout: {new Date(earnings.nextPayoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.withdrawButton}
            activeOpacity={0.8}
            onPress={handleWithdraw}
          >
            <ArrowDownCircle size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>${earnings.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>${earnings.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <View style={styles.totalEarningsCard}>
          <View style={styles.totalEarningsHeader}>
            <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
            <CheckCircle size={20} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={styles.totalEarningsValue}>${earnings.total.toLocaleString()}</Text>
          <Text style={styles.totalEarningsSublabel}>Lifetime earnings</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "week" && styles.periodButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedPeriod("week")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "week" && styles.periodButtonTextActive,
                ]}
              >
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "month" && styles.periodButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedPeriod("month")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "month" && styles.periodButtonTextActive,
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "all" && styles.periodButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedPeriod("all")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "all" && styles.periodButtonTextActive,
                ]}
              >
                All Time
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.type === "payout" && styles.transactionIconPayout,
                  ]}
                >
                  {transaction.type === "earning" ? (
                    <TrendingUp size={20} color={Colors.primary} strokeWidth={2} />
                  ) : (
                    <ArrowDownCircle size={20} color="#6B7280" strokeWidth={2} />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.amount < 0 && styles.transactionAmountNegative,
                  ]}
                >
                  {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Information</Text>
          <Text style={styles.infoText}>
            • Earnings are held in escrow until job completion{"\n"}
            • Minimum withdrawal amount is $50{"\n"}
            • Automatic payouts every Monday{"\n"}
            • Manual withdrawals take 2-3 business days
          </Text>
        </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  balanceCard: {
    padding: 24,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginBottom: 24,
  },
  balanceHeader: {
    alignSelf: "flex-start",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  nextPayoutInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  nextPayoutText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  totalEarningsCard: {
    padding: 24,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 24,
  },
  totalEarningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: "#065F46",
    fontWeight: "600" as const,
  },
  totalEarningsValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#065F46",
    marginBottom: 4,
  },
  totalEarningsSublabel: {
    fontSize: 13,
    color: "#059669",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  periodSelector: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  periodButtonTextActive: {
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionIconPayout: {
    backgroundColor: "#F3F4F6",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#10B981",
  },
  transactionAmountNegative: {
    color: "#6B7280",
  },
  infoCard: {
    padding: 20,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 24,
  },
});

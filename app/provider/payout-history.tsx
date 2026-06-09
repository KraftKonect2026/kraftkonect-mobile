import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Banknote } from "lucide-react-native";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { MY_PAYOUTS_QUERY } from "@/lib/queries";
import { formatPriceCents } from "@/utils/currency";

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

  const { data, loading, error, refetch } = useQuery(MY_PAYOUTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const payouts: any[] = data?.myPayouts ?? [];

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
});

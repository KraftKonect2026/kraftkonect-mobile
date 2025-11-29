import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  DollarSign,
  Calendar,
  MessageCircle,
  Plus,
  ArrowUpRight,
  Clock,
  MapPin,
  User as UserIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useProvider } from "@/contexts/ProviderContext";

export default function TodayDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobs, earnings } = useProvider();

  const todayJobs = jobs.filter(
    (job) => job.date === new Date().toISOString().split("T")[0] || job.date === "2025-01-15"
  );
  const upcomingJobs = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCards}>
          <TouchableOpacity
            style={[styles.summaryCard, styles.summaryCardPrimary]}
            activeOpacity={0.8}
            onPress={() => router.push("/provider/earnings" as any)}
          >
            <View style={styles.summaryCardIcon}>
              <DollarSign size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValue}>${earnings.today}</Text>
            <Text style={styles.summaryCardLabel}>Today&apos;s Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.summaryCard} 
            activeOpacity={0.8}
            onPress={() => router.push("/provider/(tabs)/calendar" as any)}
          >
            <View style={styles.summaryCardIconSecondary}>
              <Calendar size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValueSecondary}>
              {todayJobs.length}
            </Text>
            <Text style={styles.summaryCardLabelSecondary}>Today&apos;s Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.summaryCard} 
            activeOpacity={0.8}
            onPress={() => router.push("/provider/(tabs)/messages" as any)}
          >
            <View style={styles.summaryCardIconSecondary}>
              <MessageCircle size={24} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.summaryCardValueSecondary}>3</Text>
            <Text style={styles.summaryCardLabelSecondary}>New Messages</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          </View>

          {todayJobs.length > 0 ? (
            <View style={styles.jobsList}>
              {todayJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/provider/job/${job.id}` as any)}
                >
                  <View style={styles.jobCardHeader}>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerAvatar}>
                        <UserIcon size={20} color={Colors.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>{job.customerName}</Text>
                        <Text style={styles.jobCategory}>{job.category}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        job.status === "confirmed" && styles.statusBadgeConfirmed,
                        job.status === "pending" && styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          job.status === "confirmed" && styles.statusBadgeTextConfirmed,
                          job.status === "pending" && styles.statusBadgeTextPending,
                        ]}
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobService}>{job.service}</Text>

                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailRow}>
                      <Clock size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.jobDetailText}>{job.time}</Text>
                    </View>
                    <View style={styles.jobDetailRow}>
                      <MapPin size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.jobDetailText}>{job.address}</Text>
                    </View>
                  </View>

                  <View style={styles.jobCardFooter}>
                    <Text style={styles.jobPrice}>${job.price}</Text>
                    <ArrowUpRight size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#D1D5DB" strokeWidth={2} />
              <Text style={styles.emptyStateTitle}>No jobs scheduled today</Text>
              <Text style={styles.emptyStateDescription}>
                Check your calendar for upcoming bookings
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push("/provider/(tabs)/calendar" as any)}
            >
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.upcomingJobsList}>
            {upcomingJobs.slice(0, 3).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.upcomingJobCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/provider/job/${job.id}` as any)}
              >
                <View style={styles.upcomingJobInfo}>
                  <Text style={styles.upcomingJobDate}>
                    {new Date(job.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.upcomingJobService}>{job.service}</Text>
                  <Text style={styles.upcomingJobCustomer}>{job.customerName}</Text>
                </View>
                <View style={styles.upcomingJobActions}>
                  <Text style={styles.upcomingJobPrice}>${job.price}</Text>
                  <ArrowUpRight size={16} color={Colors.primary} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionButtons}>
              <TouchableOpacity 
                style={styles.quickActionButton} 
                activeOpacity={0.8}
                onPress={() => router.push("/provider/add-listing" as any)}
              >
                <Plus size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.quickActionButtonText}>Add Listing</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionButton} 
                activeOpacity={0.8}
                onPress={() => router.push("/provider/(tabs)/calendar" as any)}
              >
                <Calendar size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.quickActionButtonText}>Availability</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  summaryCardPrimary: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.primary,
  },
  summaryCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryCardIconSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500" as const,
  },
  summaryCardValueSecondary: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  summaryCardLabelSecondary: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 2,
  },
  jobCategory: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeConfirmed: {
    backgroundColor: "#DBEAFE",
  },
  statusBadgePending: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statusBadgeTextConfirmed: {
    color: Colors.primary,
  },
  statusBadgeTextPending: {
    color: "#92400E",
  },
  jobService: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 12,
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  jobDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  upcomingJobsList: {
    gap: 12,
  },
  upcomingJobCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  upcomingJobInfo: {
    flex: 1,
  },
  upcomingJobDate: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  upcomingJobService: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    marginBottom: 4,
  },
  upcomingJobCustomer: {
    fontSize: 13,
    color: "#6B7280",
  },
  upcomingJobActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  upcomingJobPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  quickActionsCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  quickActionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    gap: 8,
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});

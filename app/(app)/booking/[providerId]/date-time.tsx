import { ArrowLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { PROVIDER_QUERY } from "@/lib/queries";
import { ActivityIndicator } from "react-native";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getMonthName = (month: number) => {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return months[month];
};

export default function DateTimeScreen() {
  const router = useRouter();
  const { providerId, serviceId } = useLocalSearchParams<{ providerId: string; serviceId: string }>();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(PROVIDER_QUERY, {
    variables: { providerId: `${providerId}` },
    skip: !providerId,
    notifyOnNetworkStatusChange: true,
  });

  const provider = data?.provider;
  const service = (provider?.services || []).find((s: any) => s.id === serviceId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load availability" : "Service or Provider not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      router.push(
        `/(app)/booking/${providerId}/summary?serviceId=${serviceId}&date=${selectedDate.toISOString()}&time=${selectedTime}` as any
      );
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

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
          <Text style={styles.headerTitle}>Select Date & Time</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.title}</Text>
            <View style={styles.serviceMeta}>
              <Clock size={16} color="#9CA3AF" />
              <Text style={styles.serviceMetaText}>{service.durationMinutes} min</Text>
              <Text style={styles.serviceDivider}>•</Text>
              <Text style={styles.serviceMetaText}>
                {service.currency === "NGN" ? "₦" : "$"}
                {service.priceCents ? (service.priceCents / 100).toFixed(0) : "0"}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>

            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  activeOpacity={0.7}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>←</Text>
                </TouchableOpacity>

                <Text style={styles.monthYear}>
                  {getMonthName(currentMonth)} {currentYear}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  activeOpacity={0.7}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>→</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekDays}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Text key={day} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.dayCell} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const disabled = isDateDisabled(day);
                  const selected = isDateSelected(day);

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        styles.dayCellActive,
                        disabled && styles.dayCellDisabled,
                        selected && styles.dayCellSelected,
                      ]}
                      onPress={() => {
                        if (!disabled) {
                          setSelectedDate(new Date(currentYear, currentMonth, day));
                        }
                      }}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          disabled && styles.dayTextDisabled,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        {selectedDate && selectedTime && (
          <View style={styles.summaryContainer}>
            <CalendarIcon size={16} color="#9CA3AF" />
            <Text style={styles.summaryText}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              })} at {selectedTime}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedDate || !selectedTime) && styles.continueButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
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
    paddingBottom: 140,
  },
  serviceInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  serviceName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceMetaText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  serviceDivider: {
    fontSize: 14,
    color: "#D1D5DB",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    marginBottom: 16,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
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
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 20,
    color: "#2C2C2C",
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#9CA3AF",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dayCellActive: {
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 16,
    color: "#2C2C2C",
  },
  dayTextDisabled: {
    color: "#D1D5DB",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  timeSlotTextSelected: {
    color: "#FFFFFF",
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
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2C2C2C",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

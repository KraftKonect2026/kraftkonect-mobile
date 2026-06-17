import { ArrowLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@apollo/client";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { PROVIDER_QUERY } from "@/lib/queries";
import { formatPriceCents } from "@/utils/currency";
import { formatBookingDate } from "@/utils/datetime";
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
  const insets = useSafeAreaInsets();
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
      <ScreenBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (error || !provider || !service) {
    return (
      <ScreenBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? "Failed to load availability" : "Service or Provider not found"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
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

  const blockedDates: string[] = provider?.blockedDates ?? [];

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return true;
    }
    // Provider marked this day unavailable
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return blockedDates.includes(dateStr);
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
    <ScreenBackground>
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

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
                {formatPriceCents(service.priceCents, service.currency)}
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {selectedDate && selectedTime && (
          <View style={styles.summaryContainer}>
            <CalendarIcon size={16} color="#9CA3AF" />
            <Text style={styles.summaryText}>
              {formatBookingDate(selectedDate.toISOString())} at {selectedTime}
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
          {selectedDate && selectedTime ? (
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          ) : (
            <View style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  serviceInfo: {
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 24,
    ...Shadows.soft,
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
    ...glassSurface,
    borderRadius: Radius.md,
    padding: 20,
    ...Shadows.soft,
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
    backgroundColor: "rgba(219,234,254,0.7)",
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
    borderRadius: Radius.sm,
    ...glassSurface,
    borderWidth: 1.5,
    ...Shadows.soft,
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
    backgroundColor: "rgba(255,255,255,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.65)",
    padding: 20,
    ...Shadows.medium,
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
    borderRadius: Radius.pill,
    overflow: "hidden",
    ...Shadows.glow,
  },
  continueButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB",
    ...Shadows.soft,
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

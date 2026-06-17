import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator,  } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@apollo/client";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Gradients, Radius, Shadows, glassSurface } from "@/constants/theme";
import { ScreenBackground } from "@/components/ScreenBackground";
import { LinearGradient } from "expo-linear-gradient";
import { MY_BLOCKED_DATES_QUERY } from "@/lib/queries";
import { SET_BLOCKED_DATES_MUTATION } from "@/lib/mutations";
import { useToast } from "@/lib/toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const { data, loading } = useQuery(MY_BLOCKED_DATES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [setBlockedDates, { loading: saving }] = useMutation(SET_BLOCKED_DATES_MUTATION);

  // Seed the selection from the saved blocked dates once they load.
  useEffect(() => {
    if (data?.myBlockedDates) {
      setSelectedDates(new Set<string>(data.myBlockedDates));
    }
  }, [data?.myBlockedDates]);

  const handleSave = async () => {
    try {
      await setBlockedDates({ variables: { dates: Array.from(selectedDates) } });
      showToast(
        "success",
        `${selectedDates.size} date${selectedDates.size !== 1 ? "s" : ""} marked unavailable.`,
      );
    } catch {
      showToast("error", "Couldn't save availability. Please try again.");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const toggleDate = (dateStr: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = selectedDates.has(dateStr);
      const isToday =
        new Date().toDateString() ===
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isToday && !isSelected && styles.dayCellToday,
          ]}
          activeOpacity={0.7}
          onPress={() => toggleDate(dateStr)}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isToday && !isSelected && styles.dayTextToday,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <ScreenBackground>
      <LinearGradient
        colors={Gradients.brandDiagonal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerBubble1} pointerEvents="none" />
        <View style={styles.headerBubble2} pointerEvents="none" />
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Manage your availability</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={previousMonth}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color="#2C2C2C" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={nextMonth}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color="#2C2C2C" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>{renderCalendar()}</View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Availability Tips</Text>
          <Text style={styles.infoText}>
            • Tap dates to mark them as unavailable{"\n"}
            • Selected dates will be blocked from bookings{"\n"}
            • Keep your calendar updated to avoid conflicts{"\n"}
            • You can sync with your device calendar
          </Text>
        </View>

        <TouchableOpacity
          style={(saving || loading) && { opacity: 0.6 }}
          activeOpacity={0.8}
          disabled={saving || loading}
          onPress={handleSave}
        >
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Availability</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.glow,
  },
  headerBubble1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.10)",
    top: -70,
    right: -40,
  },
  headerBubble2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -50,
    left: -10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  calendarCard: {
    padding: 20,
    ...glassSurface,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C2C2C",
  },
  daysHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: "#2C2C2C",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  infoCard: {
    padding: 20,
    backgroundColor: "rgba(219,234,254,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    borderRadius: Radius.lg,
    ...Shadows.soft,
    marginBottom: 24,
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
  saveButton: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: "center",
    ...Shadows.glow,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

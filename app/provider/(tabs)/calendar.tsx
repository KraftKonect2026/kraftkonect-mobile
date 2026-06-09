import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@apollo/client";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Manage your availability</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
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
          style={[styles.saveButton, (saving || loading) && { opacity: 0.6 }]}
          activeOpacity={0.8}
          disabled={saving || loading}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Availability</Text>
          )}
        </TouchableOpacity>
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
  calendarCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
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
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
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
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});

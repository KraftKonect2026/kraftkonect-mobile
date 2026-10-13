import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import type { AppMode } from "@/lib/appMode";

export function RoleCard({ mode, onPress }: { mode: AppMode; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={mode === "customer" ? "I need a service" : "I provide services"} onPress={onPress} style={({ pressed }) => [styles.role, pressed && { backgroundColor: Colors.primarySoft }]}>
    {mode === "customer" ? <Image source={require("@/assets/onboarding/1b3b6.svg")} style={{ width: 42, height: 42 }} contentFit="contain" /> :
      <View style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Image source={require("@/assets/onboarding/b50cf.svg")} style={{ width: 30, height: 30.0001 }} contentFit="contain" />
      </View>}
    <View style={{ flex: 1, gap: Space.xs }}><AppText variant="titleSmall">{mode === "customer" ? "I need a service" : "I provide services"}</AppText>
      <AppText variant="bodySmall" color={Colors.textSecondary}>{mode === "customer" ? "Find and book verified local providers." : "Get discovered, booked and paid for your work."}</AppText></View>
    <Image source={require("@/assets/onboarding/405d3.svg")} style={{ width: 22, height: 22 }} />
  </Pressable>;
}
export function RecoveryChoice({ title, description, selected, onPress }: { title: string; description: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} aria-checked={selected} accessibilityState={{ checked: selected }}
    onPress={onPress} style={[styles.recovery, selected && styles.selected]}>
    <Image source={selected ? require("@/assets/onboarding/1ac41.svg") : require("@/assets/onboarding/c2e9c.svg")} style={{ width: 22, height: 22 }} contentFit="contain" accessible={false} />
    <View style={{ flex: 1, minWidth:0,maxWidth:270, gap: 2 }}><AppText variant="labelSupport">{title}</AppText><AppText variant="captionRelaxed" color={Colors.textSecondary}>{description}</AppText></View>
  </Pressable>;
}
export function DayChips({ days, onChange,disabled=false }: { days: number[]; onChange: (days: number[]) => void;disabled?:boolean }) {
  const ordered = [1,2,3,4,5,6,0];
  const all = days.length === 7;
  return <View style={styles.days}>
    {[-1,...ordered].map(day => { const selected = day === -1 ? all : days.includes(day); return <Pressable key={day} accessibilityRole="checkbox"
      accessibilityLabel={day === -1 ? "All working days" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]}
      disabled={disabled} aria-checked={selected} accessibilityState={{ checked: selected,disabled }} style={[styles.day, selected && styles.daySelected]}
      onPress={() => onChange(day === -1 ? all ? [] : ordered : days.includes(day) ? days.filter(value => value !== day) : ordered.filter(value => value === day || days.includes(value)))}>
      <AppText variant="labelSmall" color={selected ? Colors.textOnPrimary : Colors.textPrimary}>{day === -1 ? "All" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]}</AppText>
    </Pressable>; })}
  </View>;
}
const styles = StyleSheet.create({
  role: { minHeight: 112, borderRadius: Corners.large, borderWidth: 1, borderColor: Colors.borderControl, paddingHorizontal: Space.lg, flexDirection: "row", alignItems: "center", gap: 14 },
  recovery: { minHeight: 76, borderRadius: Corners.card, borderWidth: 1, borderColor: Colors.borderControl, paddingHorizontal:14,paddingVertical:0, flexDirection: "row", alignItems: "center", gap: 12 },
  selected: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  day: { width: 63, height: 44, borderRadius: Corners.full, borderWidth: 1, borderColor: Colors.borderStrong, alignItems: "center", justifyContent: "center" },
  daySelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});

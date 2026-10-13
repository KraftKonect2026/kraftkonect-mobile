import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { ControlSize, Corners, Space } from "@/constants/layout";
import { AppText } from "@/components/AppText";

export type AppMode = "customer" | "provider";

/** KK/RoleSwitch (907:1236). The caller owns mode state and navigation. */
export function RoleSwitch({ mode, onChange, disabled = false }: {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="App mode">
      {(["customer", "provider"] as const).map((option) => (
        <Pressable
          key={option}
          onPress={() => { if (option !== mode) onChange(option); }}
          disabled={disabled}
          hitSlop={{ top: Space.xs, bottom: Space.xs }}
          accessibilityRole="radio"
          accessibilityLabel={option === "customer" ? "Find Service" : "Provide Service"}
          accessibilityState={{ checked: mode === option, disabled }}
          aria-checked={mode === option}
          aria-disabled={disabled}
          style={[styles.segment, mode === option && styles.selected]}
        >
          <AppText variant="labelSmall" color={mode === option ? Colors.textOnPrimary : Colors.textSecondary}>{option === "customer" ? "Find Service" : "Provide Service"}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 244, minHeight: ControlSize.touchTarget, backgroundColor: Colors.background, borderRadius: Corners.control, padding: Space.xs, flexDirection: "row" },
  segment: { flex: 1, minHeight: ControlSize.touchTarget - Space.xs * 2, borderRadius: Corners.control, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: Colors.selected },
});

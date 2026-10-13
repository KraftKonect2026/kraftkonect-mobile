import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Borders, ControlSize, Corners, Space } from "@/constants/layout";
import { AppText } from "@/components/AppText";

/** KK/Chip (879:601). Selected controls use navy, independent of primary actions. */
export function SelectionChip({ label, selected = false, disabled = false, compact = false, onPress, icon, style }: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      aria-disabled={disabled}
      style={[styles.chip, {
        backgroundColor: disabled ? Colors.background : selected ? Colors.selected : Colors.surface,
        borderColor: selected && !disabled ? Colors.selected : Colors.border,
        paddingHorizontal: compact ? Space.sm : Space.lg,
      }, style]}
    >
      <AppText variant={compact ? "bodySmall" : "body"} color={disabled ? Colors.disabled : selected ? Colors.textOnPrimary : Colors.textPrimary}>{label}</AppText>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: ControlSize.touchTarget, borderWidth: Borders.thin, borderRadius: Corners.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Space.xs, paddingVertical: Space.sm },
});

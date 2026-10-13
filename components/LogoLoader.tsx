import React from "react";
import { StyleSheet, View } from "react-native";
import { BrandMark } from "@/components/BrandMark";
import { AppText } from "@/components/AppText";
import { Space } from "@/constants/layout";
import Colors from "@/constants/colors";

/** KK loading artwork. Pending state is controlled by the caller's real operation.
 * Figma's prototype pulse has no exported motion tracks; retain its resting state
 * until transition timing is available rather than inventing an animation.
 */
export function LogoLoader({ label = "Loading", height = 78, tone = "blue", showLabel = true }: {
  label?: string;
  height?: number;
  tone?: "blue" | "white";
  showLabel?: boolean;
}) {
  return (
    <View style={styles.container} accessible accessibilityLabel={label} accessibilityState={{ busy: true }} aria-busy aria-live="polite">
      <BrandMark height={height} tone={tone} decorative />
      {showLabel ? <AppText variant="label" color={tone === "white" ? Colors.textOnPrimary : undefined}>{label}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: "center", justifyContent: "center", gap: Space.lg } });

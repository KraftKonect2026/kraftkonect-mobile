import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients } from "@/constants/theme";

interface ScreenBackgroundProps {
  children: React.ReactNode;
  /** Gradient colour stops. Defaults to the soft app-background wash. */
  colors?: readonly [string, string, ...string[]];
  /** Hide the decorative colour blobs (e.g. on dense form screens). */
  blobs?: boolean;
  style?: ViewStyle;
}

/**
 * Full-screen gradient backdrop with soft decorative colour blobs. Frosted
 * `GlassCard`s rendered on top sample this backdrop to produce the glass look.
 *
 * Replaces the old flat `backgroundColor` containers on every screen.
 */
export function ScreenBackground({
  children,
  colors = Gradients.appBackground,
  blobs = true,
  style,
}: ScreenBackgroundProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, style]}
    >
      {blobs && (
        <>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobMid]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </>
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -120,
    right: -90,
    backgroundColor: "rgba(37,99,235,0.16)", // Blue
  },
  blobMid: {
    width: 260,
    height: 260,
    top: 260,
    left: -110,
    backgroundColor: "rgba(79,70,229,0.14)", // Indigo
  },
  blobBottom: {
    width: 300,
    height: 300,
    bottom: -120,
    right: -80,
    backgroundColor: "rgba(14,165,233,0.12)", // Sky blue
  },
});

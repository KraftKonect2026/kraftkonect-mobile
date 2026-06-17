import React from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Glass, Radius, Shadows } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Inner padding shortcut. */
  padding?: number;
  radius?: number;
  /** Stronger frost + more opaque overlay (use for primary surfaces). */
  strong?: boolean;
  /** Shadow depth. */
  elevation?: "none" | "soft" | "medium" | "strong";
  onPress?: () => void;
  activeOpacity?: number;
}

/**
 * Frosted translucent card. A blurred surface with a soft white overlay and a
 * hairline highlight border, floating on a soft shadow. This is the core
 * building block of the glassmorphism look and replaces the old flat white
 * `borderWidth: 1` cards everywhere.
 */
export function GlassCard({
  children,
  style,
  padding,
  radius = Radius.lg,
  strong = false,
  elevation = "soft",
  onPress,
  activeOpacity = 0.85,
}: GlassCardProps) {
  const shadow = elevation === "none" ? undefined : Shadows[elevation];

  const inner = (
    <View
      style={[
        styles.shadowWrap,
        { borderRadius: radius },
        shadow,
      ]}
    >
      <BlurView
        intensity={strong ? Glass.intensityStrong : Glass.intensity}
        tint={Glass.tint}
        // experimentalBlurMethod enables real blur on Android.
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={[styles.blur, { borderRadius: radius }]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: strong ? Glass.overlayStrong : Glass.overlay },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.border,
            { borderRadius: radius },
          ]}
        />
        <View style={padding != null ? { padding } : undefined}>{children}</View>
      </BlurView>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [style, pressed && { opacity: activeOpacity }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={style}>{inner}</View>;
}

const styles = StyleSheet.create({
  shadowWrap: {
    backgroundColor: "transparent",
  },
  blur: {
    overflow: "hidden",
  },
  border: {
    borderWidth: 1,
    borderColor: Glass.border,
  },
});

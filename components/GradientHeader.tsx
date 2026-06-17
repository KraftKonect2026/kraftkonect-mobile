import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PressableOpacity } from "@/components/PressableOpacity";
import { Gradients, Radius, Shadows } from "@/constants/theme";

interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  /** Show a circular glass back button on the left. */
  showBack?: boolean;
  onBack?: () => void;
  /** Optional content rendered on the right (actions, avatar, etc). */
  right?: React.ReactNode;
  /** Extra content rendered below the title row (e.g. a search bar). */
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

/**
 * Brand gradient header with rounded bottom corners, decorative blobs and a
 * frosted back button. Replaces flat white screen headers across the app.
 */
export function GradientHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  right,
  children,
  colors = Gradients.brandDiagonal,
  style,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }, Shadows.glow, style]}
    >
      <View style={styles.bubble1} pointerEvents="none" />
      <View style={styles.bubble2} pointerEvents="none" />

      <View style={styles.row}>
        {showBack && (
          <PressableOpacity
            style={styles.backBtn}
            onPress={onBack ?? (() => router.back())}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </PressableOpacity>
        )}
        <View style={styles.titleWrap}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: "hidden",
  },
  bubble1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.10)",
    top: -70,
    right: -40,
  },
  bubble2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -50,
    left: -10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    fontWeight: "500",
  },
  right: { marginLeft: "auto" },
});

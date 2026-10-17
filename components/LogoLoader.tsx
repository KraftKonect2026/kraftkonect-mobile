import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { BrandMark } from "@/components/BrandMark";
import { AppText } from "@/components/AppText";
import { Space } from "@/constants/layout";
import Colors from "@/constants/colors";

/** KK loading artwork. Pending state is controlled by the caller's real operation.
 * A gentle pulse plays a few times, then the mark rests in its static state, so a slow
 * request never leaves it animating forever. Skipped when Reduce Motion is on.
 */
const PULSES = 3;
const PULSE_MS = 700;

function usePulse() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let stopped = false;
    let running: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (stopped || reduce) return;
      running = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: PULSE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: PULSE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        { iterations: PULSES },
      );
      running.start();
    }).catch(() => {});
    return () => { stopped = true; running?.stop(); };
  }, [pulse]);
  return {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }],
  };
}

export function LogoLoader({ label = "Loading", height = 78, tone = "blue", showLabel = true }: {
  label?: string;
  height?: number;
  tone?: "blue" | "white";
  showLabel?: boolean;
}) {
  const pulseStyle = usePulse();
  return (
    <View style={styles.container} accessible accessibilityLabel={label} accessibilityState={{ busy: true }} aria-busy aria-live="polite">
      <Animated.View style={pulseStyle}><BrandMark height={height} tone={tone} decorative /></Animated.View>
      {showLabel ? <AppText variant="label" color={tone === "white" ? Colors.textOnPrimary : undefined}>{label}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: "center", justifyContent: "center", gap: Space.lg } });

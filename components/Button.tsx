import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, PressableProps, StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Borders, ControlSize, Corners, Space } from "@/constants/layout";
import { AppText } from "@/components/AppText";
import { BrandMark } from "@/components/BrandMark";

export interface ButtonProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "subtle" | "secondary" | "glass";
  size?: "regular" | "compact";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const buttonColors = {
  primary: { background: Colors.primary, pressed: Colors.primaryDark, text: Colors.textOnPrimary },
  outline: { background: Colors.surface, pressed: Colors.primarySoft, text: Colors.primary },
  subtle: { background: Colors.surfaceMuted, pressed: Colors.primarySoft, text: Colors.textPrimary },
} as const;

/** The logo pulses for as long as the button is busy; it is only mounted while loading. */
function ButtonSpinner({ tone }: { tone: "blue" | "white" }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={{ opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) }] }}>
    <BrandMark height={20} tone={tone} decorative />
  </Animated.View>;
}

/** KK/Button (857:178). Legacy secondary/glass variants map to Subtle. */
export function Button({ title, onPress, variant = "primary", size = "regular", disabled = false, loading = false, style, textStyle, icon, accessibilityLabel, ...props }: ButtonProps) {
  const primary = variant === "primary";
  const outline = variant === "outline";
  const palette = buttonColors[variant === "secondary" || variant === "glass" ? "subtle" : variant];
  const color = disabled ? Colors.disabled : palette.text;
  return (
    <Pressable
      {...props}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ ...props.accessibilityState, disabled: disabled || loading, busy: loading }}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      style={({ pressed }) => [
        styles.button,
        { minHeight: size === "compact" ? ControlSize.compactButton : ControlSize.button,
          backgroundColor: disabled ? Colors.surfaceMuted : pressed ? palette.pressed : palette.background,
          borderWidth: outline ? Borders.thin : 0,
          borderColor: disabled ? Colors.borderStrong : Colors.primary,
          opacity: loading ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }] },
        style,
      ]}
    >
      {loading ? <ButtonSpinner tone={primary ? "white" : "blue"} /> : icon}
      <AppText variant={size === "compact" ? "label" : "button"} color={color} style={textStyle}>{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({ button: { borderRadius: Corners.control, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: Space.lg, paddingVertical: Space.sm, gap: Space.sm } });

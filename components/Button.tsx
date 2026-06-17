import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { Gradients, Glass, Radius, Shadows } from "@/constants/theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "glass";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGlass = variant === "glass";

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : Colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              isPrimary && styles.primaryText,
              isSecondary && styles.secondaryText,
              isOutline && styles.outlineText,
              isGlass && styles.glassText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  // Primary buttons use a brand gradient fill with a coloured glow.
  if (isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.shell,
          Shadows.glow,
          (disabled || loading) && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isGlass && styles.glass,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shell: {
    height: 54,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  gradientFill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  button: {
    height: 54,
    borderRadius: Radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    ...Shadows.soft,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  glass: {
    backgroundColor: Glass.overlay,
    borderWidth: 1,
    borderColor: Glass.border,
    ...Shadows.soft,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    ...Platform.select({ default: {} }),
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.primary,
  },
  glassText: {
    color: Colors.primary,
  },
});

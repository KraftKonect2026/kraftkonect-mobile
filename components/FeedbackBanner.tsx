import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import { AppText } from "@/components/AppText";

export type FeedbackTone = "success" | "error" | "info" | "warning";
export const FeedbackBackground = { success: Colors.successSoft, error: Colors.errorSoft, info: Colors.primarySoft, warning: Colors.warningSoft } as const;

/** KK/Toast (1582:9128): nonblocking text-only feedback, with wrapping copy. */
export function FeedbackBanner({ message, tone = "info", onDismiss, onFocus, onBlur, onHoverIn, onHoverOut, style }: {
  message: string;
  tone?: FeedbackTone;
  onDismiss?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const content = <AppText variant="label">{message}</AppText>;
  const bannerStyle = [styles.banner, { backgroundColor: FeedbackBackground[tone] }, style];
  return onDismiss ? (
    <Pressable onPress={onDismiss} onFocus={onFocus} onBlur={onBlur} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={bannerStyle} accessibilityRole="button" accessibilityLabel={message} accessibilityHint="Tap to dismiss" aria-live={tone === "error" ? "assertive" : "polite"}>
      {content}
    </Pressable>
  ) : (
    <View style={bannerStyle}>{content}</View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: Corners.control, paddingHorizontal: Space.lg, paddingVertical: Space.md },
});

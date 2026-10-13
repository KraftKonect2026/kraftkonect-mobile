import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import { AppText } from "@/components/AppText";
import { FeedbackBackground, FeedbackTone } from "@/components/FeedbackBanner";
import type { TypographyVariant } from "@/constants/typography";

type CalloutTone = FeedbackTone | "neutral";
const titleColor = { neutral: Colors.textPrimary, info: Colors.primary, success: Colors.success, warning: Colors.warning, error: Colors.error } as const;

/** KK/Callout (908:1054). Persistent information stays in the screen content. */
export function Callout({ title, message, tone = "neutral", style, titleVariant = "labelLarge", messageVariant="bodySmall" }: {
  title?: string;
  message: string;
  tone?: CalloutTone;
  style?: StyleProp<ViewStyle>;
  titleVariant?: TypographyVariant;
  messageVariant?: TypographyVariant;
}) {
  return (
    <View style={[styles.card, { backgroundColor: tone === "neutral" ? Colors.background : FeedbackBackground[tone] }, style]}>
      {title ? <AppText variant={titleVariant} color={titleColor[tone]}>{title}</AppText> : null}
      <AppText variant={messageVariant} color={Colors.textSecondary}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ card: { borderRadius: Corners.large, padding: Space.lg, gap: Space.sm } });

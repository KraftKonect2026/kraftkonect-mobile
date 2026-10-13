import React from "react";
import { Text, TextProps } from "react-native";
import Colors from "@/constants/colors";
import { Typography, TypographyVariant } from "@/constants/typography";

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

export function AppText({ variant = "body", color = Colors.textPrimary, style, ...props }: AppTextProps) {
  return <Text {...props} style={[Typography[variant], { color }, style]} />;
}

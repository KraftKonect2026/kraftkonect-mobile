import { TextStyle } from "react-native";

// Inter is already bundled and loaded through lib/fonts.ts and the root layout.
export const FontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

const type = (fontSize: number, lineHeight: number, fontFamily: string): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing: 0,
});

/** Figma KK typography roles (847:100 and 971:1708). */
export const Typography = {
  h1: type(30, 38, FontFamily.bold),
  h2: type(24, 32, FontFamily.bold),
  h3: type(20, 28, FontFamily.semibold),
  titleSmall: type(17, 24, FontFamily.semibold),
  bodyLarge: type(16, 24, FontFamily.regular),
  bodySupport: type(15, 22, FontFamily.regular),
  body: type(14, 20, FontFamily.regular),
  bodySmall: type(13, 18, FontFamily.regular),
  labelLarge: type(16, 24, FontFamily.semibold),
  labelSupport: type(15, 22, FontFamily.semibold),
  label: type(14, 20, FontFamily.semibold),
  labelSmall: type(13, 18, FontFamily.semibold),
  button: type(16, 22, FontFamily.semibold),
  choice: type(13, 18, FontFamily.medium),
  otp: type(20, 26, FontFamily.semibold),
  caption: type(12, 16, FontFamily.medium),
  captionRegular: type(12, 16, FontFamily.regular),
  captionEmphasis: type(12, 18, FontFamily.semibold),
  captionMedium: type(12, 18, FontFamily.medium),
  captionRelaxed: type(12, 18, FontFamily.regular),
  meta: type(11, 16, FontFamily.medium),
  footnote: type(11, 16, FontFamily.regular),
  badge: type(10, 14, FontFamily.semibold),
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

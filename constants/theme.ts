import { Platform, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

/**
 * KraftKonect glassmorphism design system.
 *
 * The look is built from three layers:
 *   1. A soft, colourful gradient backdrop (see `ScreenBackground`).
 *   2. Decorative blurred colour blobs that bleed through frosted surfaces.
 *   3. Translucent, frosted "glass" cards (see `GlassCard`) with hairline
 *      borders and soft shadows.
 *
 * Everything below is tokenised so all screens stay visually consistent.
 */

// ── Gradients ────────────────────────────────────────────────────────────────
// Tuples are typed as readonly [string, string, ...] for expo-linear-gradient.
export const Gradients = {
  // Primary brand gradient — blue → indigo → violet.
  brand: ["#2563EB", "#4F46E5", "#7C3AED"] as const,
  brandDiagonal: ["#1E40AF", "#4F46E5", "#7C3AED"] as const,
  // App background wash — very light, lets frosted cards pick up colour.
  appBackground: ["#EEF2FF", "#F5F3FF", "#FCF1FB"] as const,
  appBackgroundCool: ["#EFF6FF", "#EEF2FF", "#F5F3FF"] as const,
  // Accent gradients for tiles / highlights.
  sunrise: ["#F59E0B", "#EC4899"] as const,
  ocean: ["#06B6D4", "#2563EB"] as const,
  violet: ["#7C3AED", "#4F46E5"] as const,
  emerald: ["#10B981", "#059669"] as const,
  // Subtle glass overlay sheen used on top of frosted surfaces.
  glassSheen: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.12)"] as const,
};

// ── Glass surfaces ───────────────────────────────────────────────────────────
export const Glass = {
  // BlurView tint + intensity presets.
  tint: "light" as const,
  intensity: 40,
  intensityStrong: 60,
  // Semi-transparent overlay painted over the blur so text stays legible and
  // it still reads as "glass" on Android/web where blur is weaker.
  overlay: "rgba(255,255,255,0.55)",
  overlayStrong: "rgba(255,255,255,0.72)",
  overlayDark: "rgba(17,24,39,0.28)",
  // Hairline borders give the frosted edge.
  border: "rgba(255,255,255,0.65)",
  borderSubtle: "rgba(255,255,255,0.4)",
  borderOnDark: "rgba(255,255,255,0.22)",
};

/**
 * Cheap "glass" surface for dense lists/grids where stacking many real
 * BlurViews would be too expensive. Translucent fill + hairline border + soft
 * shadow — reads as glass against the gradient backdrop without the blur cost.
 */
export const glassSurface: ViewStyle = {
  backgroundColor: "rgba(255,255,255,0.62)",
  borderWidth: 1,
  borderColor: Glass.border,
};

// ── Radii ────────────────────────────────────────────────────────────────────
export const Radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// ── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

// ── Shadows ──────────────────────────────────────────────────────────────────
// Soft, diffuse shadows — the opposite of the old rigid hairline borders.
export const Shadows: Record<string, ViewStyle> = {
  soft: Platform.select({
    ios: {
      shadowColor: "#312E81",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: {},
    default: {},
  })!,
  medium: Platform.select({
    ios: {
      shadowColor: "#312E81",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
    },
    android: {},
    default: {},
  })!,
  strong: Platform.select({
    ios: {
      shadowColor: "#1E1B4B",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
    },
    android: {},
    default: {},
  })!,
  // Coloured glow under primary/gradient surfaces.
  glow: Platform.select({
    ios: {
      shadowColor: Colors.indigo,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  })!,
};

export default { Gradients, Glass, Radius, Spacing, Shadows };

/** Semantic KK colours. Source: Figma Foundations / Semantic colours (847:2). */
const Colors = {
  primary: "#225EE1",
  primaryDark: "#1D4FBF",
  primarySoft: "#F1F5FD",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  surfaceMuted: "#E7E7E7",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textPlaceholder: "#64748B",
  textOnPrimary: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  borderControl: "#A3AEBC",
  disabled: "#94A3B8",
  selected: "#0F172A",
  icon: "#0F172A",
  controlQuiet: "#F0F0F0",
  success: "#15803D",
  successSoft: "#F0FDF4",
  warning: "#B45309",
  warningSoft: "#FFFBEB",
  error: "#DC2626",
  errorText: "#7F1D1D",
  errorSoft: "#FEF2F2",
  overlay: "rgba(15,23,42,0.32)",

  // Compatibility for screens still using the previous decorative theme.
  // New components use the semantic roles above.
  indigo: "#4F46E5",
  violet: "#7C3AED",
  cyan: "#06B6D4",
  pink: "#EC4899",
  amber: "#F59E0B",
} as const;

export default Colors;

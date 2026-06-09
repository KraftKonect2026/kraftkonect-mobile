import { Text, TextInput, StyleSheet } from "react-native";
import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

// Font map passed to useFonts() in the root layout.
export const interFontMap = {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
};

// Each Inter weight is a separate font file, so a fontWeight in a style won't
// pick the right file on its own. Map every weight keyword to its Inter family.
const WEIGHT_TO_FAMILY: Record<string, string> = {
  "100": "Inter_100Thin",
  "200": "Inter_200ExtraLight",
  "300": "Inter_300Light",
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  "800": "Inter_800ExtraBold",
  "900": "Inter_900Black",
  normal: "Inter_400Regular",
  bold: "Inter_700Bold",
};

// Resolve a style into one that uses the correct Inter family and drops the
// now-redundant fontWeight (prevents Android from synthesising fake bold on top
// of an already-bold font file).
function withInter(style: any) {
  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight != null ? String(flat.fontWeight) : "400";
  const family = WEIGHT_TO_FAMILY[weight] ?? "Inter_400Regular";
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: rest.fontFamily ?? family };
}

let patched = false;

// Patch the base Text and TextInput render so every text node in the app uses
// Inter without touching each individual screen's styles. Call once at startup.
export function applyGlobalInterFont(): void {
  if (patched) return;
  patched = true;

  for (const Component of [Text, TextInput] as any[]) {
    const original = Component.render;
    if (typeof original !== "function") continue;
    Component.render = function render(props: any, ref: any) {
      return original.call(this, { ...props, style: withInter(props.style) }, ref);
    };
  }
}

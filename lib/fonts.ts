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

// Default OS font families that React Navigation's theme (`fonts.regular`,
// `.medium`, `.bold`, `.heavy`) bakes into chrome like tab bar labels. These
// aren't an intentional app choice, so treat them as "unset" and let Inter
// take over. `sans-serif-medium` encodes its weight in the family name itself
// (Android's "medium" theme font uses `fontWeight: 'normal'`), so it needs an
// explicit mapping rather than the fontWeight-based lookup below.
const SYSTEM_FONT_FAMILIES = new Set([
  "System",
  "sans-serif",
  "sans-serif-medium",
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
]);

const SYSTEM_FONT_OVERRIDES: Record<string, string> = {
  "sans-serif-medium": "Inter_500Medium",
};

// Resolve a style into one that uses the correct Inter family and drops the
// now-redundant fontWeight (prevents Android from synthesising fake bold on top
// of an already-bold font file).
function withInter(style: any) {
  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight != null ? String(flat.fontWeight) : "400";
  const weightFamily = WEIGHT_TO_FAMILY[weight] ?? "Inter_400Regular";
  const { fontWeight, fontFamily, ...rest } = flat;

  let resolvedFamily = fontFamily;
  if (!fontFamily || SYSTEM_FONT_FAMILIES.has(fontFamily)) {
    resolvedFamily = SYSTEM_FONT_OVERRIDES[fontFamily as string] ?? weightFamily;
  }

  return { ...rest, fontFamily: resolvedFamily };
}

let patched = false;

// React Native's Text/TextInput are plain function components in the current
// React 19 / new-architecture setup (no .render to patch), so instead we patch
// the JSX element factories. Every <Text>/<TextInput> in the app — including
// ones rendered by third-party libraries — compiles down to a call to one of
// these factories, so intercepting them here applies Inter globally without
// touching individual screens.
export function applyGlobalInterFont(): void {
  if (patched) return;
  patched = true;

  const targets = new Set<unknown>([Text, TextInput]);

  const wrap = (fn: any) => {
    if (typeof fn !== "function") return fn;
    return function patchedJsx(type: any, config: any, ...rest: any[]) {
      if (targets.has(type) && config) {
        config = { ...config, style: withInter(config.style) };
      }
      return fn(type, config, ...rest);
    };
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    jsxRuntime.jsx = wrap(jsxRuntime.jsx);
    jsxRuntime.jsxs = wrap(jsxRuntime.jsxs);
  } catch {}

  try {
    const jsxDevRuntime = require("react/jsx-dev-runtime");
    jsxDevRuntime.jsxDEV = wrap(jsxDevRuntime.jsxDEV);
  } catch {}

  try {
    const React = require("react");
    React.createElement = wrap(React.createElement);
  } catch {}
}

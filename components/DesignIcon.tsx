import { Image } from "expo-image";
import { View, StyleSheet } from "react-native";

const assets = {
  home: [require("@/assets/design/2c8fa.svg"), require("@/assets/design/69596.svg"), 20.5474, 20.8, 2.15, 1.96],
  calendar: [require("@/assets/design/81aa2.svg"), require("@/assets/design/95977.svg"), 20.8, 20.8, 1.2, 1.2],
  messages: [require("@/assets/design/e4dcd.svg"), require("@/assets/design/d849d.svg"), 24, 24, 0, 0],
  account: [require("@/assets/design/6f640.svg"), require("@/assets/design/e02aa.svg"), 24, 24, 0, 0],
  search: [require("@/assets/design/a2717.svg"), null, 17.5, 18.5, 3.25, 2.75],
  heart: [require("@/assets/design/9bdc8.svg"), require("@/assets/discovery/6b6b5.svg"), 24, 24, 0, 0],
  check: [require("@/assets/design/3156e.svg"), null, 24, 24, 0, 0],
  pending: [require("@/assets/design/2a0eb.svg"), null, 24, 24, 0, 0],
  bell: [require("@/assets/account/aa40c.svg"), null, 20.5002, 22.4965, 1.7499, 0.75],
} as const;

export type DesignIconName = keyof typeof assets;

// Preserve the exported SVG root geometry inside the approved 24px slot.
export function DesignIcon({ name, active = false }: { name: DesignIconName; active?: boolean }) {
  const [normal, selected, width, height, left, top] = assets[name];
  return <View style={styles.slot} accessible={false} aria-hidden>
    <Image source={active && selected ? selected : normal} style={{ width, height, left, top }} contentFit="contain" />
  </View>;
}

export function LocationIcon() {
  return <View style={styles.location} accessible={false} aria-hidden>
    <Image source={require("@/assets/design/ec804.svg")} style={{ width: 9.92835, height: 12.0006 }} contentFit="contain" />
  </View>;
}

const styles = StyleSheet.create({
  slot: { width: 24, height: 24 },
  location: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
});

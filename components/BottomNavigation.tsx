import { Space } from "@/constants/layout";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { DesignIcon, DesignIconName } from "@/components/DesignIcon";
import Colors from "@/constants/colors";
import { AppMode } from "@/lib/appMode";

export type NavigationItem = { key: string; label: string; icon: DesignIconName };
export const navigationItems = (mode: AppMode): NavigationItem[] => [
  { key: "home", label: "Home", icon: "home" },
  { key: "work", label: mode === "customer" ? "Bookings" : "Jobs", icon: "calendar" },
  { key: "messages", label: "Messages", icon: "messages" },
  { key: "account", label: "Account", icon: "account" },
];

export function BottomNavigation({ items, activeKey, onPress, onLongPress }: {
  items: NavigationItem[];
  activeKey: string;
  onPress: (key: string) => void;
  onLongPress?: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
    <View style={styles.items}>
      {items.map(item => <Pressable
        key={item.key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: item.key === activeKey }}
        aria-selected={item.key === activeKey}
        onPress={() => onPress(item.key)}
        onLongPress={() => onLongPress?.(item.key)}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <DesignIcon name={item.icon} active={item.key === activeKey} />
        <AppText variant="caption" color={item.key === activeKey ? Colors.primary : Colors.textSecondary} style={styles.label}>
          {item.label}
        </AppText>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  items: { height: 62, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Space.page },
  item: { minWidth: 44, width: 72, flexShrink: 1, height: 52, alignItems: "center", justifyContent: "center", gap: Space.xs },
  label: { height: 20, textAlign: "center" },
  pressed: { opacity: 0.65 },
});

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { StyleSheet, ViewStyle } from "react-native";
import { BottomNavigation, NavigationItem } from "@/components/BottomNavigation";
import type { DesignIconName } from "@/components/DesignIcon";

const iconForRoute: Record<string, DesignIconName> = {
  index: "home", today: "home", bookings: "calendar", jobs: "calendar",
  messages: "messages", profile: "account",
};

// Retain the legacy import name for existing layouts; the bar now follows Figma.
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const current = descriptors[state.routes[state.index].key].options;
  if ((StyleSheet.flatten(current.tabBarStyle) as ViewStyle | undefined)?.display === "none") return null;
  const routes = state.routes.filter(route => descriptors[route.key].options.tabBarIcon != null);
  const items: NavigationItem[] = routes.map(route => ({
    key: route.key,
    label: descriptors[route.key].options.title ?? route.name,
    icon: iconForRoute[route.name] ?? "home",
  }));
  return <BottomNavigation
    items={items}
    activeKey={state.routes[state.index].key}
    onPress={key => {
      const route = routes.find(item => item.key === key);
      if (!route) return;
      const event = navigation.emit({ type: "tabPress", target: key, canPreventDefault: true });
      if (key !== state.routes[state.index].key && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    }}
    onLongPress={key => navigation.emit({ type: "tabLongPress", target: key })}
  />;
}

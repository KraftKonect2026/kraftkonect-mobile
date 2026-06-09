import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

// A floating, rounded bottom tab bar with a spring/bounce animation on the
// pressed icon. Only routes that declare a `tabBarIcon` are rendered, so any
// `href: null` routes (search, filter, provider, booking, explore) are skipped.
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scales = useRef<Record<string, Animated.Value>>({}).current;

  // Hide the tab bar if the current route has tabBarStyle: { display: 'none' }
  const activeRouteKey = state.routes[state.index].key;
  const activeRouteOptions = descriptors[activeRouteKey]?.options;
  const tabBarStyle = activeRouteOptions?.tabBarStyle as any;
  if (tabBarStyle) {
    if (tabBarStyle.display === "none") return null;
    if (Array.isArray(tabBarStyle) && tabBarStyle.some((s) => s && s.display === "none")) {
      return null;
    }
  }

  const visibleRoutes = state.routes.filter(
    (r) => descriptors[r.key].options.tabBarIcon != null,
  );

  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index].key === route.key;

          if (!scales[route.key]) scales[route.key] = new Animated.Value(1);
          const scale = scales[route.key];

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.sequence([
              Animated.timing(scale, { toValue: 0.78, duration: 80, useNativeDriver: true }),
              Animated.spring(scale, {
                toValue: 1,
                friction: 4,
                tension: 220,
                useNativeDriver: true,
              }),
            ]).start();

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? "#FFFFFF" : "#9CA3AF";
          const icon = options.tabBarIcon?.({ focused: isFocused, color, size: 22 });

          return (
            <TouchableWithoutFeedback key={route.key} onPress={onPress}>
              <View style={styles.item}>
                <Animated.View
                  style={[
                    styles.iconWrap,
                    isFocused && styles.iconWrapActive,
                    { transform: [{ scale }] },
                  ]}
                >
                  {icon}
                </Animated.View>
                {isFocused && (
                  <Text style={styles.label} numberOfLines={1}>
                    {options.title ?? route.name}
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: "100%",
    maxWidth: 480,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});

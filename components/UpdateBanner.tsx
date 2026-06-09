import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Text, Platform } from "react-native";
import { PressableOpacity as TouchableOpacity } from "@/components/PressableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpCircle } from "lucide-react-native";

import { useOTAUpdate } from "@/lib/hooks/useOTAUpdate";
import Colors from "@/constants/colors";

// Slides up from the bottom when an OTA update is downloading or ready.
// When ready, the user can tap "Restart" to apply it.
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isDownloading, isReady, applyUpdate } = useOTAUpdate();
  const slideY = useRef(new Animated.Value(120)).current;
  const visible = isDownloading || isReady;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 120,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [visible, slideY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingBottom: insets.bottom + 14, transform: [{ translateY: slideY }] },
      ]}
    >
      <View style={styles.row}>
        <ArrowUpCircle size={22} color="#FFFFFF" strokeWidth={2} />
        <View style={styles.text}>
          <Text style={styles.title}>
            {isDownloading ? "Downloading update…" : "Update ready!"}
          </Text>
          {isReady && (
            <Text style={styles.sub}>Restart the app to get the latest features.</Text>
          )}
        </View>
        {isReady && (
          <TouchableOpacity style={styles.btn} onPress={applyUpdate} activeOpacity={0.85}>
            <Text style={styles.btnText}>Restart</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 14,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "700" as const, color: "#FFFFFF" },
  sub: { fontSize: 12, color: "#DBEAFE" },
  btn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnText: { fontSize: 14, fontWeight: "700" as const, color: Colors.primaryDark },
});

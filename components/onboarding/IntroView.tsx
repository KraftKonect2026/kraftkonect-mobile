import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import Colors from "@/constants/colors";
import { Space } from "@/constants/layout";

export function IntroView({ onSignIn, onStart, previewBar }: { onSignIn: () => void; onStart: () => void; previewBar?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const artWidth = Math.min(345, width - Space.page * 2);
  return <View style={styles.screen}>{previewBar}
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: insets.top + Space.page }]} showsVerticalScrollIndicator={false}>
      <Image source={require("@/assets/onboarding/blue-lockup.png")} style={styles.brand} contentFit="contain" accessibilityLabel="KraftKonect" />
      <Image source={require("@/assets/onboarding/intro-illustration.png")} style={{ width: artWidth, height: artWidth * 339.306274 / 345 }} contentFit="contain" accessible={false} aria-hidden />
      <View style={{ gap: Space.none }}>
        <AppText variant="h1" style={styles.center}>{"Find help. Find work.\nAll in one place."}</AppText>
        <AppText variant="bodySupport" color={Colors.textSecondary} style={styles.center}>Find trusted local professionals or offer your services and connect with customers near you.</AppText>
      </View>
    </ScrollView>
    <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, Space.xxxl) }]}>
      <Button title="Sign in" variant="outline" onPress={onSignIn} />
      <Button title="Get started" onPress={onStart} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Space.page, paddingBottom: Space.page, gap: Space.page, alignItems: "center", width: "100%", maxWidth: 528, alignSelf: "center" },
  brand: { width: 184.923874, height: 63 },
  center: { textAlign: "center" },
  actions: { paddingTop: Space.md, paddingHorizontal: Space.page, gap: Space.md, width: "100%", maxWidth: 528, alignSelf: "center" },
});

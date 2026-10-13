import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";

export function TextAction({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} accessibilityState={{ disabled }}
    onPress={onPress} hitSlop={{ top: 12, bottom: 12 }} style={styles.textAction}><AppText variant="label" color={disabled ? Colors.disabled : Colors.primary} style={styles.center}>{title}</AppText></Pressable>;
}
export function OnboardingFrame({ title, description, children, actions, onBack, previewBar }: {
  title: string; description?: string; children?: ReactNode; actions?: ReactNode; onBack: () => void; previewBar?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    {previewBar}
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Space.xxl }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
          <Image source={require("@/assets/onboarding/542d7.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
        </Pressable>
        <View style={styles.mark}><Image source={require("@/assets/onboarding/799c1.svg")} style={{ width: 39, height: 47 }} contentFit="contain" accessibilityLabel="KraftKonect" /></View>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.body}>
        <View style={{ gap: Space.sm }}><AppText variant="h1" accessibilityRole="header">{title}</AppText>
          {description ? <AppText variant="bodySupport" color={Colors.textSecondary}>{description}</AppText> : null}
        </View>
        {children}
      </View>
    </ScrollView>
    {actions ? <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, Space.xxxl) }]}>{actions}</View> : null}
  </KeyboardAvoidingView>;
}
export const onboardingStyles = StyleSheet.create({
  stack: { gap: Space.xl }, tight: { gap: Space.sm }, fields: { gap: Space.xl },
  support: { color: Colors.textSecondary }, centered: { textAlign: "center" },
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Space.page, paddingBottom: Space.page, alignSelf: "center", width: "100%", maxWidth: 528, gap: Space.page },
  topBar: { flexDirection: "row", alignItems: "center", gap: Space.sm, height: 48 },
  back: { height: 44, width: 44, borderRadius: Corners.full, alignItems: "center", justifyContent: "center", backgroundColor: Colors.controlQuiet },
  mark: { flex: 1, alignItems: "center" },
  body: { gap: Space.xl },
  actions: { paddingTop: Space.md, paddingHorizontal: Space.page, gap: Space.md, width: "100%", maxWidth: 528, alignSelf: "center", backgroundColor: Colors.surface },
  textAction: { minHeight: 20, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
});

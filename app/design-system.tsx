import React, { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Borders, Corners, Space } from "@/constants/layout";
import { Typography, TypographyVariant } from "@/constants/typography";
import { AppText } from "@/components/AppText";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { FeedbackBanner, FeedbackTone } from "@/components/FeedbackBanner";
import { Input } from "@/components/Input";
import { LogoLoader } from "@/components/LogoLoader";
import { RoleSwitch, AppMode } from "@/components/RoleSwitch";
import { SelectionChip } from "@/components/SelectionChip";
import { VerificationCode } from "@/components/VerificationCode";
import { useToast } from "@/lib/toast";

const sections = ["Colors", "Typography", "Buttons", "Fields", "Selection", "Feedback", "Brand"] as const;
type Section = typeof sections[number];
const palette = Object.entries(Colors).filter(([name]) => !["indigo", "violet", "cyan", "pink", "amber"].includes(name));
const feedback: Record<FeedbackTone, string> = {
  success: "Saved. Your changes are up to date.",
  error: "Couldn't save. Check your connection and retry.",
  info: "A new verification code has been sent.",
  warning: "Your payment is still being checked.",
};

export default function DesignSystemRoute() {
  return __DEV__ ? <DesignSystemPreview /> : <Redirect href="/" />;
}

function DesignSystemPreview() {
  const router = useRouter();
  const toast = useToast();
  const [section, setSection] = useState<Section>("Buttons");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [mode, setMode] = useState<AppMode>("customer");
  const [selected, setSelected] = useState<string[]>(["Plumbing"]);
  const [presses, setPresses] = useState(0);
  const [pending, setPending] = useState(false);
  const action = () => setPresses((count) => count + 1);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <BrandMark height={40} />
            <View style={styles.heading}>
              <AppText variant="h2" accessibilityRole="header">Shared design system</AppText>
              <AppText variant="bodySmall" color={Colors.textSecondary}>Local component preview</AppText>
            </View>
          </View>
          <View style={styles.tabs}>
            {sections.map((item) => <SelectionChip key={item} label={item} selected={section === item} onPress={() => setSection(item)} compact />)}
          </View>
        </View>

        <View style={styles.panel}>
          <AppText variant="h3" accessibilityRole="header">{section}</AppText>
          {section === "Colors" ? (
            <View style={styles.swatches}>
              {palette.map(([token, color]) => <View key={token} style={styles.swatchItem}>
                <View style={[styles.swatch, { backgroundColor: color }]} />
                <AppText variant="labelSmall">{token}</AppText>
                <AppText variant="captionRegular" color={Colors.textSecondary}>{color}</AppText>
              </View>)}
            </View>
          ) : null}
          {section === "Typography" ? (
            <View style={styles.stack}>
              {(Object.keys(Typography) as TypographyVariant[]).map((variant) => <View key={variant} style={styles.typeRow}>
                <AppText variant="caption" color={Colors.textSecondary}>{variant} · {Typography[variant].fontSize}/{Typography[variant].lineHeight}</AppText>
                <AppText variant={variant}>Find help. Find work.</AppText>
              </View>)}
            </View>
          ) : null}
          {section === "Buttons" ? (
            <View style={styles.stack}>
              <Button title="Primary action" onPress={action} />
              <Button title="Outline action" variant="outline" onPress={action} />
              <Button title="Subtle action" variant="subtle" onPress={action} />
              <View style={styles.row}>
                <Button title="Action" size="compact" onPress={action} style={styles.flex} />
                <Button title="Action" size="compact" variant="outline" onPress={action} style={styles.flex} />
                <Button title="Action" size="compact" variant="subtle" onPress={action} style={styles.flex} />
              </View>
              <Button title="Disabled action" disabled onPress={action} />
              <Button title="Loading example" loading onPress={action} />
              <Button title="Outline loading" variant="outline" loading onPress={action} />
              <AppText variant="caption" color={Colors.textSecondary}>Button presses: {presses}</AppText>
              <Button title="Pending action" loading={pending} onPress={action} />
              <Button title={pending ? "Finish loading demo" : "Start loading demo"} variant="outline" size="compact" onPress={() => setPending((value) => !value)} />
            </View>
          ) : null}
          {section === "Fields" ? (
            <View style={styles.stack}>
              <Input label="Full name" placeholder="Enter your details" value={name} onChangeText={setName} />
              <Input label="Phone number" prefix="+234" placeholder="Enter your number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <Input label="Description" placeholder="Tell us about your work" multiline value={description} onChangeText={setDescription} />
              <Input label="Field error" value="Example" error="Please check this field and try again." touched />
              <Input label="Disabled field" placeholder="Enter your details" editable={false} />
              <AppText variant="label">Six-digit verification</AppText>
              <VerificationCode value={code} onChange={setCode} error={codeError ? "Please check your code and try again." : undefined} />
              <AppText variant="caption" color={Colors.textSecondary}>Digits entered: {code.length}/6</AppText>
              <View style={styles.row}>
                <Button title="Clear code" size="compact" variant="outline" onPress={() => setCode("")} style={styles.flex} />
                <Button title={codeError ? "Clear error" : "Show code error"} size="compact" variant="subtle" onPress={() => setCodeError((value) => !value)} style={styles.flex} />
              </View>
            </View>
          ) : null}
          {section === "Selection" ? (
            <View style={styles.stack}>
              <AppText variant="label">Account mode</AppText>
              <RoleSwitch mode={mode} onChange={setMode} />
              <AppText variant="caption" color={Colors.textSecondary}>Selected mode: {mode}</AppText>
              <View style={styles.tabs}>
                {["Plumbing", "Electrical", "Cleaning"].map((label) => <SelectionChip key={label} label={label} selected={selected.includes(label)} onPress={() => setSelected((previous) => previous.includes(label) ? previous.filter((item) => item !== label) : [...previous, label])} />)}
                <SelectionChip label="Unavailable" disabled onPress={() => {}} />
                <SelectionChip label="Compact" compact selected onPress={() => {}} />
              </View>
            </View>
          ) : null}
          {section === "Feedback" ? (
            <View style={styles.stack}>
              {(Object.keys(feedback) as FeedbackTone[]).map((tone) => <View key={tone} style={styles.stackSmall}>
                <FeedbackBanner tone={tone} message={feedback[tone]} />
                <Button title={"Show " + tone + " banner"} variant="outline" size="compact" onPress={() => toast.showToast(tone, feedback[tone])} />
              </View>)}
              <AppText variant="label">Persistent information cards</AppText>
              {(["neutral", "info", "success", "warning", "error"] as const).map((tone) => <Callout key={tone} tone={tone} title="What happens next" message="Your request is reviewed by the provider." />)}
            </View>
          ) : null}
          {section === "Brand" ? (
            <View style={styles.stack}>
              <View style={styles.logoSlot}><BrandMark /></View>
              <View style={[styles.logoSlot, styles.darkSlot]}><BrandMark tone="white" /></View>
              <View style={styles.logoSlot}><LogoLoader label="Loading example" /></View>
              <AppText variant="bodySmall" color={Colors.textSecondary}>Approved logo artwork, kept in its original proportions. The exact prototype pulse awaits exported transition timing.</AppText>
            </View>
          ) : null}
          <Button title="Back to app" variant="outline" size="compact" onPress={() => router.push("/get-started")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { alignItems: "center", paddingVertical: Space.page, gap: Space.page },
  header: { width: "100%", maxWidth: 1008, paddingHorizontal: Space.page, gap: Space.page },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Space.lg },
  heading: { flex: 1, gap: Space.xs },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
  panel: { width: "100%", maxWidth: 393, backgroundColor: Colors.surface, padding: Space.page, gap: Space.page },
  stack: { gap: Space.lg },
  stackSmall: { gap: Space.sm },
  row: { flexDirection: "row", gap: Space.sm },
  flex: { flex: 1 },
  typeRow: { gap: Space.sm, paddingBottom: Space.lg, borderBottomWidth: Borders.thin, borderColor: Colors.border },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: Space.lg },
  swatchItem: { width: "47%", gap: Space.sm },
  swatch: { height: Space.section, borderWidth: Borders.thin, borderColor: Colors.border, borderRadius: Corners.control },
  logoSlot: { padding: Space.page, alignItems: "center", borderRadius: Corners.large, backgroundColor: Colors.background },
  darkSlot: { backgroundColor: Colors.selected },
});

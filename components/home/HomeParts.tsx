import { Space, Corners } from "@/constants/layout";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import Colors from "@/constants/colors";

export function SectionHeading({ title, count, onPress, provider = false }: { title: string; count?: number; onPress?: () => void; provider?: boolean }) {
  return <View style={styles.heading}>
    <View style={styles.titleRow}>
      <AppText variant="h3">{title}</AppText>
      {count != null && <View style={styles.count}><AppText variant="caption">{count}</AppText></View>}
    </View>
    {onPress && <Pressable accessibilityRole="button" accessibilityLabel={"View all " + title.toLowerCase()} onPress={onPress} style={styles.forward}>
      <Image source={provider ? require("@/assets/design/9ddfe.svg") : require("@/assets/design/ef823.svg")} style={{ width: 36, height: 36 }} contentFit="contain" />
    </Pressable>}
  </View>;
}

export function DataStatus({ loading, error, empty, onRetry }: {
  loading?: boolean; error?: boolean; empty?: string; onRetry?: () => void;
}) {
  if (loading) return <View style={styles.loading}><LogoLoader height={28} label="Loading" /></View>;
  if (error) return <View style={styles.status}>
    <Callout title="Couldn’t load this right now" message="Please try again when the connection is available." tone="warning" />
    {onRetry && <Button title="Try again" variant="outline" size="compact" onPress={onRetry} />}
  </View>;
  return <Callout message={empty ?? "There’s nothing here yet."} />;
}

export const homeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { paddingTop: Space.lg, paddingBottom: Space.xxl, gap: Space.xl },
  inset: { marginHorizontal: Space.page },
  section: { gap: Space.md },
  rail: { paddingHorizontal: Space.page, gap: Space.md },
});
const styles = StyleSheet.create({
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 36 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  count: { minWidth: 24, height: 24, borderRadius: Corners.full, paddingHorizontal: Space.xs, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surfaceMuted },
  forward: { position: "absolute", right: -Space.xs, top: -Space.xs, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  status: { gap: Space.md },
  loading: { minHeight: 112, alignItems: "center", justifyContent: "center" },
});

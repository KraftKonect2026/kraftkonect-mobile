import { Space, Corners } from "@/constants/layout";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { DesignIcon } from "@/components/DesignIcon";
import { DataStatus, homeStyles, SectionHeading } from "@/components/home/HomeParts";
import Colors from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { ProviderCardData } from "@/lib/homeData";

export const serviceCategories = [
  { key: "cleaning", label: "Cleaning", image: require("@/assets/design/03c8c.svg"), width: 42.0019, height: 49.0001 },
  { key: "general", label: "Repairs", image: require("@/assets/design/4ff0b.svg"), width: 56, height: 56 },
  { key: "beauty", label: "Beauty", image: require("@/assets/design/fd138.svg"), width: 56, height: 56 },
  { key: "moving", label: "Moving", image: require("@/assets/design/4354a.svg"), width: 56, height: 56, flip: true },
  { key: "plumbing", label: "Plumbing", image: require("@/assets/design/a88f2.svg"), width: 56, height: 56 },
  { key: "painting", label: "Painting", image: require("@/assets/design/a48de.svg"), width: 56, height: 56 },
  { key: "electrical", label: "Electrical", image: require("@/assets/design/8a124.svg"), width: 56, height: 56 },
  { key: "gardening", label: "Gardening", image: require("@/assets/design/87655.svg"), width: 56, height: 56 },
];

function Rating({ value, compact = false }: { value?: number | null; compact?: boolean }) {
  if (value == null) return null;
  return <View style={styles.rating}>
    <Image source={require("@/assets/design/734e4.svg")} style={{ width: 12, height: 12 }} />
    <AppText variant={compact ? "caption" : "captionMedium"}>{Number(value).toFixed(1)}</AppText>
  </View>;
}

function ProviderCard({ provider, compact, saved, saving, onOpen, onSave }: {
  provider: ProviderCardData; compact?: boolean; saved?: boolean; saving?: boolean;
  onOpen: () => void; onSave: () => void;
}) {
  return <View style={[styles.provider, { width: compact ? 152 : 248, gap: compact ? 6 : Space.sm }]}>
    <View style={[styles.photo, { height: compact ? 112 : 164 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={"View " + provider.name} onPress={onOpen} style={StyleSheet.absoluteFill}>
        {provider.image && <Image source={provider.image}
          style={{ position: "absolute", width: compact ? 158 : 256, height: compact ? 118 : 192, left: compact ? -3 : -4, top: compact ? -2 : -14 }} contentFit="cover" />}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={(saved ? "Unsave " : "Save ") + provider.name}
        accessibilityState={{ selected: !!saved, disabled: !!saving, busy: !!saving }} disabled={saving}
        onPress={onSave} style={styles.save}>
        <View style={styles.saveSurface}><DesignIcon name="heart" active={saved} /></View>
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={provider.name + ", " + provider.service} onPress={onOpen} style={[styles.providerCopy, !compact && { gap: Space.sm }]}>
      <View style={styles.providerLine}>
        <AppText variant="label" numberOfLines={1} style={styles.flex}>{provider.name}</AppText>
        {!compact && <Rating value={provider.rating} />}
      </View>
      <AppText variant={compact ? "captionMedium" : "body"} color={compact ? Colors.textSecondary : Colors.textPrimary} numberOfLines={1}>{provider.service}</AppText>
      {compact ? <Rating value={provider.rating} compact /> : provider.startingPrice && <AppText variant="label" color={Colors.textSecondary}>From {provider.startingPrice}</AppText>}
    </Pressable>
  </View>;
}

export type CustomerHomeViewProps = {
  previous: ProviderCardData[]; recommended: ProviderCardData[];
  previousLoading?: boolean; recommendedLoading?: boolean; previousError?: boolean; recommendedError?: boolean;
  query: string; onQueryChange: (value: string) => void; onSearch: () => void; searching?: boolean;
  onSearchFocus?: () => void; onPreviousProvider?: (id: string) => void;
  onCategory: (key: string, label: string) => void; onProvider: (id: string) => void;
  onBookAgain: () => void; onSave: (id: string) => void; savedIds?: string[]; savingId?: string | null;
  refreshing?: boolean; onRefresh?: () => void; recommendationNote?: string;
};

export function CustomerHomeView(props: CustomerHomeViewProps) {
  return <ScrollView style={homeStyles.scroll} contentContainerStyle={homeStyles.content} showsVerticalScrollIndicator={false}
    refreshControl={props.onRefresh ? <RefreshControl refreshing={!!props.refreshing} onRefresh={props.onRefresh} /> : undefined}
    keyboardShouldPersistTaps="handled">
    <View style={[homeStyles.inset, styles.search]}>
      <Input icon={<DesignIcon name="search" />} placeholder="Describe your problem or search..."
        inputStyle={Typography.body}
        accessibilityLabel="Describe your problem or search" value={props.query} onChangeText={props.onQueryChange}
        onFocus={props.onSearchFocus}
        returnKeyType="search" onSubmitEditing={props.onSearch} />
      {!!props.query.trim() && <Button title="Search services" size="compact" loading={props.searching} onPress={props.onSearch} />}
    </View>
    <View style={{ gap: Space.sm }}>
      <AppText variant="labelSupport" style={[homeStyles.inset, { minHeight: 20 }]}>Services</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.rail}>
        {serviceCategories.map(category => <Pressable key={category.key} accessibilityRole="button" accessibilityLabel={category.label}
          onPress={() => props.onCategory(category.key, category.label)} style={styles.category}>
          <View style={styles.categoryArtwork}>
            <Image source={category.image} contentFit="contain"
              style={{ width: category.width, height: category.height, transform: category.flip ? [{ scaleX: -1 }] : [] }} />
          </View>
          <AppText variant="caption">{category.label}</AppText>
        </Pressable>)}
      </ScrollView>
    </View>
    <View style={homeStyles.section}>
      <View style={homeStyles.inset}><SectionHeading title="Book again" onPress={props.onBookAgain} /></View>
      {props.previous.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.rail}>
        {props.previous.map(provider => <ProviderCard key={provider.id} provider={provider} compact
          saved={props.savedIds?.includes(provider.id)} saving={props.savingId === provider.id}
          onOpen={() => (props.onPreviousProvider ?? props.onProvider)(provider.id)} onSave={() => props.onSave(provider.id)} />)}
      </ScrollView> : <View style={homeStyles.inset}><DataStatus loading={props.previousLoading} error={props.previousError}
        empty="Providers from your completed bookings will appear here." onRetry={props.onRefresh} /></View>}
    </View>
    <View style={homeStyles.section}>
      <View style={{ ...homeStyles.inset, gap: Space.xs }}>
        <AppText variant="h3">Recommended for you</AppText>
        <AppText variant="bodySmall" color={Colors.textSecondary}>{props.recommendationNote ?? "Explore services from available providers."}</AppText>
      </View>
      {props.recommended.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.rail}>
        {props.recommended.map(provider => <ProviderCard key={provider.id} provider={provider}
          saved={props.savedIds?.includes(provider.id)} saving={props.savingId === provider.id}
          onOpen={() => props.onProvider(provider.id)} onSave={() => props.onSave(provider.id)} />)}
      </ScrollView> : <View style={homeStyles.inset}><DataStatus loading={props.recommendedLoading} error={props.recommendedError}
        empty="No providers to show yet. Try a service category or search." onRetry={props.onRefresh} /></View>}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { gap: Space.sm },
  category: { width: 90, gap: Space.xs },
  categoryArtwork: { width: 90, height: 97, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    borderRadius: Corners.large, alignItems: "center", justifyContent: "center" },
  provider: { gap: 6 },
  photo: { backgroundColor: Colors.primarySoft, borderRadius: Corners.large, overflow: "hidden" },
  providerCopy: { gap: 6 },
  providerLine: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  rating: { flexDirection: "row", alignItems: "center", gap: Space.xs },
  save: { position: "absolute", right: 2, top: 2, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  saveSurface: { width: 32, height: 32, backgroundColor: Colors.surface, borderRadius: Corners.full, alignItems: "center", justifyContent: "center" },
});

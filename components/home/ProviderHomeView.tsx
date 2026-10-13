import { Space, Corners } from "@/constants/layout";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { DesignIcon, LocationIcon } from "@/components/DesignIcon";
import { DataStatus, homeStyles, SectionHeading } from "@/components/home/HomeParts";
import Colors from "@/constants/colors";
import type { HomeJob } from "@/lib/homeData";

export function JobCard({ job, onPress, width }: { job: HomeJob; onPress: () => void; width?: number }) {
  return <View style={[styles.job, width != null && { width }]}>
    <View style={styles.overview}>
      <View style={styles.jobCopy}>
        <AppText variant="titleSmall" numberOfLines={1}>{job.title}</AppText>
        <AppText variant="bodySmall" color={Colors.textSecondary} numberOfLines={1}>{job.customer} · {job.date}</AppText>
        {job.address && <View style={styles.location}><LocationIcon /><AppText variant="bodySmall" color={Colors.textSecondary} numberOfLines={1} style={styles.flex}>{job.address}</AppText></View>}
      </View>
      {job.image && <Image source={job.image} style={styles.jobPhoto} contentFit="cover" />}
    </View>
    <Button title="View Job progress" size="compact" onPress={onPress} />
  </View>;
}

export function RequestCard({ request, onPress, width }: { request: HomeJob; onPress: () => void; width?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={"View request from " + request.customer} onPress={onPress} style={[styles.request, width != null && { width }]}>
    <View style={styles.requestHeader}>
      <View style={styles.customer}>
        {request.avatar && <Image source={request.avatar} style={styles.avatar} contentFit="cover" />}
        <AppText variant="body" numberOfLines={1} style={styles.flex}>{request.customer}</AppText>
      </View>
      <View style={styles.newBadge}><AppText variant="caption" color={Colors.primary}>New</AppText></View>
    </View>
    <AppText variant="bodySupport" numberOfLines={1}>{request.description}</AppText>
    <View style={{ gap: Space.xs }}>
      <AppText variant="bodySmall" color={Colors.textSecondary}>{request.date}</AppText>
      {request.address && <View style={styles.location}><LocationIcon /><AppText variant="bodySmall" color={Colors.textSecondary}>{request.address}</AppText></View>}
    </View>
  </Pressable>;
}

export function ProviderSetupView({ stage, hasProfile, hasService, onSetup, onVerification, onServices }: {
  stage: "setup" | "pending" | "changes"; hasProfile: boolean; hasService: boolean;
  onSetup: () => void; onVerification: () => void; onServices: () => void;
}) {
  const pending = stage === "pending";
  return <ScrollView style={homeStyles.scroll} contentContainerStyle={[homeStyles.content, { paddingHorizontal: Space.page, paddingTop: Space.xl }]}>
    <View style={{ gap: Space.sm }}>
      <AppText variant="h2">{pending ? "Verification in progress" : stage === "changes" ? "Verification needs attention" : "Finish provider setup"}</AppText>
      <AppText variant="body" color={Colors.textSecondary}>{pending ? "Your profile and first service are saved." : "Complete these steps to start offering services."}</AppText>
    </View>
    <View style={{ gap: Space.md }}>
      <AppText variant="label">Your setup</AppText>
      <View>{[{ label: "Profile", done: hasProfile, onPress: onSetup }, { label: "First service", done: hasService, onPress: hasProfile ? onServices : onSetup },
        { label: "Identity", done: false, onPress: onVerification }].map(item => <Pressable key={item.label} accessibilityRole="button"
          accessibilityLabel={item.label + (item.done ? ", saved" : pending ? ", under review" : ", setup needed")}
          onPress={item.onPress} style={styles.setupRow}>
          <DesignIcon name={item.done ? "check" : "pending"} />
          <AppText variant="labelSmall">{item.label}</AppText>
      </Pressable>)}</View>
    </View>
    <Callout title="You’re not listed yet" titleVariant="label" message="Customers can find and book you after your verification is approved." />
    <Button title={pending ? "View verification status" : "Continue setup"} onPress={pending ? onVerification : onSetup} />
  </ScrollView>;
}

export type ProviderHomeViewProps = {
  available?: boolean; availabilityLabel?: string; onManage: () => void; onEarnings: () => void;
  netToday?: string; netWeek?: string; earningsNote?:string; jobs: HomeJob[]; requests: HomeJob[];
  jobsLoading?: boolean; jobsError?: boolean; onJob: (id: string) => void; onRequest: (id: string) => void;
  onAllJobs: () => void; onAllRequests: () => void; refreshing?: boolean; onRefresh?: () => void;
};
export function ProviderHomeView(props: ProviderHomeViewProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 420);
  return <ScrollView style={homeStyles.scroll} contentContainerStyle={[homeStyles.content, { paddingTop: Space.xl }]} showsVerticalScrollIndicator={false}
    refreshControl={props.onRefresh ? <RefreshControl refreshing={!!props.refreshing} onRefresh={props.onRefresh} /> : undefined}>
    <View style={[homeStyles.inset, styles.availability]}>
      <View style={[styles.statusBadge, { backgroundColor: props.available ? Colors.successSoft : Colors.background }]}>
        {props.available && <Image source={require("@/assets/design/4b9ae.svg")} style={{ width: 8, height: 8 }} />}
        <AppText variant="label">{props.availabilityLabel ?? (props.available ? "Available" : "Unavailable")}</AppText>
      </View>
      <Button title="Manage" variant="outline" size="compact" style={{ width: 104, borderColor: Colors.borderStrong }} textStyle={{ color: Colors.textPrimary }} onPress={props.onManage} />
    </View>
    <View style={[homeStyles.inset, { gap: Space.sm }]}>
      <AppText variant="h3">Net earnings</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="View earnings" onPress={props.onEarnings} style={styles.earnings}>
        <View style={{ flex: 1.25, gap: Space.xs }}><AppText variant="bodySmall" color={Colors.textSecondary}>Today</AppText><AppText variant={width < 350 ? "labelLarge" : width < 375 ? "h3" : "h2"} numberOfLines={1}>{props.netToday ?? "—"}</AppText></View>
        <View style={styles.divider} />
        <View style={[styles.flex, { gap: Space.xs }]}><AppText variant="bodySmall" color={Colors.textSecondary}>This week</AppText><AppText variant={width < 350 ? "labelLarge" : width < 375 ? "h3" : "h2"} numberOfLines={1}>{props.netWeek ?? "—"}</AppText></View>
      </Pressable>
      {(!props.netToday || !props.netWeek) && <AppText variant="bodySmall" color={Colors.textSecondary}>{props.earningsNote??"Net totals will appear when the earnings service is connected."}</AppText>}
    </View>
    <View style={homeStyles.section}>
      <View style={homeStyles.inset}><SectionHeading provider title="Your Work" count={props.jobsError || props.jobsLoading ? undefined : props.jobs.length} onPress={props.onAllJobs} /></View>
      {props.jobs.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.rail}>
        {props.jobs.map(job => <JobCard key={job.id} job={job} onPress={() => props.onJob(job.id)} width={cardWidth} />)}
      </ScrollView> : <View style={homeStyles.inset}><DataStatus loading={props.jobsLoading} error={props.jobsError} empty="Your active jobs will appear here." onRetry={props.onRefresh} /></View>}
    </View>
    <View style={homeStyles.section}>
      <View style={homeStyles.inset}><SectionHeading provider title="New requests" count={props.jobsError || props.jobsLoading ? undefined : props.requests.length} onPress={props.onAllRequests} /></View>
      {props.requests.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.rail}>
        {props.requests.map(request => <RequestCard key={request.id} request={request} onPress={() => props.onRequest(request.id)} width={cardWidth} />)}
      </ScrollView> : <View style={homeStyles.inset}><DataStatus loading={props.jobsLoading} error={props.jobsError} empty="New customer requests will appear here." onRetry={props.onRefresh} /></View>}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  availability: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: Space.sm },
  statusBadge: { borderRadius: Corners.full, paddingHorizontal: Space.md, paddingVertical: Space.sm, flexDirection: "row", alignItems: "center", gap: Space.sm, flexShrink: 1 },
  earnings: { padding: Space.lg, borderRadius: Corners.large, backgroundColor: Colors.primarySoft, flexDirection: "row", alignItems: "center", gap: Space.lg },
  divider: { height: 48, width: 1, backgroundColor: Colors.border },
  job: { borderWidth: 1, borderColor: Colors.border, borderRadius: Corners.panel, padding: 19, gap: Space.lg },
  overview: { flexDirection: "row", alignItems: "center", gap: Space.md, minHeight: 80 },
  jobCopy: { flex: 1, gap: Space.xs },
  jobPhoto: { width: 80, height: 80, borderRadius: Corners.large },
  location: { flexDirection: "row", alignItems: "center", gap: Space.xs },
  request: { borderWidth: 1, borderColor: Colors.border, borderRadius: Corners.large, padding: 15, gap: Space.md, minHeight: 154 },
  requestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Space.md },
  customer: { flex: 1, flexDirection: "row", alignItems: "center", gap: Space.md },
  avatar: { width: 32, height: 32, borderRadius: Corners.full },
  newBadge: { width: 84, borderRadius: 8, paddingVertical: Space.xs, alignItems: "center", backgroundColor: Colors.primarySoft },
  setupRow: { flexDirection: "row", alignItems: "center", gap: Space.md, padding: Space.md, minHeight: 48 },
});

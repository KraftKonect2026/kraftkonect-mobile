import { Space } from "@/constants/layout";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { SelectionChip } from "@/components/SelectionChip";
import { JobCard, RequestCard } from "@/components/home/ProviderHomeView";
import { DataStatus, homeStyles } from "@/components/home/HomeParts";
import Colors from "@/constants/colors";
import type { HomeJob } from "@/lib/homeData";

export type JobSection = "requests" | "active" | "completed" | "cancelled";
export function JobsView({ section, onSection, jobs, loading, error, onRetry, onJob }: {
  section: JobSection; onSection: (section: JobSection) => void; jobs: HomeJob[];
  loading?: boolean; error?: boolean; onRetry?: () => void; onJob: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const labels = { requests: "Requests", active: "Active", completed: "Completed", cancelled: "Cancelled" } as const;
  return <ScrollView style={homeStyles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
    <View style={{ gap: Space.sm }}><AppText variant="h2">Jobs</AppText><AppText variant="body" color={Colors.textSecondary}>Follow new requests, active jobs and completed work.</AppText></View>
    <View style={styles.filters}>
      {(Object.keys(labels) as JobSection[]).map(key => <SelectionChip key={key} label={labels[key]} selected={section === key} onPress={() => onSection(key)} style={{ paddingHorizontal: Space.sm }} />)}
    </View>
    <AppText variant="labelLarge">{section === "requests" ? "Your requests" : labels[section] + " jobs"}</AppText>
    {jobs.length ? jobs.map(job => section === "requests" ? <RequestCard key={job.id} request={job} onPress={() => onJob(job.id)} />
      : <JobCard key={job.id} job={job} onPress={() => onJob(job.id)} />)
      : <DataStatus loading={loading} error={error} onRetry={onRetry} empty={"No " + labels[section].toLowerCase() + " yet."} />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.page, paddingBottom: Space.xxl, gap: Space.xl },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: Space.xs },
});

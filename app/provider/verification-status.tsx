import { useAppSelector } from "@/store";
import { Space } from "@/constants/layout";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { DataStatus, homeStyles } from "@/components/home/HomeParts";
import { MY_PROVIDER_PROFILE_QUERY } from "@/lib/queries";
import { ProviderProfile } from "@/lib/homeData";
import { useProviderVerification } from "@/lib/hooks/useProviderVerification";

const descriptions: Record<string, string> = {
  unknown: "Your verification status could not be confirmed. Refresh before continuing.",
  approved: "Your identity verification has been approved.",
  pending: "Your identity verification is under review.",
  submitted: "Your documents were submitted and are waiting for review.",
  in_review: "Your identity verification is under review.",
  failed: "Your identity verification needs attention. You can try again.",
  declined: "Your identity verification needs attention. You can try again.",
  rejected: "Your identity verification needs attention. You can try again.",
};
export default function VerificationStatusScreen() {const owner=useAppSelector(s=>s.auth.user?.id);return <OwnedVerification key={owner??"signed-out"}/>;}
function OwnedVerification() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useQuery<{ myProviderProfile: ProviderProfile | null }>(MY_PROVIDER_PROFILE_QUERY, { fetchPolicy: "no-cache",context:{accountOwnerId:useAppSelector(s=>s.auth.user?.id),queryDeduplication:false} });
  const value = profile.data?.myProviderProfile;
  const verification = useProviderVerification(value?.id, async () => (await profile.refetch()).data?.myProviderProfile?.kycStatus ?? undefined);
  const status = value?.kycStatus ?? "unknown";
  const underReview = ["pending", "submitted", "in_review"].includes(status);
  return <ScrollView style={homeStyles.screen} contentContainerStyle={{ padding: Space.page, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: Space.xl }}>
    <Button title="Back to Home" variant="subtle" size="compact" onPress={() => router.replace("/provider/(tabs)/today")} />
    <AppText variant="h2">Identity verification</AppText>
    {profile.loading || profile.error ? <DataStatus loading={profile.loading} error={!!profile.error} onRetry={() => { profile.refetch().catch(() => {}); }} />
      : <View style={{ gap: Space.xl }}>
        <Callout title={status === "approved" ? "Approved" : underReview ? "Verification in progress" : status==="unknown"?"Status unavailable":"Verification needed"}
          message={descriptions[status] ?? "Submit your identity verification to finish provider setup."} />
        {status !== "approved" && status!=="unknown" && <Callout title="You’re not listed yet" message="Your required verification must be approved before customers can find and book you." />}
        {value ? !underReview && status !== "approved" && status!=="unknown" && <Button title="Verify identity" onPress={verification.start} loading={verification.busy} />
          : <Button title="Continue setup" onPress={() => router.push("/provider-onboarding/welcome")} />}
        <Button title="Refresh status" variant="outline" onPress={() => { profile.refetch().catch(() => {}); }} disabled={verification.busy || profile.loading} />
      </View>}
  </ScrollView>;
}

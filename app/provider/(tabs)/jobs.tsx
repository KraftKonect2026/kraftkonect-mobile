import { useAppSelector } from "@/store";
import { Space } from "@/constants/layout";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";
import { LiveBookingList } from "@/components/bookings/LiveBookingList";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import { DataStatus, homeStyles } from "@/components/home/HomeParts";
import { MY_PROVIDER_PROFILE_QUERY } from "@/lib/queries";
import { ProviderProfile } from "@/lib/homeData";

export default function JobsScreen() {const owner=useAppSelector(s=>s.auth.user?.id);return <OwnedJobs key={owner??"signed-out"}/>;}
function OwnedJobs() {
  const router = useRouter();
  const profile = useQuery<{ myProviderProfile: ProviderProfile | null }>(MY_PROVIDER_PROFILE_QUERY,{fetchPolicy:"no-cache",context:{accountOwnerId:useAppSelector(s=>s.auth.user?.id),queryDeduplication:false}});
  if (profile.loading || profile.error) return <View style={[homeStyles.screen, { padding: Space.page }]}><DataStatus loading={profile.loading} error={!!profile.error} onRetry={() => { profile.refetch().catch(() => {}); }} /></View>;
  if (!profile.data?.myProviderProfile) return <View style={[homeStyles.screen, { padding: Space.page, gap: Space.lg }]}>
    <Callout title="Finish provider setup" message="Complete your profile and verification before receiving customer requests." />
    <Button title="Continue setup" onPress={() => router.push("/provider-onboarding/welcome")} />
  </View>;
  return <LiveBookingList role="provider"/>;
}

import { Space } from "@/constants/layout";
import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@apollo/client";
import { ModeHeader } from "@/components/ModeHeader";
import { ProviderHomeView, ProviderSetupView } from "@/components/home/ProviderHomeView";
import { AvailabilitySheet } from "@/components/home/AvailabilitySheet";
import { DataStatus, homeStyles } from "@/components/home/HomeParts";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { useAppSelector } from "@/store";
import { BOOKINGS_FOR_PROVIDER_QUERY, MY_PROVIDER_PROFILE_QUERY, MY_LISTINGS_QUERY } from "@/lib/queries";
import { ExistingBooking, ProviderProfile, partitionJobs, providerStage, toHomeJob } from "@/lib/homeData";
import { useToast } from "@/lib/toast";

export default function TodayDashboardScreen() { const owner=useAppSelector(s=>s.auth.user?.id);return <OwnedDashboard key={owner??"signed-out"}/>; }
function OwnedDashboard() {
  const router = useRouter();
  const { mode, switchMode } = useAppMode();
  const toast = useToast();
  const token = useAppSelector(s => s.auth.accessToken),ownerId=useAppSelector(s=>s.auth.user?.id);
  const context={accountOwnerId:ownerId,queryDeduplication:false};
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const profile = useQuery<{ myProviderProfile: ProviderProfile | null }>(MY_PROVIDER_PROFILE_QUERY, { skip: !token, fetchPolicy: "no-cache",context });
  const listings = useQuery<{ myProviderProfile: { listings: { id: string }[] } | null }>(MY_LISTINGS_QUERY, { skip: !profile.data?.myProviderProfile?.id,fetchPolicy:"no-cache",context });
  const bookings = useQuery<{ bookingsForProvider: ExistingBooking[] }>(BOOKINGS_FOR_PROVIDER_QUERY, { skip: !profile.data?.myProviderProfile?.id,fetchPolicy:"no-cache",context });
  const hasService = !!listings.data?.myProviderProfile?.listings?.length;
  const stage = providerStage(profile.data?.myProviderProfile, hasService);
  const groups = partitionJobs(bookings.data?.bookingsForProvider ?? []);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([profile.refetch(), ...(profile.data?.myProviderProfile?.id ? [listings.refetch(), bookings.refetch()] : [])]);
    } finally { setRefreshing(false); }
  };
  const onSetup = () => {
    if (!profile.data?.myProviderProfile) router.push("/provider-onboarding/welcome");
    else if (!hasService) router.push("/provider/add-listing");
    else router.push("/provider/verification-status");
  };
  return <View style={homeStyles.screen}>
    <ModeHeader mode={mode} onModeChange={switchMode} onNotifications={() => router.push("/notifications")} />
    {profile.loading || profile.error || (profile.data?.myProviderProfile && (listings.loading || listings.error))
      ? <View style={{ margin: Space.page }}><DataStatus loading={profile.loading || listings.loading} error={!!profile.error || !!listings.error} onRetry={onRefresh} /></View>
      : stage !== "ready"
        ? <ProviderSetupView stage={stage} hasProfile={!!profile.data?.myProviderProfile} hasService={hasService}
          onSetup={onSetup} onServices={() => router.push("/provider/services")}
          onVerification={() => profile.data?.myProviderProfile ? router.push("/provider/verification-status") : onSetup()} />
        : <ProviderHomeView available={profile.data?.myProviderProfile?.available}
          onManage={() => setAvailabilityOpen(true)} onEarnings={() => router.push("/provider/earnings")}
          jobs={groups.active.map(toHomeJob)} requests={groups.requests.map(toHomeJob)}
          jobsLoading={bookings.loading} jobsError={!!bookings.error}
          onJob={id => router.push({ pathname: "/provider/job/[id]", params: { id } })}
          onRequest={id => router.push({ pathname: "/provider/job/[id]", params: { id } })}
          onAllJobs={() => router.push({ pathname: "/provider/(tabs)/jobs", params: { section: "active" } })}
          onAllRequests={() => router.push({ pathname: "/provider/(tabs)/jobs", params: { section: "active" } })}
          refreshing={refreshing} onRefresh={onRefresh} />}
    {availabilityOpen && <AvailabilitySheet available={typeof profile.data?.myProviderProfile?.available==="boolean"?profile.data.myProviderProfile.available:undefined} providerId={profile.data?.myProviderProfile?.id}
      onClose={() => setAvailabilityOpen(false)} onSaved={() => { profile.refetch().catch(() => {}); }}
      onDates={() => { setAvailabilityOpen(false); router.push("/provider/availability"); }} />}
  </View>;
}

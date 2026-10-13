import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import { ModeHeader } from "@/components/ModeHeader";
import { CustomerHomeView } from "@/components/home/CustomerHomeView";
import { homeStyles } from "@/components/home/HomeParts";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { store, useAppSelector } from "@/store";
import { BOOKINGS_FOR_USER_QUERY, GET_FAVOURITES_QUERY, PROVIDERS_QUERY } from "@/lib/queries";
import { ADD_TO_FAVOURITES_MUTATION, REMOVE_FROM_FAVOURITES_MUTATION } from "@/lib/mutations";
import { ExistingProvider, toProviderCard } from "@/lib/homeData";
import { useToast } from "@/lib/toast";
import { useServiceArea } from "@/lib/hooks/useServiceArea";
import { CompletedJob, completedJobs } from "@/lib/discovery/model";

export default function HomeScreen() { const owner=useAppSelector(s=>s.auth.user?.id);return <OwnedHome key={owner??"signed-out"}/>; }
function OwnedHome() {
  const router = useRouter();
  const { mode, switchMode } = useAppMode();
  const toast = useToast();
  const token = useAppSelector(s => s.auth.accessToken),ownerId=useAppSelector(s=>s.auth.user?.id),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const current=()=>{const auth=store.getState().auth;return alive.current&&!!ownerId&&auth.user?.id===ownerId&&auth.isAuthenticated&&!!auth.accessToken;};
  const context={accountOwnerId:ownerId,queryDeduplication:false};
  const serviceArea = useServiceArea();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const providers = useQuery<{ providers: ExistingProvider[] }>(PROVIDERS_QUERY, {
    variables: { status: "approved", limit: 50, offset: 0 }, skip: !token,fetchPolicy:"no-cache",context,
  });
  const history = useQuery<{ bookingsForUser: CompletedJob[] }>(BOOKINGS_FOR_USER_QUERY, { skip: !token,fetchPolicy:"no-cache",context });
  const favourites = useQuery<{ favorites: { id: string }[] }>(GET_FAVOURITES_QUERY, { skip: !token,fetchPolicy:"no-cache",context });
  const [addFavourite] = useMutation(ADD_TO_FAVOURITES_MUTATION, { errorPolicy: "none" });
  const [removeFavourite] = useMutation(REMOVE_FROM_FAVOURITES_MUTATION, { errorPolicy: "none" });

  const publicProviders = (providers.data?.providers ?? []).filter(p => p.status === "approved" && p.verified);
  const completed = completedJobs(history.data?.bookingsForUser ?? []);
  const completedIds = [...new Set(completed.map(b => b.provider?.id))];
  const previous = completedIds.flatMap(id => { const provider = publicProviders.find(p=>p.id===id); return provider ? [toProviderCard(provider)] : []; });
  const savedIds = (favourites.data?.favorites ?? []).map(p => p.id);
  const results = (skill: string | undefined, label: string) => router.push({
    pathname: "/(app)/search", params: { ...(skill ? { skill } : {}), skillLabel: label,
      ...(serviceArea?.latitude != null && serviceArea.longitude != null ? { lat: String(serviceArea.latitude), lon: String(serviceArea.longitude) }
        : serviceArea?.label ? { neighbourhood: serviceArea.label } : {}) },
  });
  const onSearch = () => results(undefined, query.trim());
  const onRefresh = async () => {
    setRefreshing(true);
    try { await Promise.allSettled([providers.refetch(), history.refetch(), favourites.refetch()]); }
    finally { if(current())setRefreshing(false); }
  };
  const onSave = async (id: string) => {
    if (savingId||!current()) return;
    if (favourites.error || !favourites.data) {
      toast.error("Couldn’t load saved providers. Please refresh before trying again.");
      return;
    }
    setSavingId(id);
    try {
      const saved = savedIds.includes(id);
      const response = await (saved ? removeFavourite : addFavourite)({ variables: { providerId: id },context });
      if (saved ? !response.data?.removeFromFavorites : !response.data?.addToFavorites) throw new Error("Save failed");
      if(!current())return;
      await favourites.refetch();
      if(!current())return;
      toast.success(saved ? "Provider removed from saved." : "Provider saved.");
    } catch { if(current())toast.error("Couldn’t update saved providers. Please try again."); }
    finally { if(current())setSavingId(null); }
  };

  return <View style={homeStyles.screen}>
    <ModeHeader mode={mode} onModeChange={switchMode} onNotifications={() => toast.info("Notifications are unavailable right now. Please try again later.")} />
    <CustomerHomeView query={query} onQueryChange={setQuery} onSearch={onSearch} onSearchFocus={onSearch}
      previous={previous} recommended={publicProviders.map(toProviderCard)}
      previousLoading={history.loading || providers.loading} recommendedLoading={providers.loading}
      previousError={!!history.error || !!providers.error} recommendedError={!!providers.error}
      onCategory={results} onProvider={id => router.push({ pathname: "/(app)/provider/[id]", params: { id } })}
      onPreviousProvider={id => router.push({pathname:"/(app)/provider/[id]",params:{id,serviceId:completed.find(b=>b.provider?.id===id)?.listing?.id}})}
      onBookAgain={() => router.push("/(app)/book-again")} savedIds={savedIds} savingId={savingId} onSave={onSave}
      refreshing={refreshing} onRefresh={onRefresh} />
  </View>;
}

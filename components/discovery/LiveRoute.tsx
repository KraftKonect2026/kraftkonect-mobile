import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { store, useAppSelector } from "@/store";
import { BOOKINGS_FOR_USER_QUERY, GET_FAVOURITES_QUERY, NEARBY_ARTISANS_QUERY, PARSE_JOB_DESCRIPTION_QUERY, PROVIDER_QUERY } from "@/lib/queries";
import { ADD_TO_FAVOURITES_MUTATION, REMOVE_FROM_FAVOURITES_MUTATION } from "@/lib/mutations";
import { CompletedJob, discoveryKey, DiscoveryStep, Provider, RequestDraft, SearchDraft } from "@/lib/discovery/model";
import { secureStorage } from "@/lib/storage";
import { useToast } from "@/lib/toast";
import { DiscoveryJourney } from "./Journey";

export function LiveDiscoveryRoute({ entry="what" }: {entry?:DiscoveryStep}) {
  const accountId=useAppSelector(s=>s.auth.user?.id);
  const params=useLocalSearchParams<{id?:string;providerId?:string;serviceId?:string;skill?:string;skillLabel?:string;problem?:string;lat?:string;lon?:string;neighbourhood?:string}>();
  if(!accountId)return null;
  return <LiveDiscovery key={JSON.stringify([accountId,entry,params.id,params.providerId,params.serviceId,params.skill,params.skillLabel,params.problem,params.neighbourhood,params.lat,params.lon])} owner={accountId} entry={entry} params={params}/>;
}
type RouteParams = {id?:string;providerId?:string;serviceId?:string;skill?:string;skillLabel?:string;problem?:string;lat?:string;lon?:string;neighbourhood?:string};
function LiveDiscovery({owner,entry,params}:{owner:string;entry:DiscoveryStep;params:RouteParams}) {
  const client=useApolloClient();const router=useRouter();const toast=useToast();
  const [pool,setPool]=useState<Record<string,Provider>>({});const [resultIds,setResultIds]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);const [error,setError]=useState(false);const [providerLoading,setProviderLoading]=useState(entry==="profile");const [providerError,setProviderError]=useState(false);const [collectionLoading,setCollectionLoading]=useState(entry==="saved" || entry==="again");const [collectionError,setCollectionError]=useState(false);
  const [recent,setRecent]=useState<string[]>([]);const [savingId,setSavingId]=useState<string|null>(null);
  const alive=useRef(true);const searchVersion=useRef(0);const profileVersion=useRef(0);const collectionVersion=useRef(0);const operation=useRef<"search"|"profile"|"collection">(entry==="profile" ? "profile" : entry==="saved" || entry==="again" ? "collection" : "search");
  const criteria=useRef<SearchDraft|null>(null);const selected=useRef(params.id ?? params.providerId ?? "");const saving=useRef(false);
  const context={accountOwnerId:owner,queryDeduplication:false};
  const current=()=>{const auth=store.getState().auth;return alive.current&&auth.user?.id===owner&&auth.isAuthenticated&&!!auth.accessToken;};
  const favourites=useQuery<{favorites:{id:string}[]}>(GET_FAVOURITES_QUERY,{fetchPolicy:"no-cache",errorPolicy:"none",context});
  const bookings=useQuery<{bookingsForUser:CompletedJob[]}>(BOOKINGS_FOR_USER_QUERY,{skip:entry!=="again",fetchPolicy:"no-cache",errorPolicy:"none",context});
  const [nearby]=useLazyQuery<{nearbyArtisans:{id:string}[]}>(NEARBY_ARTISANS_QUERY,{fetchPolicy:"no-cache",errorPolicy:"none",context});
  const [parseProblem]=useLazyQuery<{parseJobDescription:{skill?:string}}>(PARSE_JOB_DESCRIPTION_QUERY,{fetchPolicy:"no-cache",errorPolicy:"none",context});
  const [add]=useMutation(ADD_TO_FAVOURITES_MUTATION,{errorPolicy:"none"});const [remove]=useMutation(REMOVE_FROM_FAVOURITES_MUTATION,{errorPolicy:"none"});
  useEffect(()=> {alive.current=true;secureStorage.getItem(discoveryKey(owner,"recent")).then(raw=>{if(!alive.current)return;try{const values=JSON.parse(raw ?? "[]");if(Array.isArray(values))setRecent(values.filter((v):v is string=>typeof v==="string" && v.length<=160).slice(0,5));}catch{}}).catch(()=>{});return()=>{alive.current=false;};},[owner]);
  const readProvider=useCallback(async(id:string)=> {
    const result=await client.query<{provider:Provider}>({query:PROVIDER_QUERY,variables:{providerId:id},fetchPolicy:"no-cache",errorPolicy:"none",context:{accountOwnerId:owner,queryDeduplication:false}});
    if(!result.data?.provider?.id || result.data.provider.id!==id)throw new Error("Provider not confirmed");return result.data.provider;
  },[client,owner]);
  const hydrate=useCallback(async(ids:string[])=> {
    const values:Provider[]=[];
    // Bound concurrency while using the existing detailed provider contract.
    for(let i=0;i<ids.length;i+=4) values.push(...await Promise.all(ids.slice(i,i+4).map(readProvider)));
    return values;
  },[readProvider]);
  const addToPool=(values:Provider[])=>setPool(previous=>({...previous,...Object.fromEntries(values.map(p=>[p.id,p]))}));
  const loadProfile=useCallback(async(id:string)=> {
    selected.current=id;operation.current="profile";const version=++profileVersion.current;setProviderLoading(true);setProviderError(false);
    try {const p=await readProvider(id);if(alive.current && version===profileVersion.current)addToPool([p]);}
    catch {if(alive.current && version===profileVersion.current)setProviderError(true);}
    finally {if(alive.current && version===profileVersion.current)setProviderLoading(false);}
  },[readProvider]);
  useEffect(()=> {if(entry==="profile" && selected.current)void loadProfile(selected.current);},[entry,loadProfile]);
  const ids=entry==="saved" ? favourites.data?.favorites.map(p=>p.id) ?? [] : entry==="again" ? [...new Set((bookings.data?.bookingsForUser ?? []).filter(b=>b.status==="completed").map(b=>b.provider?.id).filter((id):id is string=>!!id))] : [];
  const collectionIds=JSON.stringify(ids);
  const loadCollection=useCallback(async()=> {
    const targets=JSON.parse(collectionIds) as string[];const version=++collectionVersion.current;setCollectionLoading(true);setCollectionError(false);
    try {const values=await hydrate(targets);if(alive.current && version===collectionVersion.current)addToPool(values);}
    catch {if(alive.current && version===collectionVersion.current)setCollectionError(true);}
    finally {if(alive.current && version===collectionVersion.current)setCollectionLoading(false);}
  },[collectionIds,hydrate]);
  useEffect(()=> {if(entry==="saved" || entry==="again")void loadCollection();},[entry,loadCollection]);
  const runSearch=async(draft:SearchDraft)=> {
    operation.current="search";criteria.current=draft;const version=++searchVersion.current;setLoading(true);setError(false);
    try {
      let skill=draft.category || null;
      if(!skill && draft.problem.trim()) {
        try { const parsed=await parseProblem({variables:{description:draft.problem.trim()}});skill=parsed.data?.parseJobDescription.skill || null; }
        catch { if(alive.current && version===searchVersion.current)toast.info("Smart search is unavailable. These results cover your area; providers must confirm the job is a fit."); }
      }
      const result=await nearby({variables:{skill,lat:draft.latitude ?? null,lon:draft.longitude ?? null,radiusKm:10,neighbourhood:draft.area.trim() || null}});
      if(!result.data?.nearbyArtisans)throw new Error("Results not confirmed");
      const ids=[...new Set(result.data.nearbyArtisans.map(p=>p.id))];const values=await hydrate(ids);
      if(alive.current && version===searchVersion.current){addToPool(values);setResultIds(ids);}
    } catch {if(alive.current && version===searchVersion.current)setError(true);}
    finally {if(alive.current && version===searchVersion.current)setLoading(false);}
  };
  const save=async(id:string)=> {
    if(saving.current||!current())return;
    if(favourites.error || !favourites.data){toast.error("Couldn’t load saved providers. Please retry before saving.");return;}
    saving.current=true;setSavingId(id);const wasSaved=favourites.data.favorites.some(p=>p.id===id);
    try {const response=await (wasSaved ? remove : add)({variables:{providerId:id},context});if(wasSaved ? !response.data?.removeFromFavorites : !response.data?.addToFavorites)throw new Error("Save not confirmed");if(!current())return;await favourites.refetch();if(current())toast.success(wasSaved ? "Provider removed from saved." : "Provider saved.");}
    catch {if(current())toast.error("Couldn’t update saved providers. Please try again.");}
    finally {saving.current=false;if(current())setSavingId(null);}
  };
  const remember=(area:string)=> {const next=[area,...recent.filter(v=>v!==area)].slice(0,5);setRecent(next);secureStorage.setItem(discoveryKey(owner,"recent"),JSON.stringify(next)).catch(()=>{if(alive.current)toast.info("Recent areas couldn’t be saved on this device.");});};
  const locate=async()=> {
    const Location=await import("expo-location");
    const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=="granted")throw new Error("Location permission denied");
    const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});const places=await Location.reverseGeocodeAsync(position.coords);const place=places[0];
    const label=[place?.district || place?.city,place?.region].filter(Boolean).join(", ");if(!label)throw new Error("Area unavailable");
    return {label,latitude:position.coords.latitude,longitude:position.coords.longitude};
  };
  const retry=()=> {
    if(operation.current==="profile")void loadProfile(selected.current);
    else if(operation.current==="collection"){void Promise.allSettled([favourites.refetch(),...(entry==="again" ? [bookings.refetch()] : [])]).then(()=>loadCollection());}
    else if(criteria.current)void runSearch(criteria.current);
    else void favourites.refetch().catch(()=>{});
  };
  return <DiscoveryJourney owner={owner} initialStep={entry} initialProviderId={params.id ?? params.providerId} initialServiceId={params.serviceId} initialSearch={{...(params.skill ? {category:params.skill} : {}),...(params.problem || params.skillLabel ? {problem:params.problem || params.skillLabel} : {}),...(params.neighbourhood ? {area:params.neighbourhood} : {}),...(params.lat && params.lon ? {latitude:Number(params.lat),longitude:Number(params.lon)} : {})}}
    providers={Object.values(pool)} resultIds={resultIds} history={bookings.data?.bookingsForUser ?? []} savedIds={favourites.data?.favorites.map(p=>p.id) ?? []} recent={recent}
    loading={loading} error={error} historyLoading={bookings.loading || collectionLoading} historyError={!!bookings.error || collectionError} savedLoading={favourites.loading || collectionLoading} savedError={!!favourites.error || collectionError} providerLoading={providerLoading} providerError={providerError} savingId={savingId}
    onRetry={retry} onSave={id=>void save(id)} onSearch={draft=>void runSearch(draft)} onProvider={id=>void loadProfile(id)} onRememberArea={remember} onLocate={locate} onClose={()=>router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)")}
    onSend={async(_draft:RequestDraft)=> {throw new Error("Targeted request API contract is not available.");}}/>
  ;
}

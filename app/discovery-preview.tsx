import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { DiscoveryJourney } from "@/components/discovery/Journey";
import { Sheet } from "@/components/discovery/Parts";
import Colors from "@/constants/colors";
import { confirmedRequest, discoveryKey, DiscoveryStep, localDate, requestError, SearchDraft } from "@/lib/discovery/model";
import { secureStorage } from "@/lib/storage";
import { discoveryHistory, discoveryProviders, discoveryPreviewId, previewArt } from "@/lib/preview/discoveryFixtures";
import { useToast } from "@/lib/toast";
import { sampleInspection } from "@/lib/preview/inspectionModel";
import { resetSampleInspection, useSampleInspection } from "@/lib/preview/inspectionStore";
import { withSampleReview } from "@/lib/preview/reviewModel";
import { readSampleCatalog, useSampleCatalog } from "@/lib/preview/catalogStore";
import { withSampleCatalog } from "@/lib/provider/catalog";
import { readSampleAccount, useSampleAccount } from "@/lib/preview/accountStore";
import { withSampleAccount } from "@/lib/preview/accountProjection";

const owner="preview/step5";
const scenarios=["Sample","Empty","Loading","Error","Send failure","Unavailable service"] as const;
type Scenario=typeof scenarios[number];
export default function DiscoveryPreviewRoute() { if(!__DEV__)return <Redirect href="/"/>;return <DiscoveryPreview/>; }
function DiscoveryPreview() {
  const router=useRouter();const params=useLocalSearchParams<{step?:string;category?:string;problem?:string;providerId?:string;serviceId?:string}>();const toast=useToast();
  const {record:sampleBooking}=useSampleInspection();
  const {record:catalog}=useSampleCatalog();
  const {record:account}=useSampleAccount();
  const [scenario,setScenario]=useState<Scenario>("Sample");const [states,setStates]=useState(false);const [saved,setSaved]=useState<string[]>([]);const [ready,setReady]=useState(false);
  const [recent,setRecent]=useState<string[]>(["Lekki Phase 1, Lagos","Ajah, Lagos"]);const [criteria,setCriteria]=useState<SearchDraft|null>(null);
  const alive=useRef(true);const writes=useRef(Promise.resolve());
  useEffect(()=> {alive.current=true;secureStorage.getItem(discoveryKey(owner,"saved")).then(raw=>{if(!alive.current)return;try{const ids=JSON.parse(raw ?? '["tobi","amara","kola"]');if(Array.isArray(ids))setSaved(ids.filter((id):id is string=>typeof id==="string"));}catch{}setReady(true);}).catch(()=>{if(alive.current)setReady(true);});return()=>{alive.current=false;};},[]);
  const save=useCallback((id:string)=>{
    const next=saved.includes(id) ? saved.filter(x=>x!==id) : [...saved,id];setSaved(next);
    writes.current=writes.current.catch(()=>{}).then(()=>secureStorage.setItem(discoveryKey(owner,"saved"),JSON.stringify(next))).catch(()=>{if(alive.current)toast.error("Couldn’t save preview favourites on this device.");});
  },[saved,toast]);
  const initialStep:DiscoveryStep=["saved","again","profile","results"].includes(params.step ?? "") ? params.step as DiscoveryStep : "what";
  const initialSearch=params.step==="results" ? {category:"plumbing",problem:"Plumbing",area:account?.defaultArea??"Lekki Phase 1, Lagos",date:localDate()} : { area:account?.defaultArea, ...(params.category ? {category:params.category} : {}),...(params.problem ? {problem:params.problem} : {}) };
  const reviewed=discoveryProviders.map(p=>withSampleAccount(withSampleCatalog(withSampleReview(p,sampleBooking),catalog),account));
  const providers=scenario==="Empty" ? [] : scenario==="Unavailable service" ? reviewed.map(p=>p.id==="tobi" ? {...p,services:p.services?.map(s=>({...s,active:false}))} : p) : reviewed;
  return <View style={{flex:1,backgroundColor:Colors.surface}}><View style={{minHeight:44,paddingLeft:12,paddingRight:4,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} numberOfLines={1} style={{flex:1,minWidth:0}}>LOCAL PREVIEW · Sample data · {scenario}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Preview states" onPress={()=>setStates(true)} style={{width:44,height:44,justifyContent:"center",alignItems:"center"}}><AppText variant="caption" color={Colors.primary}>States</AppText></Pressable></View>
    {ready && account && <DiscoveryJourney key={initialStep+":"+(params.providerId ?? "")+":"+(params.category ?? "")} owner={owner} preview initialStep={initialStep} initialSearch={initialSearch} initialProviderId={params.providerId ? discoveryPreviewId(params.providerId) : "tobi"} initialServiceId={params.serviceId}
      providers={providers} history={scenario==="Empty" ? [] : discoveryHistory} art={previewArt} savedIds={saved} recent={recent}
      resultIds={criteria?.area.toLowerCase().includes("nowhere") ? [] : undefined} loading={scenario==="Loading"} error={scenario==="Error"} savedLoading={scenario==="Loading"} savedError={scenario==="Error"} historyLoading={scenario==="Loading"} historyError={scenario==="Error"} providerLoading={scenario==="Loading"} providerError={scenario==="Error"}
      onSearch={setCriteria} onProvider={()=>{}} onSave={save} onRetry={()=>setScenario("Sample")} onRememberArea={area=>setRecent(v=>[area,...v.filter(x=>x!==area)].slice(0,5))} onClose={()=>router.replace({pathname:"/app-preview",params:{mode:"customer"}})}
      onPending={()=>router.push({pathname:"/booking-preview",params:{mode:"customer",step:"detail"}})} onMessage={()=>router.push({pathname:"/booking-preview",params:{mode:"customer",step:"message"}})}
      onLocate={async()=>({label:"Lekki Phase 1, Lagos"})} onSend={async draft=>{if(scenario==="Send failure" || scenario==="Error")throw new Error("Sample send failure");const currentAccount=await readSampleAccount();if(!currentAccount.signedIn||currentAccount.deletion)throw new Error("Sign in to the active sample account before sending a request.");const baseline=discoveryProviders.find(p=>p.id===draft.providerId);const provider=baseline?withSampleAccount(withSampleCatalog(baseline,await readSampleCatalog()),currentAccount):undefined;const invalid=requestError(draft,provider);if(invalid)throw new Error(invalid);const receipt=confirmedRequest({id:"sample-request",providerId:draft.providerId,serviceId:draft.serviceId,status:"pending"},draft);await resetSampleInspection(sampleInspection(draft,provider?.name,provider?.services?.find(s=>s.id===draft.serviceId)?.title));await secureStorage.setItem(discoveryKey(owner,"request")+".sample-record",JSON.stringify({receipt,draft}));return receipt;}}/>}
    {states && <Sheet title="Preview states" showClose onClose={()=>setStates(false)}><Callout message="All data and submissions in this preview are samples. Your account and backend are unchanged."/><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{scenarios.map(value=><SelectionChip key={value} label={value} selected={scenario===value} onPress={()=>{setScenario(value);setStates(false);}}/>)}</View><Button title="Saved providers" variant="outline" onPress={()=>{setStates(false);router.replace({pathname:"/discovery-preview",params:{step:"saved"}});}}/><Button title="Book again" variant="outline" onPress={()=>{setStates(false);router.replace({pathname:"/discovery-preview",params:{step:"again"}});}}/></Sheet>}
  </View>;
}

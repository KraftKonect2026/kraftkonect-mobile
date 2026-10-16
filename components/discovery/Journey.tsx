import { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import Colors from "@/constants/colors";
import { useDiscoveryDraft } from "@/lib/hooks/useDiscoveryDraft";
import { activeServices, categories, completedJobs, CompletedJob, confirmedRequest, dateLabel, DiscoveryStep, futureDay, isPublic, matchingService, Provider, requestError, RequestDraft, RequestReceipt, SearchDraft, Service, sortedProviders } from "@/lib/discovery/model";
import { ds, Frame, Icon, Photo, ProviderArt, ProviderCard, ServiceCard, Sheet, Status, TopBar } from "./Parts";
import { Calendar, SearchScreen, WhatField, WhereField } from "./SearchFields";
import { PhotoViewer, ProfileScreen, ReviewsSheet } from "./Profile";
import { RequestDetails, RequestScreen, ReviewScreen, SentScreen } from "./RequestScreens";

export type DiscoveryProps = {
  owner:string; preview?:boolean; initialStep?:DiscoveryStep; initialSearch?:Partial<SearchDraft>; initialProviderId?:string; initialServiceId?:string;
  providers:Provider[]; resultIds?:string[]; history:CompletedJob[]; savedIds:string[]; art?:Record<string,ProviderArt>; recent:string[];
  loading?:boolean;error?:boolean;historyLoading?:boolean;historyError?:boolean;savedLoading?:boolean;savedError?:boolean;providerLoading?:boolean;providerError?:boolean;savingId?:string|null;
  onRetry:()=>void;onSave:(id:string)=>void;onSearch:(draft:SearchDraft)=>void;onProvider:(id:string)=>void;onRememberArea:(area:string)=>void;
  onLocate:()=>Promise<{label:string;latitude?:number;longitude?:number}>;onClose:()=>void;
  onSend:(draft:RequestDraft)=>Promise<RequestReceipt>;onPending?:(receipt:RequestReceipt)=>void;onMessage?:(receipt:RequestReceipt)=>void;
};
type Overlay = "service" | "date" | "price" | "location" | "filters" | "reviews" | null;
export function DiscoveryJourney(props:DiscoveryProps) {
  const search=useDiscoveryDraft(props.owner,"search",props.initialSearch ?? {});
  const request=useDiscoveryDraft(props.owner,"request",{});
  const [step,setStep]=useState<DiscoveryStep>(props.initialStep ?? "what");
  const [history,setHistory]=useState<DiscoveryStep[]>([]);
  const [providerId,setProviderId]=useState(props.initialProviderId ?? "");
  const [serviceId,setServiceId]=useState(props.initialServiceId ?? "");
  const [order,setOrder]=useState<"default"|"low"|"high">("default");
  const [visibleJobs,setVisibleJobs]=useState(3);
  const [overlay,setOverlay]=useState<Overlay>(null);const [photo,setPhoto]=useState<number|null>(null);
  const [error,setError]=useState<string|undefined>();const [sending,setSending]=useState(false);const [locating,setLocating]=useState(false);
  const [receipt,setReceipt]=useState<RequestReceipt|null>(null);
  const [filterDraft,setFilterDraft]=useState<SearchDraft>(search.draft);
  const alive=useRef(true);const busy=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const provider=props.providers.find(p=>p.id===providerId);
  const service=provider && (activeServices(provider).find(s=>s.id===serviceId) ?? activeServices(provider)[0]);
  const navigate=(next:DiscoveryStep)=> {setError(undefined);setHistory(prev=>[...prev,step]);setStep(next);};
  const back=()=> {setError(undefined);if(history.length){setStep(history[history.length-1]);setHistory(v=>v.slice(0,-1));}else props.onClose();};
  useEffect(()=> {
    const subscription=BackHandler.addEventListener("hardwareBackPress",()=> {
      if(overlay){setOverlay(null);return true;} if(photo!=null){setPhoto(null);return true;}
      if(history.length){setStep(history[history.length-1]);setHistory(v=>v.slice(0,-1));return true;}
      return false;
    });return ()=>subscription.remove();
  },[history,overlay,photo]);
  const runSearch=()=> {
    if(!(search.draft.problem.trim() || search.draft.category) || !search.draft.area.trim() || !futureDay(search.draft.date)) {setError("Choose a service, area and preferred date.");return;}
    props.onRememberArea(search.draft.area);props.onSearch(search.draft);navigate("results");
  };
  const openProvider=(id:string,listingId="")=> {setProviderId(id);setServiceId(listingId);props.onProvider(id);navigate("profile");};
  const beginRequest=(picked:Service)=> {
    if(!provider || !isPublic(provider))return;
    setServiceId(picked.id);
    if(request.draft.providerId!==provider.id || request.draft.serviceId!==picked.id) request.update({providerId:provider.id,serviceId:picked.id,area:search.draft.area,date:search.draft.date,description:search.draft.category ? "" : search.draft.problem});
    navigate("request");
  };
  const locate=async(forRequest=false)=> {
    if(locating)return;setLocating(true);setError(undefined);
    try {const area=await props.onLocate();if(!alive.current)return;if(forRequest)request.update({area:area.label});else if(overlay==="location")setFilterDraft(v=>({...v,area:area.label,latitude:area.latitude,longitude:area.longitude}));else search.update({area:area.label,latitude:area.latitude,longitude:area.longitude});}
    catch {if(alive.current)setError("Couldn’t get your location. You can enter your area manually.");}
    finally {if(alive.current)setLocating(false);}
  };
  const review=()=> {const invalid=requestError(request.draft,provider);if(invalid){setError(invalid);return;}props.onRememberArea(request.draft.area);navigate("review");};
  const send=async()=> {
    if(busy.current)return;const invalid=requestError(request.draft,provider);if(invalid){setError(invalid);return;}
    busy.current=true;setSending(true);setError(undefined);
    try {await request.flush();if(!alive.current)return;const proof=confirmedRequest(await props.onSend(request.draft),request.draft);if(!alive.current)return;setReceipt(proof);navigate("sent");}
    catch(e) {if(alive.current)setError(props.preview ? "The sample send failed. Your draft is kept. Choose Sample in States and retry." : (e instanceof Error && e.message ? e.message + " Your draft is kept." : "Couldn’t send your request. Your draft is kept. Please try again."));}
    finally {busy.current=false;if(alive.current)setSending(false);}
  };
  const showSheet=(next:Overlay)=> {setFilterDraft(search.draft);setOverlay(next);setError(undefined);};
  const apply=()=> {search.update(filterDraft);props.onSearch(filterDraft);props.onRememberArea(filterDraft.area);setOverlay(null);};
  const resultProviders=sortedProviders(props.providers.filter(p=>props.resultIds===undefined || props.resultIds.includes(p.id)),search.draft.category,order);
  const savedProviders=props.savedIds.flatMap(id=>{const p=props.providers.find(p=>p.id===id && isPublic(p));return p ? [p] : [];});
  const jobs=completedJobs(props.history); const label=categories.find(c=>c.key===search.draft.category)?.label ?? (search.draft.problem || "Services");
  let content;
  if(!search.ready || !request.ready) content=<Frame><Status loading empty="" onRetry={props.onRetry}/></Frame>;
  else if(step==="what" || step==="where" || step==="when") content=<SearchScreen step={step} draft={search.draft} onChange={search.update} onStep={navigate} onResults={runSearch} onClose={props.onClose} recent={props.recent} onLocation={()=>void locate()} locating={locating}/>;
  else if(step==="results") content=<Frame topSpacing={19} header={<TopBar onBack={back} onFilter={()=>showSheet("filters")}><Pressable accessibilityRole="button" accessibilityLabel="Edit search selections" onPress={()=>navigate("where")} style={{height:48,borderRadius:12,backgroundColor:Colors.background,alignItems:"center",justifyContent:"center"}}><AppText variant="label" numberOfLines={1}>{search.draft.area}</AppText><AppText variant="captionRegular" color={Colors.textSecondary} numberOfLines={1}>{dateLabel(search.draft.date)} · {label}</AppText></Pressable></TopBar>} subheader={<View style={[ds.row,{justifyContent:"center",gap:10}]}><FilterPill label={categories.find(c=>c.key===search.draft.category)?.label ?? "Service"} onPress={()=>showSheet("service")}/><FilterPill label={dateLabel(search.draft.date)} onPress={()=>showSheet("date")}/></View>} contentStyle={{gap:16,paddingTop:24}}>
    {!props.preview && <AppText variant="captionRegular" color={Colors.textSecondary}>Preferred date only. Providers must confirm availability and fit for your job.</AppText>}
    {props.loading || props.error || !resultProviders.length ? <Status loading={props.loading} error={props.error} empty="No providers match this search. Try another service or area." onRetry={props.onRetry}/> : resultProviders.map(p=><ProviderCard key={p.id} provider={p} service={matchingService(p,search.draft.category)} photo={props.art?.[p.id]?.cover} subtitle={props.art?.[p.id]?.resultSubtitle} approvedCrop={props.preview} saved={props.savedIds.includes(p.id)} saving={!!props.savingId} onSave={()=>props.onSave(p.id)} onOpen={()=>openProvider(p.id)} availability={props.preview ? "Sample · date to confirm" : undefined}/>)}
  </Frame>;
  else if(step==="saved") content=<Frame header={<TopBar onBack={back}/>} contentStyle={{gap:20}}><View style={{gap:8}}><AppText variant="h2">Saved</AppText><AppText variant="body" color={Colors.textSecondary}>Your favourites, ready for the next job.</AppText></View>{props.savedLoading || props.savedError || !savedProviders.length ? <Status loading={props.savedLoading} error={props.savedError} empty="You haven’t saved any available providers yet." onRetry={props.onRetry}/> : savedProviders.map(p=><ProviderCard key={p.id} provider={p} service={matchingService(p,"")} photo={props.art?.[p.id]?.cover} subtitle={props.art?.[p.id]?.resultSubtitle} approvedCrop={props.preview} saved saving={!!props.savingId} onSave={()=>props.onSave(p.id)} onOpen={()=>openProvider(p.id)}/>)}</Frame>;
  else if(step==="again") content=<Frame topSpacing={0} header={<TopBar onBack={back}/>} contentStyle={{gap:12,paddingTop:18}}><View style={{gap:4}}><AppText variant="h1">Book again</AppText><AppText variant="body" color={Colors.textSecondary}>Book a trusted provider from one of your completed jobs.</AppText><AppText variant="captionEmphasis">{props.preview ? "Newest completed first" : "Most recent job date first"}</AppText></View>
    {props.historyLoading || props.historyError || !jobs.length ? <Status loading={props.historyLoading} error={props.historyError} empty="Your completed jobs will appear here." onRetry={props.onRetry}/> : jobs.slice(0,visibleJobs).map(job=> {const p=props.providers.find(p=>p.id===job.provider?.id && isPublic(p));const listing=p && activeServices(p).find(s=>s.id===job.listing?.id);return p ? <Pressable key={job.id} accessibilityRole="button" accessibilityLabel={"Book again with "+p.name} onPress={()=>openProvider(p.id,job.listing!.id)} style={[ds.serviceCard,{paddingHorizontal:14,paddingVertical:12,gap:12,minHeight:152,borderRadius:16,alignItems:"flex-start"}]}><Photo source={props.art?.[p.id]?.bookAgainCover ?? props.art?.[p.id]?.cover ?? p.banner} style={{width:104,height:128,borderRadius:12}}/><View style={[ds.flex,{gap:2}]}><AppText variant="label">{p.name}</AppText><AppText variant="captionMedium" color={Colors.textSecondary}>{job.listing?.title || listing?.title}</AppText><View style={[ds.row,{gap:4}]}><AppText variant="captionRelaxed" color={Colors.textSecondary}>Verified</AppText>{p.rating!=null && <><Icon name="star"/><AppText variant="captionRelaxed" color={Colors.textSecondary}>{p.rating.toFixed(1)}</AppText></>}</View><AppText variant="captionEmphasis">Completed · {dateLabel(job.bookingDate?.slice(0,10) || "")}</AppText>{!listing && <AppText variant="captionRegular" color={Colors.textSecondary}>Choose a current service</AppText>}</View></Pressable> : <Callout key={job.id} title={job.listing?.title || "Previous job"} message="This provider is no longer available for new requests."/>;})}
    {jobs.length>visibleJobs && <Button title="See more" variant="outline" size="compact" style={{borderColor:Colors.border,borderRadius:16}} onPress={()=>setVisibleJobs(v=>v+3)}/>}
  </Frame>;
  else if(step==="profile" || step==="request" || step==="review") content=props.providerLoading || props.providerError || !provider || !isPublic(provider) ? <Frame header={<TopBar onBack={back}/>}><Status loading={props.providerLoading} error={props.providerError} empty="This provider is not currently available for requests." onRetry={props.onRetry}/></Frame> : step==="profile" ? <>
    {!!serviceId && !activeServices(provider).some(s=>s.id===serviceId) && <Callout message="Your previous service is no longer offered. Choose a current service."/>}
    <ProfileScreen provider={provider} art={props.art?.[provider.id]} saved={props.savedIds.includes(provider.id)} saving={props.savingId===provider.id} onSave={()=>props.onSave(provider.id)} onBack={back} onRequest={beginRequest} onReviews={()=>setOverlay("reviews")} onPhoto={setPhoto} selectedServiceId={serviceId}/>
  </> : !service ? <Frame header={<TopBar onBack={back}/>}><AppText variant="body">Choose a current service first.</AppText></Frame> : step==="request" ? <RequestScreen provider={provider} service={service} photo={props.art?.[provider.id]?.cover} draft={request.draft} onChange={request.update} onReview={review} onBack={back} onClose={props.onClose} recent={props.recent} onLocation={()=>void locate(true)} locating={locating} error={error}/> : <ReviewScreen provider={provider} service={service} photo={props.art?.[provider.id]?.cover} draft={request.draft} onChange={request.update} onSend={()=>void send()} onBack={back} onClose={props.onClose} sending={sending} error={error} live={!props.preview}/>;
  else if(step==="sent" && receipt && provider) content=<SentScreen provider={provider} draft={request.draft} onPending={()=>props.onPending ? props.onPending(receipt) : navigate("pending")} onMessage={()=>props.onMessage ? props.onMessage(receipt) : navigate("message")}/>;
  else if((step==="pending" || step==="message") && props.preview && receipt && provider) content=<Frame header={<TopBar onBack={back}/>}><AppText variant="h2">{step==="pending" ? "Pending request" : "Message provider"}</AppText><Callout title="Sample request" message={step==="pending" ? "This sample record exists only in this local preview. The Bookings redesign and live provider responses come next." : "Messaging will connect after the backend stores the request and returns a conversation ID. This preview sends no messages."}/><AppText variant="h3">{provider.name}</AppText>{service && <ServiceCard service={service} photo={props.art?.[provider.id]?.cover}/>}<RequestDetails draft={request.draft}/><AppText variant="body">{request.draft.description}</AppText></Frame>;
  else content=<Frame header={<TopBar onBack={back}/>}><AppText variant="body">Prepare a request to continue.</AppText></Frame>;
  return <View style={{flex:1,backgroundColor:Colors.surface}}>
    {content}
    {(search.saveError || request.saveError) && <Callout tone="warning" message="Your draft is kept in this screen, but couldn’t be saved on this device. Please keep the screen open and retry."/>}
    {!!error && step!=="request" && step!=="review" && <Callout tone="error" message={error}/>}
    {photo!=null && provider && <PhotoViewer provider={provider} art={props.art?.[provider.id]} start={photo} onClose={()=>setPhoto(null)}/>}
    {overlay==="reviews" && provider && <ReviewsSheet provider={provider} onClose={()=>setOverlay(null)}/>}
    {overlay && overlay!=="reviews" && <Sheet title={overlay==="service" ? "Choose a service" : overlay==="date" ? "Choose a starting date" : overlay==="price" ? "Sort by" : overlay==="location" ? "Sort by location" : "Search filters"} minimumHeight={overlay==="price" ? 345 : undefined} topPadding={overlay==="price" ? 34 : 28} bodyPadding={overlay==="price" ? 30 : 10} description={overlay==="service" ? "Search for another service or describe what you need." : overlay==="date" ? "Choose your preferred date. The provider will confirm availability." : overlay==="price" ? "Choose how provider results are ordered." : undefined} onClose={()=>setOverlay(null)}>
      {overlay==="filters" ? <><Button title="Service" variant="outline" onPress={()=>showSheet("service")}/><Button title="Starting date" variant="outline" onPress={()=>showSheet("date")}/><Button title="Price" variant="outline" onPress={()=>showSheet("price")}/><Button title="Location" variant="outline" onPress={()=>showSheet("location")}/></> : overlay==="service" ? <><WhatField value={filterDraft.problem} category={filterDraft.category} onChange={problem=>setFilterDraft(v=>({...v,problem,category:""}))} onCategory={(category,problem)=>setFilterDraft(v=>({...v,category,problem}))}/><Button title="Apply" disabled={!filterDraft.problem.trim() && !filterDraft.category} onPress={apply}/></> : overlay==="date" ? <><Calendar value={filterDraft.date} onChange={date=>setFilterDraft(v=>({...v,date}))}/><Button title="Apply" disabled={!futureDay(filterDraft.date)} onPress={apply}/></> : overlay==="location" ? <><WhereField value={filterDraft.area} onChange={area=>setFilterDraft(v=>({...v,area,latitude:undefined,longitude:undefined}))} recent={props.recent} onChoose={area=>setFilterDraft(v=>({...v,area,latitude:undefined,longitude:undefined}))} onLocation={()=>void locate()} locating={locating}/><Button title="Apply" disabled={!filterDraft.area.trim()} onPress={apply}/></> : <>{[{value:"low" as const,label:"Price: lowest first",description:"Lower starting prices first."},{value:"high" as const,label:"Price: highest first",description:"Higher starting prices first."}].map(option=><Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{checked:order===option.value}} onPress={()=>{setOrder(option.value);setOverlay(null);}} style={[ds.serviceCard,{minHeight:68,gap:12,borderColor:order===option.value?Colors.selected:Colors.borderStrong}]}><Icon name={order===option.value?"selected":"radio"}/><View style={ds.flex}><AppText variant="label">{option.label}</AppText><AppText variant="caption" color={Colors.textSecondary}>{option.description}</AppText></View></Pressable>)}</>}
    </Sheet>}
  </View>;
}
function FilterPill({label,onPress}:{label:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label+" filter"} onPress={onPress} style={{width:144,maxWidth:"48%",height:44,borderRadius:12,borderWidth:1,borderColor:Colors.border,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><AppText variant="body">{label}</AppText><View style={{width:11,height:6,alignItems:"center",justifyContent:"center"}}><Image source={require("@/assets/discovery/4f705.svg")} style={{width:6,height:11,transform:[{rotate:"-90deg"}]}}/></View></Pressable>;
}

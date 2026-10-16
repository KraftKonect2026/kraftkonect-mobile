import { ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/Button";
import { AppText } from "@/components/AppText";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { Frame, Sheet, TopBar } from "@/components/discovery/Parts";
import { Heading, bs } from "@/components/bookings/Parts";
import { DayChips } from "@/components/onboarding/ChoiceCards";
import { Service } from "@/lib/discovery/model";
import { Availability, availabilityError, availabilityLabel, ServiceDraft } from "@/lib/provider/catalog";
import { liveServiceDraft, liveServiceDraftError, ownedCatalogService, ProviderCatalogRead } from "@/lib/provider/liveCatalog";
import { AvailabilityOption, ManagementStep, ServiceDeleteSheet, ServiceDetailScreen, ServiceEditorScreen, ServicesScreen } from "./ProviderManagementScreens";
import Colors from "@/constants/colors";

type CatalogProps={
 catalog?:ProviderCatalogRead;step:ManagementStep;serviceId?:string;loading:boolean;error?:string;onRetry:()=>void;onBack:()=>void;onGo:(step:ManagementStep,id?:string)=>void;onSetup:()=>void;onUnavailable:(action:string)=>void;preview?:boolean;actions?:CatalogActions;
};
export type CatalogActions={uploadPhoto:()=>Promise<string|undefined>;save:(id:string|undefined,draft:ServiceDraft)=>Promise<string>;remove:(id:string)=>Promise<void>;busy:boolean;error?:string};
export function LiveCatalogContent(props:CatalogProps){
  const stale=!!props.catalog&&(props.loading||!!props.error);
  return <View style={{flex:1}}>{stale&&<View style={{paddingHorizontal:24,paddingTop:12,gap:8}}><Callout tone={props.error?"error":"neutral"} message={props.error?"Couldn’t refresh services. Last loaded records and your draft are kept.":"Refreshing your saved services. Your draft is kept."}/>{props.error&&<Button title="Try again" size="compact" variant="outline" onPress={props.onRetry}/>}</View>}<CatalogBody {...props} loading={props.loading&&!props.catalog} error={props.catalog?undefined:props.error}/></View>;
}
function CatalogBody({catalog,step,serviceId,loading,error,onRetry,onBack,onGo,onSetup,onUnavailable,preview=false,actions}:CatalogProps){
  const frame=(content:ReactNode)=><Frame safeAreaTop={!preview} header={<TopBar onBack={onBack}/>} contentStyle={{paddingTop:12,gap:16}}><Heading title="My services"/>{content}</Frame>;
  if(loading)return frame(<LogoLoader label="Loading services"/>);
  if(error||!catalog)return frame(<><Callout tone="error" title="Services unavailable" message={error??"Your saved services could not be loaded. They have not been removed."}/><Button title="Try again" onPress={onRetry}/></>);
  if(catalog.setupNeeded)return frame(<><Callout title="Provider setup" message="Complete your provider setup to manage services."/><Button title="View provider setup" onPress={onSetup}/></>);
  let service:Service|undefined;
  if(step==="service"||step==="edit"){
    try{service=ownedCatalogService(catalog,serviceId);}catch{return frame(<><Callout title="Service unavailable" message="Choose a saved service from your account’s My services list."/><Button title="My services" onPress={()=>onGo("services")}/></>);}
  }
  if(step==="edit"&&service?.currency!=="NGN")return frame(<><Callout title="Editing unavailable" message="The starting-price editor cannot confirm this service’s currency. Your saved service is kept."/><Button title="View service" onPress={()=>onGo("service",service!.id)}/></>);
  if(step==="create"||step==="edit")return <OwnedServiceForm key={catalog.ownerId+":"+(service?.id??"new")} service={service} preview={preview} onBack={()=>onGo(service?"service":"services",service?.id)} onUnavailable={onUnavailable} actions={actions} onSaved={id=>onGo("service",id)} onRemoved={()=>onGo("services")}/>;
  if(step==="service")return <ServiceDetailScreen service={service!} preview={preview} onBack={()=>onGo("services")} onEdit={()=>onGo("edit",service!.id)}/>;
  return <ServicesScreen record={{services:catalog.services??[]}} includeInactive preview={preview} onBack={onBack} onOpen={service=>onGo("service",service.id)} onCreate={()=>onGo("create")}/>;
}

function OwnedServiceForm({service,preview,onBack,onUnavailable,actions,onSaved,onRemoved}:{service?:Service;preview:boolean;onBack:()=>void;onUnavailable:(action:string)=>void;actions?:CatalogActions;onSaved:(id:string)=>void;onRemoved:()=>void}){
  const [draft,setDraft]=useState<ServiceDraft>(()=>liveServiceDraft(service)),[dialog,setDialog]=useState<"delete"|"discard">();
  const back=()=>{if(JSON.stringify(draft)!==JSON.stringify(liveServiceDraft(service)))setDialog("discard");else onBack();};
  return <><ServiceEditorScreen preview={preview} draft={draft} validateDraft={liveServiceDraftError} onDraft={patch=>setDraft(value=>({...value,...patch}))} onBack={back} onPhoto={()=>actions?void actions.uploadPhoto().then(url=>{if(url)setDraft(value=>({...value,photos:[url]}));}).catch(()=>undefined):onUnavailable("Service photo upload")} onSave={()=>actions?void actions.save(service?.id,draft).then(onSaved).catch(()=>undefined):onUnavailable(service?"Service update":"Service publication")} onDelete={()=>setDialog("delete")} editing={!!service} ready busy={!!actions?.busy} error={actions?.error}/>{dialog==="delete"&&<ServiceDeleteSheet busy={!!actions?.busy} error={actions?.error} onClose={()=>setDialog(undefined)} onDelete={()=>{if(actions&&service){void actions.remove(service.id).then(()=>{setDialog(undefined);onRemoved();}).catch(()=>undefined);}else{setDialog(undefined);onUnavailable("Service removal");}}}/>}{dialog==="discard"&&<Sheet title="Discard changes?" onClose={()=>setDialog(undefined)}><AppText variant="body">Your saved service stays on your account. Leave this draft?</AppText><Button title="Discard changes" onPress={onBack}/><Button title="Keep editing" variant="outline" onPress={()=>setDialog(undefined)}/></Sheet>}</>;
}

export function LiveAvailabilityContent({onBack,onUnavailable,preview=false,saved,onSave,busy=false,error,loadFailed}:{onBack:()=>void;onUnavailable:(action:string)=>void;preview?:boolean;saved?:Availability;onSave?:(value:Availability)=>void;busy?:boolean;error?:string;loadFailed?:string}){
  const [draft,setDraft]=useState<Availability|undefined>(saved);
  useEffect(()=>{if(saved)setDraft(saved);},[saved?.available,saved?.days.join(",")]);
  const live=!!onSave;
  return <Frame safeAreaTop={!preview} header={<TopBar onBack={onBack}/>} contentStyle={{paddingTop:12,gap:16}} footer={<View style={bs.actions}><AppText variant="captionRegular" color={Colors.textSecondary}>Your existing bookings won’t be affected.</AppText><Button title="Save availability" loading={busy} disabled={busy||!draft||!!availabilityError(draft)} onPress={()=>onSave?onSave(draft!):onUnavailable("Weekly availability")}/><Button title="Cancel" variant="outline" size="compact" onPress={onBack}/></View>}><Heading gap={4} title="Availability" subtitle="Choose when you’re open to new requests."/>{live?(loadFailed?<Callout tone="error" title="Saved availability unavailable" message={loadFailed}/>:!saved?<LogoLoader label="Loading your availability"/>:null):<Callout title="Saved availability unavailable" message="Your weekly settings could not be loaded. You can prepare a selection, but it has not been saved."/>}{error&&<Callout tone="error" message={error}/>}{draft&&<AppText variant="label" color={Colors.textSecondary}>{live&&saved&&JSON.stringify(saved)===JSON.stringify(draft)?"Saved":"Not saved"} · {draft.available&&!draft.days.length?"Choose working days":availabilityLabel(draft)}</AppText>}<View accessibilityRole="radiogroup" accessibilityLabel="Availability" style={{gap:16}}>{[true,false].map(value=><AvailabilityOption key={String(value)} value={value} selected={draft?.available===value} disabled={false} onPress={()=>setDraft(previous=>({available:value,days:previous?.days??[]}))}/>)}</View><View style={{gap:10,opacity:draft?.available?1:0.5}}><AppText variant="labelSmall">Days you accept requests</AppText><DayChips days={draft?.days??[]} disabled={!draft?.available} onChange={days=>setDraft(previous=>({available:previous?.available??true,days}))}/><AppText variant="captionRegular" color={Colors.textSecondary}>{draft?.available?draft.days.length?"Choose your working days.":"Choose at least one day":"Select Available to choose working days."}</AppText></View></Frame>;
}

import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Callout } from "@/components/Callout";
import Colors from "@/constants/colors";
import { dateLabel, Provider, RequestDraft, Service, startingPrice } from "@/lib/discovery/model";
import { Calendar, WhereField } from "./SearchFields";
import { ds, Frame, Icon, PhotoSource, PriceAction, ServiceCard, SummaryRow, TopBar } from "./Parts";

export function JobNote({ value,onChange,label }: {value:string;onChange:(v:string)=>void;label?:string}) {
  return <Input label={label} accessibilityLabel="Job description" multiline maxLength={1000} value={value} onChangeText={onChange} placeholder="Describe the problem and what you need help with…" style={{minHeight:84}} inputStyle={{minHeight:58}}/>;
}
export function RequestDetails({ draft }: {draft:RequestDraft}) {
  return <View style={{borderWidth:1,borderColor:Colors.border,borderRadius:14,paddingHorizontal:14,paddingVertical:16,gap:12}}>{[{label:"Date",value:dateLabel(draft.date)},{label:"Area",value:draft.area}].map(row=><View key={row.label} style={[ds.row,{justifyContent:"space-between"}]}><AppText variant="captionRegular" color={Colors.textSecondary}>{row.label}</AppText><AppText variant="label" style={{flex:1,textAlign:"right"}}>{row.value}</AppText></View>)}</View>;
}
export function RequestScreen({ provider,service,photo,draft,onChange,onReview,onBack,onClose,recent,onLocation,locating,error }: {provider:Provider;service:Service;photo?:PhotoSource;draft:RequestDraft;onChange:(v:Partial<RequestDraft>)=>void;onReview:()=>void;onBack:()=>void;onClose:()=>void;recent:string[];onLocation:()=>void;locating?:boolean;error?:string}) {
  const [where,setWhere]=useState(false); const first=provider.name.split(" ")[0];
  return <Frame header={<TopBar onBack={onBack} onClose={onClose}/>} contentStyle={{gap:16}} footer={<PriceAction service={service} title="Get quote" onPress={onReview}/> }>
    <ServiceCard service={service} photo={photo}/>
    <View style={[ds.panel,{paddingHorizontal:16,gap:8,marginTop:20}]}><AppText variant="h2">Get a quote</AppText><AppText variant="body" color={Colors.textSecondary}>Choose a preferred date. {first} can confirm or suggest another.</AppText><Calendar value={draft.date} onChange={date=>onChange({date})} blocked={provider.blockedDates}/></View>
    {where ? <View style={ds.panel}><Pressable accessibilityRole="button" accessibilityLabel="Collapse request area" onPress={()=>setWhere(false)} style={{minHeight:44,justifyContent:"center"}}><AppText variant="h2">Where is the job?</AppText></Pressable><WhereField value={draft.area} onChange={area=>onChange({area})} recent={recent} onChoose={area=>{onChange({area});setWhere(false);}} onLocation={onLocation} locating={locating}/></View> : <SummaryRow label="Where" value={draft.area || "Add location"} onPress={()=>setWhere(true)}/>}
    <View style={{paddingHorizontal:14,paddingVertical:12,borderWidth:1,borderColor:Colors.border,borderRadius:14}}><JobNote label={"Tell "+first+" what you need"} value={draft.description} onChange={description=>onChange({description})}/></View>
    {!!error && <Callout title="Check your request" message={error} tone="error"/>}
  </Frame>;
}
export function ReviewScreen({ provider,service,photo,draft,onChange,onSend,onBack,onClose,sending,error,live }: {provider:Provider;service:Service;photo?:PhotoSource;draft:RequestDraft;onChange:(v:Partial<RequestDraft>)=>void;onSend:()=>void;onBack:()=>void;onClose:()=>void;sending?:boolean;error?:string;live:boolean}) {
  const first=provider.name.split(" ")[0];
  return <Frame header={<TopBar onBack={onBack} onClose={onClose}/>} contentStyle={{gap:14,paddingTop:24}} footer={<Button title={"Send request to "+first} onPress={onSend} loading={sending}/> }>
    <View style={{gap:8}}><AppText variant="h1">Review your request</AppText><AppText variant="bodyLarge" color={Colors.textSecondary}>This request goes directly to {provider.name}.</AppText></View>
    <View style={{marginTop:10}}><ServiceCard service={service} photo={photo} showPrice={false}/></View><RequestDetails draft={draft}/><View style={{marginTop:4}}><JobNote value={draft.description} onChange={description=>onChange({description})}/></View>
    <PriceNote service={service} first={first}/>
    {live && <Callout title="Submission unavailable" message="The request service is awaiting the backend connection. You can prepare this request locally; sending will keep your draft for retry."/>}
    {!!error && <Callout title="Request not sent" message={error} tone="error"/>}
  </Frame>;
}
function PriceNote({ service,first }: {service:Service;first:string}) {
  return <View style={{paddingHorizontal:14,paddingVertical:12,gap:6}}><AppText variant="label">Starting price · {startingPrice(service)}</AppText><AppText variant="captionRegular" color={Colors.textSecondary}>{first} will review the request and send a rough estimate, inspection deposit and proposed appointment.</AppText></View>;
}
export function SentScreen({ provider,draft,onPending,onMessage }: {provider:Provider;draft:RequestDraft;onPending:()=>void;onMessage:()=>void}) {
  return <Frame contentStyle={{paddingTop:32,gap:20}} footer={<><Button title="View pending request" onPress={onPending}/><Button title="Message provider" variant="outline" onPress={onMessage}/></>}>
    <View style={{borderRadius:24,backgroundColor:Colors.background,paddingHorizontal:24,paddingVertical:20,gap:12,alignItems:"center"}}><View style={{width:64,height:64,borderRadius:32,backgroundColor:Colors.primary,alignItems:"center",justifyContent:"center"}}><Icon name="check"/></View><AppText variant="labelLarge" style={{textAlign:"center"}}>Request sent to {provider.name.split(" ")[0]}</AppText><AppText variant="body" color={Colors.textSecondary} style={{textAlign:"center"}}>Your request is pending. The provider will review it and reply with inspection details, or decline the request.</AppText></View>
    <RequestDetails draft={draft}/><Callout title="Track it in Bookings" message="You’ll find this request under Pending bookings."/><Callout title="Payment comes later" message="Nothing has been charged. Review the provider’s response, then pay the initial deposit to confirm the inspection. Repair work is booked after the final quote."/>
  </Frame>;
}

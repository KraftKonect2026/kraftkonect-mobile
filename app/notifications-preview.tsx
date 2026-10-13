import { useEffect, useRef, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { DesignIcon } from "@/components/DesignIcon";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Frame, Sheet, Status, TopBar } from "@/components/discovery/Parts";
import { BookingIcon, Heading } from "@/components/bookings/Parts";
import { AccountIcon } from "@/components/account/AccountParts";
import { SelectionChip } from "@/components/SelectionChip";
import { useSampleInspection } from "@/lib/preview/inspectionStore";
import { markNotificationsRead, useNotificationMarkers } from "@/lib/preview/notificationStore";
import { accountNotificationsFor, LocalNotification, notificationGroup, notificationsFor, sortNotifications, supportNotificationsFor } from "@/lib/messaging/notifications";
import { useSampleAccount } from "@/lib/preview/accountStore";
import { commandAccountSupport, readAccountSupport, useAccountSupport } from "@/lib/preview/accountSupportStore";
import Colors from "@/constants/colors";
import { BookingRole } from "@/lib/bookings/model";

export default function NotificationsPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <NotificationsPreview/>;}
function NotificationsPreview(){
 const router=useRouter(),params=useLocalSearchParams<{mode?:string}>(),role:BookingRole=params.mode==="provider"?"provider":"customer";
 const {record,error:loadError,refresh}=useSampleInspection(),markers=useNotificationMarkers(role);
 const account=useSampleAccount(),support=useAccountSupport();
 const [scenario,setScenario]=useState("Sample"),[states,setStates]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string>();const lock=useRef(false);
 const alive=useRef(true),context=useRef(role);context.current=role;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const rows=record&&account.record&&support.record&&scenario!=="Empty"?sortNotifications([...notificationsFor(record,role,markers.ids),...accountNotificationsFor(account.record,account.record.id,markers.ids),...supportNotificationsFor(support.record,account.record.id,markers.ids)]):[];
 const read=async(ids:string[],destination?:LocalNotification["destination"])=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError(undefined);
  try{
   if(scenario==="Save failure")throw new Error("Sample read update failed. Your notification history is kept. Choose Sample, then retry.");
   await markNotificationsRead(role,ids);
   if(!alive.current||context.current!==role)return;
   if(destination?.type==="booking")router.push({pathname:"/booking-preview",params:{mode:role,step:destination.step,caseId:destination.caseId}});
   else if(destination?.type==="chat")router.push({pathname:"/messages-preview",params:{mode:role,conversationId:destination.conversationId}});
   else if(destination?.type==="finance")router.push("/finance-preview");
   else if(destination?.type==="account")router.push({pathname:"/account-preview",params:{mode:role,step:destination.step}});
   else if(destination?.type==="support")router.push({pathname:"/support-preview",params:{mode:role,conversationId:destination.conversationId}});
  }catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t mark notifications read.");}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 const explore=()=>router.push(role==="provider"?{pathname:"/booking-preview",params:{mode:role}}:"/discovery-preview");
 const simulateSupportReply=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setStates(false);setError(undefined);
  try{const current=await readAccountSupport();await commandAccountSupport(current.revision,"sample-support-feed-reply-"+Date.now(),{type:"message",conversationId:current.id,text:"This is a fictional support follow-up for your account.",at:new Date().toISOString(),incoming:true});}
  catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t save this fictional support reply.");}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><View style={{minHeight:44,paddingLeft:16,paddingRight:8,flexDirection:"row",alignItems:"center",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>LOCAL NOTIFICATIONS · {role} · No push alerts</AppText><Button title="States" size="compact" variant="subtle" onPress={()=>setStates(true)}/></View><Frame safeAreaTop={false} header={<TopBar onBack={()=>{if(router.canGoBack())router.back();else router.replace({pathname:"/app-preview",params:{mode:role}});}}/>} contentStyle={{paddingTop:12,gap:20}}>
 <Heading title="Notifications" subtitle={role==="provider"?"Updates on requests, jobs and payments.":"Updates about your requests, bookings and payments."}/>
 {(error||markers.error)&&<Callout tone="error" message={error??markers.error??""}/>}
 {loadError||account.error||support.error||scenario==="Error"?<Status error empty="" onRetry={()=>{setScenario("Sample");void refresh();void account.refresh();void support.refresh();void markers.refresh();}}/>:!record||!account.record||!support.record||scenario==="Loading"?<Status loading empty="" onRetry={()=>setScenario("Sample")}/>:!rows.length?<View style={{padding:24,gap:16,alignItems:"center",borderRadius:16}}><View style={{width:56,height:56,borderRadius:999,backgroundColor:Colors.primarySoft,alignItems:"center",justifyContent:"center"}}><DesignIcon name="bell"/></View><View style={{gap:8,alignSelf:"stretch"}}><AppText variant="h3" style={{textAlign:"center"}}>No notifications yet</AppText><AppText variant="body" color={Colors.textSecondary} style={{textAlign:"center"}}>Your quote, booking and payment updates will appear here.</AppText></View><Button title={role==="provider"?"View jobs":"Explore services"} onPress={explore} style={{alignSelf:"stretch"}}/></View>: ["Today","Earlier"].map(group=>{const items=rows.filter(n=>notificationGroup(n.at)===group);if(!items.length)return null;return <View key={group} style={{gap:8}}><View style={{flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="label" color={Colors.textSecondary} style={{flex:1}}>{group}</AppText></View>{items.map(n=><Pressable key={n.id} accessibilityRole="button" accessibilityLabel={n.title+(n.read?", Read":", New")} accessibilityState={{disabled:busy}} disabled={busy} onPress={()=>void read([n.id],n.destination)} style={{padding:16,gap:12,borderRadius:16,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.surface,flexDirection:"row",alignItems:"flex-start"}}><View style={{width:36,height:36,borderRadius:12,backgroundColor:n.read?Colors.background:Colors.surface,alignItems:"center",justifyContent:"center"}}>{n.icon==="message"?<Image source={require("@/assets/messaging/bf893.svg")} style={{width:24,height:24}} contentFit="contain" accessible={false}/>:n.icon==="calendar"?<BookingIcon name="calendar"/>:n.icon==="check"?<BookingIcon name="done"/>:<AccountIcon name={n.icon==="payment"?"payment":"shield"}/>}</View><View style={{flex:1,minWidth:0,gap:4}}><AppText variant="labelSupport">{n.title}</AppText><AppText variant="bodySmall" color={Colors.textSecondary}>{n.message}</AppText><View style={{flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="captionRegular" color={Colors.textSecondary} style={{flex:1}}>{n.at?new Date(n.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Date unavailable"}</AppText>{!n.read&&<AppText variant="captionEmphasis" color={Colors.primary}>New!</AppText>}</View></View></Pressable>)}</View>;})}
 </Frame>{states&&<Sheet title="Local notification states" showClose onClose={()=>setStates(false)}><Callout message="Items come from saved sample events. Marking them read keeps the history; push preferences do not remove it."/>{["Sample","Empty","Loading","Error","Save failure"].map(s=><SelectionChip key={s} label={s} selected={s===scenario} onPress={()=>{setScenario(s);setStates(false);setError(undefined);}}/>)}<Button title="Mark all read" variant="subtle" size="compact" disabled={busy||rows.every(n=>n.read)} onPress={()=>{setStates(false);void read(rows.map(n=>n.id));}}/><Button title="Simulate account support reply" variant="outline" disabled={busy||!account.record?.signedIn} onPress={()=>void simulateSupportReply()}/><Button title={role==="customer"?"View provider feed":"View customer feed"} variant="outline" onPress={()=>{router.setParams({mode:role==="customer"?"provider":"customer"});setStates(false);}}/></Sheet>}</View>;
}

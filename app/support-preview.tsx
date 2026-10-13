import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Frame, IconButton, Sheet, Status } from "@/components/discovery/Parts";
import { ChatMessages, Composer, MessageAvatar } from "@/components/messaging/MessagingParts";
import { SelectionChip } from "@/components/SelectionChip";
import { accountSupportConversation, accountSupportDraft, accountSupportId, AccountSupportPhoto, supportReadMessage, validAccountSupportPhoto } from "@/lib/messaging/accountSupport";
import { commandAccountSupport, readAccountSupport, saveAccountSupportDraft, useAccountSupport } from "@/lib/preview/accountSupportStore";
import { useSampleAccount } from "@/lib/preview/accountStore";
import { secureStorage } from "@/lib/storage";
import { AppMode } from "@/lib/appMode";
import { sampleAccountId } from "@/lib/account/model";
import Colors from "@/constants/colors";

export default function SupportPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <SupportPreview/>;}
function SupportPreview() {
  const router=useRouter(),params=useLocalSearchParams<{mode?:string;conversationId?:string}>();
  const mode:AppMode=params.mode==="provider"?"provider":"customer";
  const account=useSampleAccount(),support=useAccountSupport(),record=support.record;
  const owned=!!account.record&&!!record&&record.ownerId===account.record.id&&(!params.conversationId||params.conversationId===record.id);
  const allowed=owned&&account.record?.signedIn&&!account.record.deletion;
  const conversation=allowed?accountSupportConversation(record!,account.record!.id,mode):undefined;
  const [text,setText]=useState(""),[photo,setPhoto]=useState<AccountSupportPhoto>(),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string>();
  const [scenario,setScenario]=useState("Sample"),[dialog,setDialog]=useState<"states"|"attach"|"photo">();
  const alive=useRef(true),lock=useRef(false),readLock=useRef(false),intent=useRef<{signature:string;key:string}|undefined>(undefined);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{let active=true;secureStorage.getItem("kk.step9.account-support-draft.v1").then(raw=>{
    if(!active)return;try{const d=JSON.parse(raw??"{}"),text=typeof d.text==="string"?d.text.slice(0,1000):"",photo=validAccountSupportPhoto(d.photo,sampleAccountId,accountSupportId)?d.photo:undefined;setText(text);setPhoto(photo);if(typeof d.intentKey==="string"){const saved=accountSupportDraft(text,photo,d.intentKey);intent.current={key:saved.intentKey!,signature:JSON.stringify([accountSupportId,text,photo])};}}catch{}setReady(true);
  }).catch(()=>{if(active){setReady(true);setError("Couldn’t restore the local support draft.");}});return()=>{active=false;};},[]);
  useEffect(()=>{if(ready)void saveAccountSupportDraft(text,photo,intent.current?.signature===JSON.stringify([accountSupportId,text,photo])?intent.current.key:undefined).catch(()=>{if(alive.current)setError("Couldn’t save the draft. Keep this screen open and retry.");});},[ready,text,photo]);
  const markRead=useCallback(async()=>{
    if(!allowed||!record?.messages.length||readLock.current)return;
    const last=record.messages.at(-1)!;if(record.readThrough===last.id)return;readLock.current=true;
    try{const current=await readAccountSupport();await commandAccountSupport(current.revision,"sample-support-read-"+last.id,{type:"read",conversationId:current.id,throughId:last.id});}
    catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t mark support messages read.");}finally{readLock.current=false;}
  },[allowed,record]);
  useFocusEffect(useCallback(()=>{void markRead();},[markRead]));
  const send=async()=>{
    if(!allowed||!record||lock.current||!ready)return;
    const signature=JSON.stringify([record.id,text,photo]);
    if(intent.current?.signature!==signature)intent.current={signature,key:"sample-account-support-message-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)};
    lock.current=true;setBusy(true);setError(undefined);
    try{
      await saveAccountSupportDraft(text,photo,intent.current.key);
      if(scenario==="Save failure")throw new Error("Sample send failed. Your draft is kept. Choose Sample in States, then retry Send.");
      const current=await readAccountSupport();
      await commandAccountSupport(current.revision,intent.current.key,{type:"message",conversationId:current.id,text,attachments:photo?[photo]:undefined,at:new Date().toISOString()});
      if(alive.current){setText("");setPhoto(undefined);intent.current=undefined;}
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t send. Your draft is kept.");}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  const simulate=async(read=false)=>{
    if(!allowed||lock.current)return;lock.current=true;setBusy(true);setDialog(undefined);
    try{const current=await readAccountSupport();const last=current.messages.at(-1);
      if(read){if(!last)throw new Error("Send a fictional message first.");await commandAccountSupport(current.revision,"sample-support-ack-"+last.id,{type:"read",conversationId:current.id,throughId:last.id,bySupport:true});}
      else await commandAccountSupport(current.revision,"sample-support-reply-"+Date.now(),{type:"message",conversationId:current.id,text:"Thanks for your message. What would you like help with?",at:new Date().toISOString(),incoming:true});
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t save this fictional outcome.");}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  const back=()=>{if(busy)return;if(router.canGoBack())router.back();else router.replace({pathname:"/app-preview",params:{mode,tab:"account"}});};
  const header=<><IconButton name="back" label="Back" onPress={back}/><MessageAvatar name="KraftKonect support" support small/><View style={{flex:1,minWidth:0,gap:2}}><View style={{flexDirection:"row",gap:4,alignItems:"center"}}><AppText variant="labelSupport" style={{flexShrink:1}}>KraftKonect support</AppText><Image source={require("@/assets/bookings/cd3d1.svg")} style={{width:16,height:16}} contentFit="contain" accessible={false}/></View><AppText variant="bodySmall" color={Colors.textSecondary}>Account help</AppText></View></>;
  const projectedPhoto=photo?{id:photo.id,conversationId:photo.conversationId,owner:mode,name:photo.name,uri:photo.uri,mime:photo.mime,status:photo.status}:undefined;
  return <View style={{flex:1,backgroundColor:Colors.surface,width:"100%",maxWidth:600,alignSelf:"center"}}>
    <View style={{minHeight:44,paddingLeft:16,paddingRight:8,flexDirection:"row",gap:8,alignItems:"center",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>LOCAL SUPPORT · Same fictional account in both modes · No external messages</AppText><Button title="States" size="compact" variant="subtle" disabled={busy} onPress={()=>setDialog("states")}/></View>
    <Frame safeAreaTop={false} header={header} headerGap={12} headerHeight={56} footerStyle={{paddingTop:12,borderTopWidth:0}} contentStyle={{paddingTop:12,gap:20}} footer={conversation&&ready&&scenario!=="Loading"&&scenario!=="Error"?<Composer text={text} onText={setText} photo={projectedPhoto} onAttach={()=>setDialog("attach")} onRemove={()=>setPhoto(undefined)} onSend={()=>void send()} busy={busy} error={error}/>:undefined}>
      {account.error||support.error||scenario==="Error"?<Status error empty="" onRetry={()=>{setScenario("Sample");void account.refresh();void support.refresh();}}/>:!account.record||!record||!ready||scenario==="Loading"?<Status loading empty="" onRetry={()=>setScenario("Sample")}/>:!conversation?<><Callout tone="error" title="Support conversation unavailable" message={owned?"Verify account access before viewing private support messages. Recovery and deletion help use their authorized support path.":"This conversation belongs to another account."}/><Button title="Back to account" onPress={()=>router.replace({pathname:"/app-preview",params:{mode,tab:"account"}})}/></>:<><ChatMessages conversation={conversation} role={mode} readByOther={id=>supportReadMessage(record,account.record!.id,id)} onPhoto={()=>setDialog("photo")}/><AppText variant="captionRegular" color={Colors.textSecondary}>Never share a PIN, password or full card number.</AppText></>}
    </Frame>
    {dialog==="states"&&<Sheet title="Local support states" showClose onClose={()=>setDialog(undefined)}><Callout message="This conversation belongs to the same fictional account in both modes. Reply and Read outcomes below are explicit local simulations."/>{["Sample","Loading","Error","Save failure","Upload failure"].map(s=><SelectionChip key={s} label={s} selected={scenario===s} onPress={()=>{setScenario(s);setDialog(undefined);setError(undefined);}}/>)}<Button title="Add fictional support reply" disabled={!allowed} onPress={()=>void simulate()}/><Button title="Simulate support reading" variant="outline" disabled={!allowed} onPress={()=>void simulate(true)}/><Button title={mode==="customer"?"View in provider mode":"View in customer mode"} variant="outline" onPress={()=>{router.setParams({mode:mode==="customer"?"provider":"customer"});setDialog(undefined);}}/></Sheet>}
    {dialog==="attach"&&<Sheet title="Attach a photo" showClose onClose={()=>setDialog(undefined)}><Callout message="The local preview uses a fictional plumbing photo. No personal photo is selected or uploaded."/>{scenario==="Upload failure"?<><Callout tone="error" message="The sample photo failed. Your message draft is kept."/><Button title="Retry sample photo" onPress={()=>setScenario("Sample")}/></>:<Button title="Use sample photo" disabled={!allowed} onPress={()=>{setPhoto({id:"sample-photo-"+Date.now(),ownerId:account.record!.id,conversationId:record!.id,name:"sample-plumbing.png",uri:"sample://photo",mime:"image/png",status:"ready"});setDialog(undefined);}}/>}</Sheet>}
    {dialog==="photo"&&<Sheet title="Sample photo" showClose onClose={()=>setDialog(undefined)}><Image source={require("@/assets/design/1b9df.png")} style={{width:"100%",height:240,borderRadius:12}} contentFit="contain"/><AppText variant="bodySmall">Fictional preview photo · stored locally</AppText></Sheet>}
  </View>;
}

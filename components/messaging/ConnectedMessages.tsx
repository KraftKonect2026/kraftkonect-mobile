import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useApolloClient } from "@apollo/client";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { markRead, sendChat } from "@/lib/messaging/liveChat";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { store } from "@/store";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { useAppSelector } from "@/store";
import { selectActiveMode } from "@/store/authSlice";
import { useOwnedMessagesRead } from "@/lib/hooks/useOwnedMessagesRead";
import { AppMode } from "@/lib/appMode";
import { LiveChatContent, LiveInboxContent } from "./LiveMessagesContent";
import Colors from "@/constants/colors";

const messagesPath=(mode:AppMode)=>mode==="provider"?"/provider/(tabs)/messages" as const:"/(app)/(tabs)/messages" as const;
function ServiceBoundary({action,onClose}:{action:string;onClose:()=>void}) {
  return <Sheet title={action+" unavailable"} showClose onClose={onClose}><Callout message="This service could not be connected. Your account and saved conversations are kept. Please try again later."/><Button title="Done" onPress={onClose}/></Sheet>;
}
export function ConnectedMessages({mode}:{mode:AppMode}) {
  const ownerId=useAppSelector(s=>s.auth.user?.id);
  return <OwnedInbox key={ownerId??"signed-out"} mode={mode}/>;
}
function OwnedInbox({mode}:{mode:AppMode}) {
  const data=useOwnedMessagesRead(),router=useRouter(),insets=useSafeAreaInsets();
  const [query,setQuery]=useState("");
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  return <View style={{flex:1,paddingTop:insets.top,backgroundColor:Colors.surface}}><LiveInboxContent rows={data.rows} query={query} onQuery={setQuery} onOpen={id=>router.push({pathname:"/chat/[providerId]",params:{providerId:id}})} onExplore={()=>router.push(mode==="provider"?"/provider/(tabs)/jobs":"/(app)/(tabs)")} provider={mode==="provider"} loading={data.loading} error={data.error} onRetry={()=>void data.refresh()}/></View>;
}
export function ConnectedChat() {
  const params=useLocalSearchParams<{providerId?:string}>(),ownerId=useAppSelector(s=>s.auth.user?.id);
  const conversationId=typeof params.providerId==="string"?params.providerId:"";
  // Ignore legacy recipientId/name/avatar URL parameters; the owned inbox supplies the participant.
  return <OwnedChat key={(ownerId??"signed-out")+":"+conversationId} conversationId={conversationId}/>;
}
function OwnedChat({conversationId}:{conversationId:string}) {
  const data=useOwnedMessagesRead(conversationId),router=useRouter(),mode=useAppSelector(selectActiveMode);
  const client=useApolloClient(),[text,setText]=useState(""),[unavailable,setUnavailable]=useState<string>(),[photoUrl,setPhotoUrl]=useState<string>(),[busy,setBusy]=useState(false),[sendError,setSendError]=useState<string>();
  const ownerId=data.ownerId,lock=useRef(false),alive=useRef(true),refreshRef=useRef(data.refresh);refreshRef.current=data.refresh;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const still=()=>{const a=store.getState().auth;return alive.current&&!!ownerId&&sameAccountSession(ownerId,a.user?.id,a.isAuthenticated&&!!a.accessToken);};
  // New messages arrive without leaving the screen.
  useEffect(()=>{const t=setInterval(()=>{void refreshRef.current(true);},8000);return()=>clearInterval(t);},[]);
  // Opening a conversation reads what is waiting for you in it.
  const unread=data.conversation?.unread??0;
  useEffect(()=>{if(!ownerId||!unread)return;void markRead(client,ownerId,conversationId).then(()=>refreshRef.current(true)).catch(()=>undefined);},[ownerId,conversationId,unread,client]);
  const onSend=async()=>{
    if(lock.current||!ownerId||!still())return;lock.current=true;setBusy(true);setSendError(undefined);
    try{await sendChat(client,ownerId,conversationId,text,photoUrl);if(!still())return;setText("");setPhotoUrl(undefined);await data.refresh(true);}
    catch(e){if(still())setSendError(e instanceof Error?e.message:"The message could not be sent.");}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  const onAttach=async()=>{
    if(lock.current||!ownerId||!still())return;lock.current=true;setBusy(true);setSendError(undefined);
    try{const pick=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.8});if(pick.canceled||!still())return;const url=await uploadImageToCloudinary(pick.assets[0].uri,still);if(still())setPhotoUrl(url);}
    catch(e){if(still())setSendError(e instanceof Error?e.message:"The photo could not be uploaded.");}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  const back=()=>{if(router.canGoBack())router.back();else router.replace(messagesPath(mode));};
  return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><LiveChatContent conversation={data.conversation} messages={data.messages} text={text} onText={setText} onUnavailable={setUnavailable} loading={data.loading} error={data.error} onRetry={()=>void data.refresh()} onBack={back} send={{onSend:()=>void onSend(),onAttach:()=>void onAttach(),onRemovePhoto:()=>setPhotoUrl(undefined),photoUrl,busy,error:sendError}}/>{unavailable&&<ServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

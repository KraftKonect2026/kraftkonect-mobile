import { useState } from "react";
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
  const [text,setText]=useState(""),[unavailable,setUnavailable]=useState<string>();
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  const back=()=>{if(router.canGoBack())router.back();else router.replace(messagesPath(mode));};
  return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><LiveChatContent conversation={data.conversation} messages={data.messages} text={text} onText={setText} onUnavailable={setUnavailable} loading={data.loading} error={data.error} onRetry={()=>void data.refresh()} onBack={back}/>{unavailable&&<ServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

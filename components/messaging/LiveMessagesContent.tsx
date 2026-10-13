import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { Frame, IconButton } from "@/components/discovery/Parts";
import { InboxView, Composer, MessageAvatar, LiveMessageTimeline } from "./MessagingParts";
import { LiveConversation, LiveMessage } from "@/lib/messaging/liveMessages";
import Colors from "@/constants/colors";

function ReadState({loading,error,onRetry}:{loading:boolean;error?:string;onRetry:()=>void}) {
  return <View style={{padding:24,gap:16}}>{loading?<LogoLoader label="Loading messages"/>:<><Callout tone="error" title="Messages unavailable" message={error??"Your saved messages could not be loaded. Try again later."}/><Button title="Try again" onPress={onRetry}/></>}</View>;
}
export function LiveInboxContent({rows,query,onQuery,onOpen,onExplore,provider,loading,error,onRetry}:{
 rows?:LiveConversation[];query:string;onQuery:(query:string)=>void;onOpen:(id:string)=>void;onExplore:()=>void;provider:boolean;loading:boolean;error?:string;onRetry:()=>void;
}) {
  if (loading || error || !rows) return <ReadState loading={loading} error={error} onRetry={onRetry}/>;
  return <InboxView rows={rows} query={query} onQuery={onQuery} onOpen={onOpen} onExplore={onExplore} provider={provider} contextAvailable={false}/>;
}
export function LiveChatContent({conversation,messages,text,onText,onUnavailable,loading,error,onRetry,onBack,preview=false}:{
 conversation?:LiveConversation;messages?:LiveMessage[];text:string;onText:(text:string)=>void;onUnavailable:(action:string)=>void;loading:boolean;error?:string;onRetry:()=>void;onBack:()=>void;preview?:boolean;
}) {
  const ready=!!conversation&&messages!==undefined&&!loading&&!error;
  const header=<><IconButton name="back" label="Back" onPress={onBack}/>{conversation&&<><MessageAvatar name={conversation.name} avatarUrl={conversation.avatarUrl} small/><View style={{flex:1,minWidth:0,gap:2}}><AppText variant="labelSupport">{conversation.name}</AppText><AppText variant="bodySmall" color={Colors.textSecondary}>{conversation.service}</AppText></View></>}</>;
  const footer=ready?<View style={{gap:8}}><Callout message="Sending and photo uploads are unavailable. Your draft stays on this screen."/><Composer text={text} onText={onText} onAttach={()=>onUnavailable("Photo upload")} onRemove={()=>{}} onSend={()=>onUnavailable("Send message")} busy={false}/></View>:undefined;
  return <Frame safeAreaTop={!preview} header={header} headerGap={12} headerHeight={56} contentStyle={{paddingTop:12,gap:12}} footer={footer} footerStyle={{paddingTop:12,borderTopWidth:1,borderTopColor:Colors.border}}>{ready?<LiveMessageTimeline messages={messages!}/>:<ReadState loading={loading} error={error} onRetry={onRetry}/>}</Frame>;
}

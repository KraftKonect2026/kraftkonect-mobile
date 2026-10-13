import { useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { ModeHeader } from "@/components/ModeHeader";
import { BottomNavigation, navigationItems } from "@/components/BottomNavigation";
import { Sheet } from "@/components/discovery/Parts";
import { LiveChatContent, LiveInboxContent } from "@/components/messaging/LiveMessagesContent";
import { ownedLiveConversations, ownedLiveMessages } from "@/lib/messaging/liveMessages";
import { AppMode } from "@/lib/appMode";
import Colors from "@/constants/colors";

export default function MessagesAdapterPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <Preview/>;}
function Preview(){
  const [mode,setMode]=useState<AppMode>("customer"),[chat,setChat]=useState(false),[query,setQuery]=useState(""),[text,setText]=useState(""),[error,setError]=useState(false),[dialog,setDialog]=useState<string>();
  const ownerId="fixture-account-amina",conversationId="fixture-conversation-1",recipientId="fixture-account-emeka";
  const rows=ownedLiveConversations(ownerId,[{id:conversationId,customerId:ownerId,providerId:recipientId,otherParticipant:{id:recipientId,name:"Emeka Okafor"},lastMessage:"I can come on Friday.",lastMessageAt:"2026-10-13T14:30:00Z",unreadCount:1}]);
  const messages=ownedLiveMessages(ownerId,rows[0],[{id:"fixture-message-1",conversationId,senderId:ownerId,recipientId,text:"Could you check the kitchen tap?",read:true,createdAt:"2026-10-13T14:25:00Z"},{id:"fixture-message-2",conversationId,senderId:recipientId,recipientId:ownerId,text:"I can come on Friday.",read:false,createdAt:"2026-10-13T14:30:00Z"}]);
  const toggle=()=>setError(value=>!value);
  return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><View style={{paddingLeft:16,paddingRight:8,minHeight:44,backgroundColor:Colors.background,flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>MESSAGE READ PREVIEW · Fictional response · No sign-in or external messages</AppText><Button title={error?"Sample":"Read error"} size="compact" variant="subtle" onPress={toggle}/></View>{chat?<LiveChatContent preview conversation={error?undefined:rows[0]} messages={error?undefined:messages} text={text} onText={setText} onUnavailable={setDialog} loading={false} error={error?"Sample message read failed. Try again; your draft is kept.":undefined} onRetry={()=>setError(false)} onBack={()=>setChat(false)}/>:<><ModeHeader mode={mode} onModeChange={setMode} onNotifications={()=>setDialog("Notifications")} showNotifications={mode==="customer"} showBorder={mode==="customer"}/><LiveInboxContent rows={error?undefined:rows} query={query} onQuery={setQuery} onOpen={()=>setChat(true)} onExplore={()=>setDialog("Explore")} provider={mode==="provider"} loading={false} error={error?"Sample inbox read failed. Your saved conversations have not been removed.":undefined} onRetry={()=>setError(false)}/><BottomNavigation items={navigationItems(mode)} activeKey="messages" onPress={setDialog}/></>}{dialog&&<Sheet title={dialog+" unavailable"} showClose onClose={()=>setDialog(undefined)}><Callout message="This read preview cannot send a message, acknowledge a read, upload a photo or change a real account. The draft stays on this screen."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}</View>;
}

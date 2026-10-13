import { LiveConversation, LiveMessage, ownedLiveConversation, ownedLiveConversations, ownedLiveMessages } from "./liveMessages";

export async function readOwnedMessages(ownerId:string,conversationId:string|undefined,reader:{
 inbox:()=>Promise<unknown>;history:(conversationId:string)=>Promise<unknown>;isCurrent:()=>boolean;
}):Promise<{rows:LiveConversation[];conversation?:LiveConversation;messages?:LiveMessage[]}>{
  const assertCurrent=()=>{if(!reader.isCurrent())throw new Error("The signed-in identity or conversation changed. Open Messages again.");};
  assertCurrent();
  const inbox=await reader.inbox();
  assertCurrent();
  const rows=ownedLiveConversations(ownerId,inbox);
  if(conversationId===undefined)return {rows};
  const conversation=ownedLiveConversation(ownerId,rows,conversationId);
  // A history read starts only after membership is confirmed through this account's inbox.
  const history=await reader.history(conversation.id);
  assertCurrent();
  return {rows,conversation,messages:ownedLiveMessages(ownerId,conversation,history)};
}

export async function readOwnedConversationForRecipient(ownerId:string,recipientId:string,reader:{inbox:()=>Promise<unknown>;isCurrent:()=>boolean}) {
 if(!recipientId||recipientId===ownerId||/\s/.test(recipientId)||recipientId.length>200)throw new Error("This message participant could not be confirmed.");
 const {rows}=await readOwnedMessages(ownerId,undefined,{...reader,history:async()=>{throw new Error("No history read was requested.");}});
 return rows.find(row=>row.recipientId===recipientId);
}

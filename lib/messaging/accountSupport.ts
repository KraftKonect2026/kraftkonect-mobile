import { AppMode } from "@/lib/appMode";
import { sampleAccountId } from "@/lib/account/model";
import { Conversation, SamplePhotoAttachment } from "./model";

export type AccountSupportPhoto = Omit<SamplePhotoAttachment,"owner"> & {ownerId:string};
export type AccountSupportMessage = {
  id:string; sender:"account"|"support"; text:string; at:string;
  attachments?:AccountSupportPhoto[];
};
export type AccountSupportThread = {
  schema:1; source:"sample"; id:string; ownerId:string; revision:number;
  commands:string[]; messages:AccountSupportMessage[];
  readThrough?:string; supportReadThrough?:string;
};
export type AccountSupportCommand =
  | {type:"message";conversationId:string;text:string;at:string;attachments?:AccountSupportPhoto[];incoming?:boolean}
  | {type:"read";conversationId:string;throughId:string;bySupport?:boolean};

export const accountSupportId = "sample-account-support-"+sampleAccountId;
export function sampleAccountSupport():AccountSupportThread {
  return {schema:1,source:"sample",id:accountSupportId,ownerId:sampleAccountId,revision:0,commands:[],messages:[]};
}
export function assertSupportOwner(r:AccountSupportThread,ownerId:string) {
  if(r.source!=="sample"||r.schema!==1||ownerId!==r.ownerId||ownerId!==sampleAccountId||r.id!==accountSupportId)
    throw new Error("This support conversation belongs to another account.");
}
export function validAccountSupportPhoto(p:AccountSupportPhoto,ownerId:string,conversationId:string) {
  return p?.ownerId===ownerId&&p.conversationId===conversationId&&p.status==="ready"&&p.uri==="sample://photo"&&p.mime==="image/png"&&typeof p.id==="string"&&p.id.startsWith("sample-photo-")&&typeof p.name==="string"&&!!p.name.trim()&&p.name.length<=80&&!/[\u0000-\u001f\u007f]/.test(p.name);
}
export function accountSupportDraft(text:string,photo?:AccountSupportPhoto,intentKey?:string) {
  if(text.length>1000||photo&&!validAccountSupportPhoto(photo,sampleAccountId,accountSupportId)||intentKey&&!/^sample-[A-Za-z0-9._-]{1,150}$/.test(intentKey))throw new Error("Invalid local support draft.");
  return {text,intentKey,photo:photo?{id:photo.id,ownerId:photo.ownerId,conversationId:photo.conversationId,name:photo.name,uri:photo.uri,mime:photo.mime,status:photo.status}:undefined};
}
/** Fictional support events only. Live ownership, upload and support authorization come from the service. */
export function applyAccountSupportCommand(r:AccountSupportThread,ownerId:string,revision:number,key:string,c:AccountSupportCommand):AccountSupportThread {
  assertSupportOwner(r,ownerId);
  if(c.conversationId!==r.id||!key.startsWith("sample-"))throw new Error("The message must target this account's support conversation.");
  if(r.commands.includes(key))return r;
  if(r.revision!==revision)throw new Error("Support changed. Refresh before trying again.");
  const n:AccountSupportThread=JSON.parse(JSON.stringify(r));
  if(c.type==="message") {
    const photos=c.attachments??[];
    if(typeof c.text!=="string"||c.text.length>1000||(!c.text.trim()&&!photos.length)||!Number.isFinite(Date.parse(c.at)))throw new Error("Enter a message or completed photo, within 1,000 characters.");
    if(photos.length>4||new Set(photos.map(p=>p.id)).size!==photos.length||photos.some(p=>!validAccountSupportPhoto(p,ownerId,r.id)))throw new Error("A completed photo must belong to this account and conversation.");
    if(c.incoming&&photos.length)throw new Error("The fictional support reply does not include an uploaded photo.");
    n.messages.push({id:key,sender:c.incoming?"support":"account",text:c.text.trim(),at:c.at,attachments:photos.map(p=>({id:p.id,ownerId:p.ownerId,conversationId:p.conversationId,name:p.name,uri:p.uri,mime:p.mime,status:p.status}))});
  } else if(c.type==="read") {
    const index=r.messages.findIndex(m=>m.id===c.throughId);
    if(index<0)throw new Error("The read marker must match an existing support message.");
    const field=c.bySupport?"supportReadThrough":"readThrough",old=r.messages.findIndex(m=>m.id===r[field]);
    if(index>old)n[field]=c.throughId;
  } else throw new Error("Unknown support action.");
  n.revision++;n.commands.push(key);return n;
}
export function accountSupportConversation(r:AccountSupportThread,ownerId:string,mode:AppMode):Conversation {
  assertSupportOwner(r,ownerId);
  if(mode!=="customer"&&mode!=="provider")throw new Error("An account mode is required.");
  const messages=r.messages.map(m=>({...m,sender:m.sender==="account"?mode:"support" as const,attachments:m.attachments?.map(p=>({id:p.id,conversationId:p.conversationId,owner:mode,name:p.name,uri:p.uri,mime:p.mime,status:p.status}))}));
  const seen=r.messages.findIndex(m=>m.id===r.readThrough);
  return {id:r.id,accountId:r.ownerId,name:"KraftKonect support",service:"Account help",messages,last:messages.at(-1),unread:r.messages.filter((m,i)=>m.sender==="support"&&i>seen).length,support:true,generalSupport:true};
}
export function supportReadMessage(r:AccountSupportThread,ownerId:string,id:string) {
  assertSupportOwner(r,ownerId);const index=r.messages.findIndex(m=>m.id===id&&m.sender==="account");
  return index>=0&&r.messages.findIndex(m=>m.id===r.supportReadThrough)>=index;
}

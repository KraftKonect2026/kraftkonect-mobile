import { BookingRecord, BookingRole } from "@/lib/bookings/model";
export type SamplePhotoAttachment={id:string;conversationId:string;owner:BookingRole;name:string;uri:"sample://photo";mime:"image/png";status:"ready"};
export type BookingMessage={id:string;sender:BookingRole;text:string;at?:string;attachments?:SamplePhotoAttachment[]};
export type ChatMessage=Omit<BookingMessage,"sender">&{sender:BookingRole|"support"};
export type Conversation={id:string;bookingId?:string;accountId?:string;name:string;service:string;messages:ChatMessage[];unread:number;last?:ChatMessage;support?:boolean;generalSupport?:boolean};
export function sampleConversationId(r:BookingRecord){return "sample-chat-"+r.id;}
function readIndex(r:BookingRecord,role:BookingRole){const id=r.messageReadThrough?.[role];return id?r.messages.findIndex(m=>m.id===id):-1;}
export function conversationFor(r:BookingRecord,role:BookingRole):Conversation{
 if(role!=="customer"&&role!=="provider")throw new Error("An owning conversation participant is required.");
 const seen=readIndex(r,role);
 return {id:sampleConversationId(r),bookingId:r.id,name:role==="customer"?r.providerName:r.customerName,service:r.serviceTitle,messages:r.messages,unread:r.messages.filter((m,i)=>m.sender!==role&&i>seen).length,last:r.messages.at(-1)};
}
export function messageReadByOther(r:BookingRecord,role:BookingRole,id:string){const i=r.messages.findIndex(m=>m.id===id&&m.sender===role);return i>=0&&readIndex(r,role==="customer"?"provider":"customer")>=i;}
export function messageError(r:BookingRecord,role:BookingRole,text:string,attachments:SamplePhotoAttachment[]=[],conversationId=sampleConversationId(r)){
 if(!text.trim()&&!attachments.length)return "Enter a message or add a completed photo.";
 if(text.length>1000)return "Keep the message within 1,000 characters.";
 if(attachments.length>4||attachments.some(a=>!validSamplePhoto(a,role,conversationId)))return "A completed sample photo must belong to this participant and conversation.";
 return undefined;
}
export function validSamplePhoto(a:SamplePhotoAttachment,role:BookingRole,conversationId:string){return a?.status==="ready"&&a.owner===role&&a.conversationId===conversationId&&typeof a.id==="string"&&a.id.startsWith("sample-photo-")&&a.uri==="sample://photo"&&a.mime==="image/png"&&typeof a.name==="string"&&!!a.name.trim()&&a.name.length<=80&&!/[\u0000-\u001f\u007f]/.test(a.name);}
export function searchConversations<T extends {name:string;service:string;last?:{text:string}}>(rows:T[],query:string){const q=query.trim().toLocaleLowerCase();return q?rows.filter(r=>[r.name,r.service,r.last?.text??""].some(v=>v.toLocaleLowerCase().includes(q))):rows;}
export function messageTime(at?:string){if(!at||!Number.isFinite(Date.parse(at)))return "";return new Date(at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}
export function messageDay(at?:string){if(!at||!Number.isFinite(Date.parse(at)))return "Date unavailable";const date=new Date(at);return date.toDateString()===new Date().toDateString()?"Today":date.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}
export function ownedConversations(r:BookingRecord,role:BookingRole):Conversation[]{
 const booking=conversationFor(r,role);
 const cases=(r.supportCases??[]).filter(c=>c.bookingId===r.id&&c.reporter===role).map(c=>{
  const messages:ChatMessage[]=c.messages.map(m=>({...m,sender:m.sender==="reporter"?role:"support"}));
  const seen=c.messages.findIndex(m=>m.id===c.readThrough);
  return {id:c.id,bookingId:r.id,name:"KraftKonect Support",service:c.reference??c.category,messages,last:messages.at(-1),unread:c.messages.filter((m,i)=>m.sender==="support"&&i>seen).length,support:true};
 });
 return [booking,...cases];
}

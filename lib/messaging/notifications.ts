import { BookingRecord, BookingRole } from "@/lib/bookings/model";
import { sampleConversationId } from "./model";
import { SampleAccount, sampleAccountId } from "@/lib/account/model";
import { AccountSupportThread, assertSupportOwner } from "./accountSupport";
export type LocalNotification={id:string;title:string;message:string;at?:string;icon:"message"|"payment"|"calendar"|"check"|"shield";destination:{type:"booking";step:string;caseId?:string}|{type:"chat";conversationId:string}|{type:"support";conversationId:string}|{type:"finance"}|{type:"account";step:string};read:boolean};
type Notice=Omit<LocalNotification,"id"|"at"|"read">;
function notice(r:BookingRecord,role:BookingRole,e:BookingRecord["events"][number]):Notice|undefined{
 const book=(step="detail",caseId?:string)=>({type:"booking" as const,step,caseId});
 const mapping:Record<string,Notice>={
  respond:{title:"Inspection response ready",message:"Review the proposed inspection terms before paying.",icon:"calendar",destination:book()},
  complete_inspection:{title:"Inspection completed",message:role==="provider"?"Prepare the final quote for this booking.":"Your provider has recorded the inspection findings.",icon:role==="provider"?"payment":"check",destination:book()},
  send_quote:{title:"Final quote ready",message:"Review the scope and price for "+r.serviceTitle+".",icon:"payment",destination:book()},
  accept_quote:{title:"Quote accepted",message:"The accepted quote is saved. Work still requires verified balance payment.",icon:"check",destination:book()},
  propose_date:{title:"New date proposed",message:"Review the proposal. The current appointment stays until accepted.",icon:"calendar",destination:book("proposal")},
  respond_date:{title:"Date proposal updated",message:"Open your booking to see the saved response.",icon:"calendar",destination:book()},
  finish_work:{title:"Work ready for review",message:"Review the completed work before confirming.",icon:"check",destination:book()},
  confirm_work:{title:"Job completed",message:"Customer confirmation is saved. Ledger release is tracked separately.",icon:"check",destination:book()},
  cancel_paid:{title:"Booking cancelled",message:"Open the booking for its refund review and any materials repayment.",icon:"calendar",destination:book()},
  cancel_request:{title:"Request ended",message:"Open the request to see the saved reason.",icon:"calendar",destination:book()},
  report:{title:"Issue report received",message:"Your private support case is available.",icon:"shield",destination:book("case","sample-case-"+e.id)},
  case_update:{title:"Support case updated",message:"Open your private case to see its current status.",icon:"shield",destination:book("case",e.details?.caseId)},
 };
 if(e.type==="message"){
  const m=r.messages.find(v=>v.id===e.id);if(!m||m.sender===role)return;
  return {title:"New message",message:(role==="customer"?r.providerName:r.customerName)+" sent you a message.",icon:"message",destination:{type:"chat",conversationId:sampleConversationId(r)}};
 }
 if(e.type==="case_message"){
  const c=(r.supportCases??[]).find(c=>c.reporter===role&&c.bookingId===r.id&&c.messages.some(m=>m.id===e.id&&m.sender==="support"));if(!c)return;
  return {title:"Support replied",message:"KraftKonect Support replied to "+(c.reference??"your case")+".",icon:"message",destination:{type:"chat",conversationId:c.id}};
 }
 if(["report","case_update"].includes(e.type)&&!(r.supportCases??[]).some(c=>c.reporter===role&&c.id===(e.type==="report"?"sample-case-"+e.id:e.details?.caseId)))return;
 if(e.type==="respond"&&role!=="customer"||e.type==="send_quote"&&role!=="customer"||e.type==="accept_quote"&&role!=="provider"||e.type==="finish_work"&&role!=="customer")return;
 if(e.type==="payment")return e.details?.status==="verified"?{title:"Inspection deposit confirmed",message:"Open the booking for the verified payment record.",icon:"payment",destination:book()}:undefined;
 if(e.type==="balance_payment")return e.details?.status==="verified"?{title:"Balance payment confirmed",message:"The booking’s balance payment is verified.",icon:"payment",destination:book()}:undefined;
 if(e.type==="ledger_snapshot"&&role==="provider"&&r.ledger?.status==="credited")return {title:"Ledger updated",message:"View the recorded materials and labour releases.",icon:"payment",destination:{type:"finance"}};
 if(e.type==="payout_result"&&role==="provider"){
  if(!["paid","failed"].includes(e.details?.status??"")||!r.finance?.payouts.some(p=>p.id===e.details?.payoutId))return;
  return {title:e.details?.status==="paid"?"Payout completed":"Payout failed",message:"View this payout’s saved result in your earnings.",icon:"payment",destination:{type:"finance"}};
 }
 if(e.actor===role&&["propose_date","respond_date"].includes(e.type))return;
 return mapping[e.type];
}
/** Only persisted sample events produce feed items. Push switches do not remove this history. */
export function notificationsFor(r:BookingRecord,role:BookingRole,readIds:string[]=[]):LocalNotification[]{
 if(role!=="customer"&&role!=="provider")throw new Error("A notification owner is required.");
 const seen=new Set(readIds);return r.events.flatMap(e=>{const n=notice(r,role,e);if(!n)return [];const id="sample-notification-"+role+"-"+r.id+"-"+e.id;return [{...n,id,at:e.at,read:seen.has(id)}];}).reverse();
}
export function notificationGroup(at?:string,now=new Date()) {if(!at||!Number.isFinite(Date.parse(at)))return "Earlier";return new Date(at).toDateString()===now.toDateString()?"Today":"Earlier";}
export function mergeNotificationReads(r:BookingRecord,role:BookingRole,current:string[],ids:string[]){const rows=notificationsFor(r,role);if(ids.some(id=>!rows.some(n=>n.id===id)))throw new Error("This notification belongs to another participant or event.");return [...new Set([...current.filter(id=>id.startsWith("sample-notification-"+role+"-")),...ids])];}

/** Security history belongs to the stable account, independent of presentation mode and push preferences. */
export function accountNotificationsFor(r:SampleAccount,ownerId:string,readIds:string[]=[]):LocalNotification[] {
 if(r.source!=="sample"||r.id!==ownerId||ownerId!==sampleAccountId)throw new Error("Account notifications belong to their owning account.");
 const account=(step="details")=>({type:"account" as const,step});
 const events:Record<string,Notice>={
  phone_changed:{title:"Phone number changed",message:"Your sign-in number was updated after verification. Review your account if you did not make this change.",icon:"shield",destination:account()},
  email_changed:{title:"Recovery email updated",message:"Your verified recovery email has changed. Review your account if you did not make this change.",icon:"shield",destination:account()},
  account_recovered:{title:"Account access recovered",message:"A verified replacement number is connected to your existing account. Your records stay with the same identity.",icon:"shield",destination:account()},
  name_review_requested:{title:"Name review submitted",message:"Your requested name is under review. Your approved identity name stays until a confirmed decision.",icon:"shield",destination:account("name")},
  provider_deactivated:{title:"Provider profile deactivated",message:"New discovery is paused. Existing work, messages, repayments and earnings remain accessible.",icon:"shield",destination:account()},
  reactivation_requested:{title:"Reactivation requested",message:"Your provider profile stays hidden while the request is reviewed.",icon:"shield",destination:account()},
  provider_reactivated:{title:"Provider profile reactivated",message:"The matching review approved reactivation of your provider profile.",icon:"shield",destination:account("verification")},
  reactivation_declined:{title:"Reactivation review updated",message:"The review did not approve reactivation. Your provider profile remains inactive.",icon:"shield",destination:account()},
  deletion_requested:{title:"Deletion notice started",message:"Your account is signed out. Final deletion still requires the notice period and settlement of retained activity.",icon:"shield",destination:account("delete-requested")},
 };
 const seen=new Set(readIds),used=new Set<string>();
 return r.securityEvents.flatMap(e=>{
  if(e.accountId&&e.accountId!==ownerId||!e.id.startsWith("sample-")||used.has(e.id)||!events[e.type])return [];
  used.add(e.id);const id="sample-account-notification-"+ownerId+"-"+e.id;
  return [{...events[e.type],id,at:e.at,read:seen.has(id)}];
 }).reverse();
}
export function supportNotificationsFor(r:AccountSupportThread,ownerId:string,readIds:string[]=[]):LocalNotification[] {
 assertSupportOwner(r,ownerId);const seen=new Set(readIds);
 return r.messages.filter(m=>m.sender==="support").map(m=>{
  const id="sample-support-notification-"+ownerId+"-"+m.id;
  return {id,title:"Support replied",message:"KraftKonect support replied to your account conversation.",icon:"message" as const,at:m.at,read:seen.has(id),destination:{type:"support" as const,conversationId:r.id}};
 }).reverse();
}
export function mergeAccountNotificationReads(account:SampleAccount,support:AccountSupportThread,ownerId:string,current:string[],ids:string[]) {
 const rows=[...accountNotificationsFor(account,ownerId),...supportNotificationsFor(support,ownerId)];
 if(ids.some(id=>!rows.some(n=>n.id===id)))throw new Error("This notification belongs to another account or event.");
 return [...new Set([...current.filter(id=>id.startsWith("sample-account-notification-"+ownerId+"-")||id.startsWith("sample-support-notification-"+ownerId+"-")),...ids])];
}
export function sortNotifications(rows:LocalNotification[]) {
 return [...rows].sort((a,b)=>(Number.isFinite(Date.parse(b.at??""))?Date.parse(b.at!):0)-(Number.isFinite(Date.parse(a.at??""))?Date.parse(a.at!):0));
}

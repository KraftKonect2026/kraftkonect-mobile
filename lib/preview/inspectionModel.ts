import { BookingRecord, BookingRole, exactAddress, inspectionVerified, Payment, ResponseDraft, termsFromDraft } from "@/lib/bookings/model";
import { addDays, localDate, RequestDraft } from "@/lib/discovery/model";
import { messageError, SamplePhotoAttachment, sampleConversationId } from "@/lib/messaging/model";

export const SAMPLE_BOOKING_KEY="kk.step6.sample-booking.v1";
export type SampleCommand =
  | {type:"respond";draft:ResponseDraft}
  | {type:"checkout";address:string}
  | {type:"payment";receipt:Payment}
  | {type:"complete_inspection";findings:string}
  | {type:"cancel_request";reason:string}
  | {type:"message";text:string;attachments?:SamplePhotoAttachment[];conversationId?:string;at?:string}
  | {type:"mark_messages_read";conversationId:string;throughId:string};
export function sampleInspection(draft?:RequestDraft,providerName="Tobi Plumbing",serviceTitle="Kitchen plumbing repair"):BookingRecord {
  return {schema:1,id:"sample-request",revision:0,source:"sample",customerId:"sample-customer",providerId:draft?.providerId??"tobi",customerName:"Tomi Adeyemi",providerName,serviceId:draft?.serviceId??"kitchen",serviceTitle,area:draft?.area??"Lekki Phase 1, Lagos",preferredDate:draft?.date||localDate(addDays(new Date(),1)),description:draft?.description??"Water leaks under the cabinet when the tap is running.",serviceMode:"onsite",stage:"request",commands:[],events:[],messages:[]};
}
/** Fictional fixture arithmetic only. Real fees/net amounts must come from the server ledger. */
export function sampleDepositBreakdown(deposit:number) {
  const fee=Math.min(Math.round(deposit*0.05),2000000);return {fee,net:deposit-fee};
}
function assertRole(role:BookingRole,required:BookingRole) {if(role!==required)throw new Error("This action belongs to the other participant.");}
/** DEV simulator: never call from authenticated routes or use as financial authority. */
export function applySampleCommand(record:BookingRecord,role:BookingRole,expectedRevision:number,key:string,command:SampleCommand):BookingRecord {
  if(record.source!=="sample" || !key.trim())throw new Error("A sample record and command key are required.");
  if(role!=="customer"&&role!=="provider")throw new Error("An owning participant role is required.");
  if(command.type==="respond"||command.type==="complete_inspection")assertRole(role,"provider");
  if(command.type==="checkout"||command.type==="payment")assertRole(role,"customer");
  if(record.commands.includes(key))return record;
  if(record.revision!==expectedRevision)throw new Error("This booking changed. Refresh it before trying again.");
  if(record.cancelled&&command.type!=="message"&&command.type!=="mark_messages_read")throw new Error("This request has already ended.");
  const next:BookingRecord=JSON.parse(JSON.stringify(record));
  if(command.type==="respond") {
    assertRole(role,"provider");if(record.payment?.status==="pending" || inspectionVerified(record))throw new Error("Inspection terms cannot change while payment is pending or confirmed.");
    next.terms=termsFromDraft(command.draft,(record.terms?.version??0)+1);next.stage="response";delete next.payment;delete next.inspectionPaymentReference;delete next.acceptedTermsVersion;delete next.address;
  } else if(command.type==="checkout") {
    assertRole(role,"customer");if(!record.terms || inspectionVerified(record))throw new Error("A current unpaid inspection response is required.");
    if(record.payment?.status==="pending")throw new Error("A payment is already pending. Check it before starting another.");
    const address=command.address.trim();if(record.serviceMode==="onsite" && address.length<8)throw new Error("Enter the exact appointment address.");
    next.acceptedTermsVersion=record.terms.version;
    if(record.serviceMode==="onsite")next.address=address.slice(0,240);else delete next.address;
    next.payment={reference:"sample-inspection-"+key,bookingId:record.id,termsVersion:record.terms.version,purpose:"inspection",amount:record.terms.deposit,currency:"NGN",status:"pending"};
    next.inspectionPaymentReference=next.payment.reference;
  } else if(command.type==="payment") {
    assertRole(role,"customer");const receipt=command.receipt,p=record.payment;
    if(!p || p.status!=="pending")throw new Error("There is no pending payment to verify.");
    for(const field of ["reference","bookingId","termsVersion","purpose","amount","currency"] as const)if(receipt[field]!==p[field])throw new Error("Payment details do not match this inspection.");
    if(!["pending","failed","verified"].includes(receipt.status))throw new Error("Unknown payment status.");
    next.payment={...p,status:receipt.status};if(receipt.status==="verified")next.stage="inspection_scheduled";
  } else if(command.type==="complete_inspection") {
    assertRole(role,"provider");if(!inspectionVerified(record) || record.stage!=="inspection_scheduled")throw new Error("The paid inspection must be confirmed before it can be completed.");
    if(command.findings.trim().length<10)throw new Error("Record your inspection findings before completing the visit.");
    next.findings=command.findings.trim().slice(0,2000);next.stage="inspection_complete";
  } else if(command.type==="cancel_request") {
    if(record.payment?.status==="pending" || inspectionVerified(record))throw new Error("A paid or pending inspection needs the cancellation and refund flow.");
    if(command.reason.trim().length<3)throw new Error("Enter a reason for ending this request.");
    next.cancelled={by:role,reason:command.reason.trim().slice(0,500)};
  } else if(command.type==="message") {
    if(command.conversationId&&command.conversationId!==sampleConversationId(record))throw new Error("This message belongs to another conversation.");
    const error=messageError(record,role,command.text,command.attachments);if(error)throw new Error(error);
    if(command.at&&!Number.isFinite(Date.parse(command.at)))throw new Error("Invalid message timestamp.");
    next.messages.push({id:key,sender:role,text:command.text.trim(),at:command.at,attachments:command.attachments?.map(a=>({...a}))});
  } else if(command.type==="mark_messages_read") {
    if(command.conversationId!==sampleConversationId(record)||!record.messages.some(m=>m.id===command.throughId))throw new Error("The read marker must belong to this conversation.");
    const current=record.messages.findIndex(m=>m.id===record.messageReadThrough?.[role]),target=record.messages.findIndex(m=>m.id===command.throughId);
    if(target<current)throw new Error("A read marker cannot move backwards.");
    next.messageReadThrough={...record.messageReadThrough,[role]:command.throughId};
  }
  next.revision++;next.commands.push(key);next.events.push({id:key,type:command.type,revision:next.revision});return next;
}
export function sampleParticipantView(record:BookingRecord,role:BookingRole):BookingRecord {
  const visible={...record,address:exactAddress(record,role)};
  // Preview provider projection deliberately excludes the customer's unconfirmed address.
  if(!visible.address)delete visible.address;return visible;
}

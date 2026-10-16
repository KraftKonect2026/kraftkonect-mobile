import type { BookingMessage, SamplePhotoAttachment } from "@/lib/messaging/model";
import { dateLabel, futureDay, parseDay } from "@/lib/discovery/model";

export type BookingRole = "customer" | "provider";
export type BookingStage = "request" | "response" | "inspection_scheduled" | "inspection_complete" | "quote_sent" | "work_scheduled" | "work_in_progress" | "work_review" | "completed";
export type BookingSection = "pending" | "active" | "completed" | "cancelled";
export type Money = { amount: number; currency: "NGN" };
export type InspectionTerms = { version:number; minimum:number; maximum:number; deposit:number; date:string; time:string };
export type ResponseDraft = { minimum:string; maximum:string; deposit:string; date:string; time:string };
export type Payment = { reference:string; bookingId:string; termsVersion:number; purpose:"inspection"; amount:number; currency:"NGN"; status:"pending"|"failed"|"verified" };
export type FinalQuote = {version:number;serviceTitle:string;scope:string;materials:number;labour:number;total:number;depositCredit:number;remaining:number;date:string;time:string;duration:string;currency:"NGN"};
export type BalancePayment = Omit<Payment,"termsVersion"|"purpose">&{quoteVersion:number;purpose:"balance"};
export type QuotePaymentBreakdown={total:number;deposit:number;remaining:number;fee:number;net:number;depositFee:number;depositNet:number;balanceFee:number;balanceNet:number};
export type BookingLedger = {id:string;bookingId:string;quoteVersion:number;depositReference:string;balanceReference:string;currency:"NGN";gross:number;fee:number;net:number;materialsNet:number;labourNet:number;materialsReleased:number;labourReleased:number;status:"processing"|"credited";labourReleaseStatus?:"processing"|"credited";materialsCreditedAt?:string;labourCreditedAt?:string;source:"sample-snapshot"};
export type Appointment={date:string;time:string};
export type DateProposal=Appointment&{id:string;version:number;purpose:"inspection"|"work";status:"proposed"|"accepted"|"declined";by:BookingRole};
export type CompletionProof={id:string;customerId:string;workEventId:string;quoteVersion:number;at:string};
export type WalletSnapshot={id:string;bookingId:string;ledgerId:string;providerId:string;currency:"NGN";available:number;reserved:number;materialAvailable:number;materialReserved:number;materialWithdrawn:number};
export type RefundRecord={id:string;bookingId:string;currency:"NGN";exposure:number;amount?:number;status:"in_review"|"approved"|"processing"|"paid"|"failed"|"declined";reference?:string};
export type RepaymentRecord={id:string;bookingId:string;ledgerId:string;currency:"NGN";due:number;recovered:number;outstanding:number;deadline?:string;status:"awaiting_wallet"|"due"|"settled";authorizationReference?:string;payment?:{reference:string;obligationId:string;bookingId:string;purpose:"repayment";currency:"NGN";amount:number;status:"pending"|"failed"|"verified"}};
export type SupportCase={id:string;reference?:string;bookingId:string;reporter:BookingRole;category:string;description:string;when:string;help:string;photo?:{id:string;name:string;uri:string};status:"received"|"under_review"|"resolved";outcome?:string;readThrough?:string;unread?:boolean;messages:{id:string;sender:"reporter"|"support";text:string;at:string;photoUrl?:string;attachments?:SamplePhotoAttachment[]}[]};
export type BookingReview={id:string;bookingId:string;customerId:string;rating:number;text:string;updatedAt:string};
export type VerifiedPayoutBank={id:string;providerId:string;identityReference:string;lookupReference:string;bankName:string;bankCode:string;accountNumber:string;accountName:string;status:"verified"};
export type SamplePayout={id:string;reference:string;providerId:string;walletId:string;currency:"NGN";amount:number;materialAmount:number;bank:VerifiedPayoutBank;authorizationReference:string;status:"pending"|"paid"|"failed";createdAt:string;updatedAt:string};
export type SampleFinance={approvedIdentity:{providerId:string;name:string;reference:string};bank?:VerifiedPayoutBank;authorization?:{reference:string;providerId:string;walletId:string;bankId:string;amount:number;currency:"NGN"};payouts:SamplePayout[];labourPosted:number;postings:{id:string;ledgerId:string;amount:number;component:"labour";at:string}[]};
export type BookingRecord = {
  schema:1; id:string; revision:number; source:"sample"|"live"; customerId:string; providerId:string;
  customerName:string; providerName:string; serviceId:string; serviceTitle:string; area:string;
  preferredDate:string; description:string; serviceMode:"onsite"|"remote"; stage:BookingStage;
  terms?:InspectionTerms; payment?:Payment; inspectionPaymentReference?:string; acceptedTermsVersion?:number; address?:string;
  findings?:string; cancelled?:{by:BookingRole;reason:string};
  quote?:FinalQuote; acceptedQuote?:FinalQuote; balancePayment?:BalancePayment; balancePaymentReference?:string; ledger?:BookingLedger;
  inspectionAppointment?:Appointment;workAppointment?:Appointment;dateProposal?:DateProposal;workStartedAt?:string;workFinishedAt?:string;workFinishedEventId?:string;completion?:CompletionProof;
  wallet?:WalletSnapshot;refund?:RefundRecord;repayment?:RepaymentRecord;supportCases?:SupportCase[];review?:BookingReview;finance?:SampleFinance;
  commands:string[]; events:{id:string;type:string;revision:number;at?:string;actor?:BookingRole;details?:{status?:string;payoutId?:string;caseId?:string}}[];
  messages:BookingMessage[];messageReadThrough?:Partial<Record<BookingRole,string>>;
};
export type BookingListItem = { id:string; title:string; participant:string; date:string; description?:string; area?:string; status:string; section:BookingSection; warning?:boolean; legacy?:boolean; providerId?:string };

export function money(amount:number):string {
  if (!Number.isSafeInteger(amount) || amount < 0) return "Amount unavailable";
  return "₦" + (amount/100).toLocaleString("en-NG",{maximumFractionDigits:2});
}
export function parseMoney(value:string):number|null {
  const clean=value.trim().replace(/^₦/,"");
  if(clean.includes(",")&&!/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(clean))return null;
  const normalized=clean.replace(/,/g,"");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole,fraction=""]=normalized.split("."); const amount=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  return Number.isSafeInteger(amount) && amount>=0 ? amount : null;
}
export function responseError(draft:ResponseDraft):string|null {
  const min=parseMoney(draft.minimum),max=parseMoney(draft.maximum),deposit=parseMoney(draft.deposit);
  if(min===null) return "Enter a valid, non-negative minimum estimate.";
  if(max===null || max<min) return "The maximum estimate must be at least the minimum estimate.";
  if(deposit===null || deposit<=0) return "Enter an initial deposit greater than ₦0.";
  if(!futureDay(draft.date)) return "Choose an inspection date today or later.";
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return "Enter the appointment time as HH:MM, for example 10:00.";
  return null;
}
export function termsFromDraft(draft:ResponseDraft,version:number):InspectionTerms {
  const error=responseError(draft);if(error)throw new Error(error);
  return {version,minimum:parseMoney(draft.minimum)!,maximum:parseMoney(draft.maximum)!,deposit:parseMoney(draft.deposit)!,date:draft.date,time:draft.time};
}
export function appointmentLabel(terms?:Pick<InspectionTerms,"date"|"time">):string {
  if(!terms) return "Not confirmed";
  const [hour,minute]=terms.time.split(":").map(Number);
  return `${dateLabel(terms.date)} · ${hour%12 || 12}:${String(minute).padStart(2,"0")} ${hour<12?"AM":"PM"}`;
}
export function inspectionVerified(record:BookingRecord):boolean {
  const p=record.payment,t=record.terms;
  return !!(t && p && p.status==="verified" && p.bookingId===record.id && p.termsVersion===t.version && p.amount===t.deposit && p.currency==="NGN" && p.purpose==="inspection" && p.reference.trim() && p.reference===record.inspectionPaymentReference && record.acceptedTermsVersion===t.version);
}
export function exactAddress(record:BookingRecord,role:BookingRole):string|undefined {
  if(record.serviceMode==="remote") return undefined;
  return role==="customer" || inspectionVerified(record) ? record.address : undefined;
}
export function sectionFor(record:BookingRecord):BookingSection {
  return record.cancelled ? "cancelled" : completedByCustomer(record) ? "completed" : inspectionVerified(record) ? "active" : "pending";
}
export function statusFor(record:BookingRecord):string {
  if(record.cancelled) return inspectionVerified(record)?"Cancelled · payment review":record.cancelled.by==="provider" ? "Request declined" : "Request cancelled";
  if(balanceVerified(record))return completedByCustomer(record)?"Completed":record.stage==="work_review"?"Awaiting customer confirmation":record.stage==="work_in_progress"?"Work in progress":"Work scheduled";
  if(record.balancePayment?.status==="pending")return "Balance payment pending";
  if(record.balancePayment?.status==="failed")return "Balance payment unsuccessful";
  if(record.quote && inspectionVerified(record))return record.acceptedQuote?"Quote accepted · awaiting payment":"Final quote ready";
  if(record.stage==="inspection_complete" && inspectionVerified(record)) return "Awaiting final quote";
  if(inspectionVerified(record)) return "Inspection scheduled";
  if(record.payment?.status==="pending") return "Payment pending";
  if(record.payment?.status==="failed") return "Payment unsuccessful";
  return record.terms ? "Response received" : "Awaiting response";
}
export function sampleListItem(record:BookingRecord,role:BookingRole):BookingListItem {
  const date=balanceVerified(record)?(role==="customer"?"Work · ":"")+appointmentLabel(record.workAppointment??record.acceptedQuote):inspectionVerified(record)?(role==="customer"?"Inspection · ":"")+appointmentLabel(record.inspectionAppointment??record.terms):(role==="customer"?"Requested · ":"")+dateLabel(record.preferredDate);
  return {id:record.id,title:record.serviceTitle,participant:role==="provider" ? record.customerName : record.providerName+" · Verified",date,description:record.description,area:record.area,status:statusFor(record),section:sectionFor(record),warning:(role==="provider"||!!record.terms)&&!inspectionVerified(record),providerId:record.providerId};
}

/** Legacy API data cannot prove an unpaid request, inspection, exact address, or any ledger credit. */
export function legacyListItem(raw:{id:string; status?:string; bookingDate?:string; description?:string; listing?:{title?:string}; provider?:{name?:string};customer?:{name?:string}},role:BookingRole):BookingListItem {
  const status=raw.status??"unknown";
  const section:BookingSection=status==="completed" ? "completed" : ["cancelled","refunded","rejected"].includes(status) ? "cancelled" : "active";
  return {id:raw.id,title:raw.listing?.title || "Existing booking",participant:(role==="provider" ? raw.customer?.name : raw.provider?.name) || "Participant unavailable",date:raw.bookingDate ? dateLabel(raw.bookingDate.slice(0,10)) : "Date unavailable",status:status==="refunded" ? "Cancelled · payment status needs verification" : status==="completed" ? "Completed" : status==="cancelled" ? "Cancelled" : "Existing booking",section,legacy:true};
}

export function sameQuote(a:FinalQuote,b:FinalQuote):boolean {
  return (["version","serviceTitle","scope","materials","labour","total","depositCredit","remaining","date","time","duration","currency"] as const).every(key=>a[key]===b[key]);
}
export function quoteConsistent(record:BookingRecord,q:FinalQuote):boolean {
  return [q.version,q.materials,q.labour,q.total,q.depositCredit,q.remaining].every(a=>Number.isSafeInteger(a)&&a>=0) && q.version>0 && q.total>0 && q.total===q.materials+q.labour && q.depositCredit===record.payment?.amount && q.remaining===q.total-q.depositCredit && q.currency==="NGN" && !!parseDay(q.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(q.time) && typeof q.scope==="string" && q.scope.trim().length>=10 && typeof q.duration==="string" && q.duration.trim().length>=2;
}
export function balanceVerified(record:BookingRecord):boolean {
  const q=record.acceptedQuote,p=record.balancePayment;
  return !!(inspectionVerified(record) && q && quoteConsistent(record,q) && record.quote && sameQuote(q,record.quote) && p && p.status==="verified" && p.purpose==="balance" && p.currency===q.currency && p.amount===q.remaining && p.bookingId===record.id && p.quoteVersion===q.version && p.reference.trim() && p.reference===record.balancePaymentReference);
}
export function completedByCustomer(record:BookingRecord):boolean {
  const c=record.completion;
  return !!(balanceVerified(record)&&record.stage==="completed"&&c&&c.customerId===record.customerId&&c.quoteVersion===record.acceptedQuote?.version&&c.workEventId===record.workFinishedEventId&&record.events.some(e=>e.id===c.workEventId&&e.type==="finish_work")&&record.events.some(e=>e.id===c.id&&e.type==="confirm_work")&&!record.cancelled);
}

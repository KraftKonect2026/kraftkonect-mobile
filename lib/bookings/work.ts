import { Appointment, BookingRecord, BookingRole, completedByCustomer, inspectionVerified, balanceVerified, SupportCase, WalletSnapshot } from "./model";
import { futureDay } from "@/lib/discovery/model";

export function currentAppointment(record:BookingRecord,purpose:"inspection"|"work"=balanceVerified(record)?"work":"inspection"):Appointment|undefined {
  return purpose==="work"?record.workAppointment??record.acceptedQuote:record.inspectionAppointment??record.terms;
}
export function dateProposalError(record:BookingRecord,date:string,time:string,purpose:"inspection"|"work"):string|null {
  if(record.cancelled||record.stage==="completed"||record.stage==="work_review"||record.stage==="work_in_progress")return "This appointment can no longer be changed through scheduling.";
  if(purpose==="work"?!balanceVerified(record):!inspectionVerified(record)||!!record.findings)return "Only a confirmed upcoming appointment can be rescheduled.";
  if(!futureDay(date)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))return "Choose a future date and a valid HH:MM time.";
  if(purpose==="work"&&date<(record.inspectionAppointment?.date??record.terms?.date??""))return "Work cannot precede the inspection.";
  return null;
}
export function walletSnapshotError(record:BookingRecord,w:WalletSnapshot):string|null {
  const l=record.ledger;
  if(!l||l.status!=="credited"||w.bookingId!==record.id||w.ledgerId!==l.id||w.providerId!==record.providerId||w.currency!==l.currency||!w.id)return "This wallet snapshot does not match the credited material allocation.";
  if([w.available,w.reserved,w.materialAvailable,w.materialReserved,w.materialWithdrawn].some(a=>!Number.isSafeInteger(a)||a<0)||w.materialAvailable>w.available||w.materialReserved>w.reserved||w.materialAvailable+w.materialReserved+w.materialWithdrawn!==l.materialsReleased)return "Wallet material balances do not reconcile.";
  return null;
}
export function reviewError(record:BookingRecord,rating:number,text:string):string|null {
  if(!completedByCustomer(record))return "Only this booking’s customer can review confirmed completed work.";
  if(!Number.isInteger(rating)||rating<1||rating>5)return "Choose a rating from one to five stars.";
  return text.length>500?"Keep the review within 500 characters.":null;
}
export function reportError(category:string,description:string,when:string,help:string):string|null {
  return !category.trim()||category.length>100||description.trim().length<10||description.length>2000||!when.trim()||when.length>160||!help.trim()||help.length>500?"Describe what happened, when it happened and the help you need.":null;
}
export function casesFor(record:BookingRecord,role:BookingRole):SupportCase[]{return (record.supportCases??[]).filter(c=>c.bookingId===record.id&&c.reporter===role);}
export function refundableExposure(record:BookingRecord):number {
  return (inspectionVerified(record)&&!record.findings?record.payment!.amount:0)+(balanceVerified(record)?record.balancePayment!.amount:0);
}

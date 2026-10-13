import { BalancePayment, BookingLedger, BookingRecord, FinalQuote, inspectionVerified, parseMoney, balanceVerified, completedByCustomer } from "./model";
import { futureDay } from "@/lib/discovery/model";

export type QuoteDraft={scope:string;materials:string;labour:string;date:string;time:string;duration:string};
export function quoteError(record:BookingRecord,draft:QuoteDraft):string|null {
  if(!inspectionVerified(record)||!["inspection_complete","quote_sent"].includes(record.stage))return "Complete the confirmed inspection before preparing a final quote.";
  if(record.cancelled)return "This booking has ended.";
  if(record.acceptedQuote||record.balancePayment?.status==="pending"||balanceVerified(record))return "The accepted quote is locked. Its terms cannot be replaced.";
  if(draft.scope.trim().length<10 || draft.scope.length>2000)return "Describe what is included in the work.";
  const materials=parseMoney(draft.materials),labour=parseMoney(draft.labour);
  if(materials===null||labour===null)return "Enter valid materials and labour amounts.";
  const total=materials+labour;if(!Number.isSafeInteger(total)||total<=0)return "The full job price must be greater than ₦0.";
  if(total<record.payment!.amount)return "The quote is below the paid deposit. A refund decision is needed before quoting this amount.";
  if(!futureDay(draft.date)||draft.date<(record.inspectionAppointment?.date??record.terms?.date??""))return "Choose a work date on or after the confirmed inspection and today.";
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time))return "Enter a work time as HH:MM, for example 14:00.";
  if(draft.duration.trim().length<2||draft.duration.length>80)return "Enter the estimated work duration.";
  return null;
}
export function quoteFromDraft(record:BookingRecord,draft:QuoteDraft):FinalQuote {
  const error=quoteError(record,draft);if(error)throw new Error(error);
  const materials=parseMoney(draft.materials)!,labour=parseMoney(draft.labour)!,total=materials+labour,depositCredit=record.payment!.amount;
  return {version:(record.quote?.version??0)+1,serviceTitle:record.serviceTitle,scope:draft.scope.trim(),materials,labour,total,depositCredit,remaining:total-depositCredit,date:draft.date,time:draft.time,duration:draft.duration.trim(),currency:"NGN"};
}
export function validBalanceReceipt(expected:BalancePayment,received:BalancePayment):boolean {
  return ["pending","failed","verified"].includes(received.status) && (["reference","bookingId","quoteVersion","purpose","amount","currency"] as const).every(key=>expected[key]===received[key]);
}
/** Consume a matching ledger snapshot; never calculate material/labour allocation in the app. */
export function ledgerError(record:BookingRecord,ledger:BookingLedger):string|null {
  const q=record.acceptedQuote;if(!balanceVerified(record)||!q)return "Payment has not been verified for the accepted quote.";
  if(!ledger.id.trim() || ledger.bookingId!==record.id || ledger.quoteVersion!==q.version || ledger.currency!==q.currency || ledger.depositReference!==record.payment?.reference || ledger.balanceReference!==record.balancePayment?.reference)return "The ledger does not belong to this booking and quote.";
  const amounts=[ledger.gross,ledger.fee,ledger.net,ledger.materialsNet,ledger.labourNet,ledger.materialsReleased,ledger.labourReleased];
  if(amounts.some(a=>!Number.isSafeInteger(a)||a<0))return "The ledger contains invalid amounts.";
  if(ledger.gross!==q.total||ledger.fee!==Math.min(Math.round(ledger.gross*0.05),2000000)||ledger.fee+ledger.net!==ledger.gross||ledger.materialsNet+ledger.labourNet!==ledger.net)return "Ledger totals do not reconcile.";
  if(ledger.materialsReleased>ledger.materialsNet||ledger.labourReleased>ledger.labourNet)return "Released funds exceed the provider’s entitlement.";
  if(!completedByCustomer(record)&&ledger.labourReleased>0)return "Labour release needs explicit customer completion proof.";
  if(record.cancelled&&ledger.labourReleased>0)return "Cancelled work cannot release labour through the normal completion route.";
  if(record.ledger&&(["gross","fee","net","materialsNet","labourNet"] as const).some(k=>record.ledger![k]!==ledger[k]))return "An existing allocation cannot be overwritten by a different snapshot.";
  if(record.ledger&&(ledger.materialsReleased<record.ledger.materialsReleased||ledger.labourReleased<record.ledger.labourReleased))return "A release cannot disappear from the ledger.";
  if(ledger.status!=="credited"&&ledger.status!=="processing")return "Unknown ledger state.";
  return null;
}

export { balanceVerified, quoteConsistent, sameQuote } from './model';

import { BalancePayment, BookingLedger, BookingRecord, BookingRole } from "@/lib/bookings/model";
import { balanceVerified, ledgerError, quoteConsistent, QuoteDraft, quoteFromDraft, sameQuote, validBalanceReceipt } from "@/lib/bookings/quotes";
import { applySampleCommand, SampleCommand, sampleDepositBreakdown } from "./inspectionModel";

export type QuoteCommand=
 | {type:"send_quote";draft:QuoteDraft}
 | {type:"accept_quote";version:number}
 | {type:"balance_checkout";version:number}
 | {type:"balance_payment";receipt:BalancePayment}
 | {type:"ledger_snapshot";ledger:BookingLedger};
export type BookingCommand=SampleCommand|QuoteCommand;
const quoteTypes=new Set(["send_quote","accept_quote","balance_checkout","balance_payment","ledger_snapshot"]);
/** Confirmed booking fee rule, applied only to fictional amounts here. No allocation policy is implied. */
export function sampleQuoteBreakdown(total:number,deposit:number) {
  if(![total,deposit].every(a=>Number.isSafeInteger(a)&&a>=0)||deposit>total)throw new Error("Sample quote amounts are invalid.");
  const fee=Math.min(Math.round(total*0.05),2000000),depositFee=sampleDepositBreakdown(deposit).fee,remaining=total-deposit,balanceFee=fee-depositFee;
  return {total,deposit,remaining,fee,net:total-fee,depositFee,depositNet:deposit-depositFee,balanceFee,balanceNet:remaining-balanceFee};
}
export function applyBookingCommand(record:BookingRecord,role:BookingRole,revision:number,key:string,command:BookingCommand):BookingRecord {
  if(!quoteTypes.has(command.type))return applySampleCommand(record,role,revision,key,command as SampleCommand);
  if(record.source!=="sample"||!key.trim())throw new Error("A sample record and command key are required.");
  const cmd=command as QuoteCommand;
  const required=cmd.type==="send_quote"?"provider":"customer";if(role!==required)throw new Error("This action belongs to the other participant.");
  if(record.commands.includes(key))return record;
  if(record.revision!==revision)throw new Error("This booking changed. Refresh before trying again.");
  if(record.cancelled)throw new Error("This booking has ended.");
  const next:BookingRecord=JSON.parse(JSON.stringify(record));
  if(cmd.type==="send_quote") {
    next.quote=quoteFromDraft(record,cmd.draft);next.stage="quote_sent";delete next.acceptedQuote;delete next.balancePayment;delete next.balancePaymentReference;delete next.ledger;
  } else if(cmd.type==="accept_quote") {
    if(!record.quote||!quoteConsistent(record,record.quote)||record.quote.version!==cmd.version||record.stage!=="quote_sent"||balanceVerified(record))throw new Error("Review the current final quote before accepting it.");
    next.acceptedQuote=JSON.parse(JSON.stringify(record.quote));
  } else if(cmd.type==="balance_checkout") {
    const q=record.acceptedQuote;
    if(!q||!quoteConsistent(record,q)||!record.quote||q.version!==cmd.version||!sameQuote(q,record.quote)||balanceVerified(record))throw new Error("The current final quote must be accepted before payment.");
    if(record.balancePayment?.status==="pending")throw new Error("A balance payment is pending. Check it before starting another.");
    next.balancePayment={reference:"sample-balance-"+key,bookingId:record.id,quoteVersion:q.version,purpose:"balance",amount:q.remaining,currency:"NGN",status:"pending"};next.balancePaymentReference=next.balancePayment.reference;
  } else if(cmd.type==="balance_payment") {
    const p=record.balancePayment;
    if(!p||p.status!=="pending"||!validBalanceReceipt(p,cmd.receipt))throw new Error("The payment does not match this accepted quote.");
    next.balancePayment={...p,status:cmd.receipt.status};if(cmd.receipt.status==="verified")next.stage="work_scheduled";
  } else if(cmd.type==="ledger_snapshot") {
    const error=ledgerError(record,cmd.ledger);if(error)throw new Error(error);
    if(cmd.ledger.source!=="sample-snapshot")throw new Error("Only a fictional snapshot can enter this simulator.");
    next.ledger=JSON.parse(JSON.stringify(cmd.ledger));
  }
  next.revision++;next.commands.push(key);next.events.push({id:key,type:cmd.type,revision:next.revision});return next;
}
/** Explicit example snapshot, not a chosen production allocation formula. Other quote amounts await a real ledger. */
export function canonicalSampleLedger(record:BookingRecord,status:"processing"|"credited"="credited"):BookingLedger|null {
  const q=record.acceptedQuote;
  if(!balanceVerified(record)||!q||q.materials!==4500000||q.labour!==4500000||q.depositCredit!==500000)return null;
  return {id:"sample-ledger-"+q.version,bookingId:record.id,quoteVersion:q.version,depositReference:record.payment!.reference,balanceReference:record.balancePayment!.reference,currency:"NGN",gross:9000000,fee:450000,net:8550000,materialsNet:4275000,labourNet:4275000,materialsReleased:status==="credited"?4275000:0,labourReleased:0,status,materialsCreditedAt:status==="credited"?(record.ledger?.materialsCreditedAt??new Date().toISOString()):undefined,source:"sample-snapshot"};
}

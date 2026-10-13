import { BookingRecord, money, parseMoney, VerifiedPayoutBank } from "./model";

export type BankOption={name:string;code:string};
export const sampleBanks:BankOption[]=[{name:"Access Bank",code:"sample-access"},{name:"First Bank",code:"sample-first"},{name:"GTBank",code:"sample-gtb"},{name:"UBA",code:"sample-uba"},{name:"Zenith Bank",code:"sample-zenith"}];
export function bankAccountError(bank?:BankOption,number=""):string|undefined{return !bank?"Choose a bank.":!/^\d{10}$/.test(number)?"Enter a 10-digit account number.":undefined;}
export function verifiedBankError(record:BookingRecord,bank:VerifiedPayoutBank):string|undefined{
  const identity=record.finance?.approvedIdentity;
  return !identity||identity.providerId!==record.providerId||bank.providerId!==record.providerId||bank.identityReference!==identity.reference||bank.status!=="verified"||!bank.id.startsWith("sample-")||!bank.lookupReference.startsWith("sample-")||!bank.bankName.trim()||!bank.bankCode.trim()||!/^\d{10}$/.test(bank.accountNumber)||bank.accountName!==identity.name?"A matching lookup and approved identity are required.":undefined;
}
export function payoutError(record:BookingRecord,amount:number|null):string|undefined{
  if(amount===null||!Number.isSafeInteger(amount)||amount<=0)return "Enter a payout amount greater than ₦0.";
  if(!record.wallet)return "The spendable wallet has not been verified.";
  const w=record.wallet;
  if(w.providerId!==record.providerId||w.bookingId!==record.id||w.ledgerId!==record.ledger?.id||w.currency!=="NGN"||!w.id||[w.available,w.reserved,w.materialAvailable,w.materialReserved].some(v=>!Number.isSafeInteger(v)||v<0)||w.materialAvailable>w.available||w.materialReserved>w.reserved)return "The wallet does not reconcile with this provider and ledger.";
  if(!record.finance?.bank||verifiedBankError(record,record.finance.bank))return "Add a bank account matching your approved identity.";
  if((record.repayment?.outstanding??0)>0)return "Settle the outstanding material repayment before requesting a payout.";
  if(amount>record.wallet.available)return "The amount exceeds your available balance.";
  return undefined;
}
export function payoutInputError(record:BookingRecord,value:string){return payoutError(record,parseMoney(value));}
export function financeBalances(record:BookingRecord){
  const l=record.ledger;
  return {available:record.wallet?.available, reserved:record.wallet?.reserved, pending:l?Math.max(0,l.materialsNet+l.labourNet-l.materialsReleased-l.labourReleased):undefined, posting:l?Math.max(0,l.labourReleased-(record.finance?.labourPosted??0)):0, debt:record.repayment?.outstanding??0};
}
export type FinanceActivity={id:string;title:string;amount?:number;debit?:boolean;description:string;at?:string};
/** These are distinct records; a ledger release and its wallet posting are not added twice. */
export function financeActivity(record:BookingRecord):FinanceActivity[]{
  const result:FinanceActivity[]=[],l=record.ledger;
  if(l){
    result.push({id:l.id+"-materials",title:l.materialsReleased?"Materials funds released":"Materials release processing",amount:l.materialsReleased||undefined,description:record.serviceTitle+" · Net after the booking fee",at:l.materialsCreditedAt});
    if(l.labourReleased)result.push({id:l.id+"-labour",title:"Workmanship funds released",amount:l.labourReleased,description:record.serviceTitle+" · Net after the booking fee",at:l.labourCreditedAt});
    else if(l.labourNet)result.push({id:l.id+"-pending",title:"Workmanship awaiting release",amount:l.labourNet,description:record.serviceTitle+" · Pending"});
  }
  if(record.repayment)result.push({id:record.repayment.id,title:"Materials repayment",amount:record.repayment.recovered,debit:true,description:record.repayment.outstanding?"Outstanding "+money(record.repayment.outstanding):"Settled · no new KK fee"});
  for(const p of record.finance?.payouts??[])result.push({id:p.id,title:p.status==="paid"?"Bank payout paid":p.status==="failed"?"Bank payout unsuccessful":"Bank payout pending",amount:p.amount,debit:p.status!=="failed",description:p.bank.bankName+" •••• "+p.bank.accountNumber.slice(-4)+(p.status==="pending"?" · Reserved":p.status==="failed"?" · Reservation released":" · Paid"),at:p.createdAt});
  return result;
}
export type ReportPeriod="Week"|"Month"|"Year"|"All time";
export function reportRange(period:ReportPeriod,offset:number,now=new Date()):{start:number;end:number;label:string}{
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(start);
  if(period==="All time")return {start:-Infinity,end:Infinity,label:"All time"};
  if(period==="Week"){start.setDate(start.getDate()-((start.getDay()+6)%7)+offset*7);end.setTime(start.getTime());end.setDate(start.getDate()+7);}
  else if(period==="Month"){start.setDate(1);start.setMonth(start.getMonth()+offset);end.setTime(start.getTime());end.setMonth(start.getMonth()+1);}
  else {start.setMonth(0,1);start.setFullYear(start.getFullYear()+offset);end.setTime(start.getTime());end.setFullYear(start.getFullYear()+1);}
  const options:Intl.DateTimeFormatOptions=period==="Year"?{year:"numeric"}:period==="Month"?{month:"long",year:"numeric"}:{day:"numeric",month:"short",year:"numeric"};
  return {start:+start,end:+end,label:period==="Week"?start.toLocaleDateString("en-NG",options)+" – "+new Date(+end-1).toLocaleDateString("en-NG",{day:"numeric",month:"short"}):start.toLocaleDateString("en-NG",options)};
}
export function financeReport(record:BookingRecord,period:ReportPeriod,offset=0,now=new Date()){
  const range=reportRange(period,offset,now),l=record.ledger;
  const include=(at?:string)=>period==="All time"||!!at&&Date.parse(at)>=range.start&&Date.parse(at)<range.end;
  // The legacy ledger does not supply a materials credit date or gross release allocations.
  const materials=l&&include(l.materialsCreditedAt)?l.materialsReleased:0,labour=l&&include(l.labourCreditedAt)?l.labourReleased:0;
  return {...range,materials,labour,netReleased:materials+labour,undatedReleases:period!=="All time"&&(!!l?.materialsReleased&&!l.materialsCreditedAt||!!l?.labourReleased&&!l.labourCreditedAt),grossPaid:period==="All time"?l?.gross:undefined,bookingFee:period==="All time"?l?.fee:undefined};
}

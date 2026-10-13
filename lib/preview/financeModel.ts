import { BookingRecord, BookingRole, completedByCustomer, SamplePayout, VerifiedPayoutBank } from "@/lib/bookings/model";
import { payoutError, verifiedBankError } from "@/lib/bookings/finance";
import { applyWorkCommand, WorkBookingCommand } from "./workModel";

export type FinanceCommand=
 | {type:"finance_setup"}
 | {type:"verify_payout_bank";bank:VerifiedPayoutBank}
 | {type:"post_labour_wallet";ledgerId:string;reference:string;amount:number}
 | {type:"authorize_payout";bankId:string;amount:number}
 | {type:"request_payout";authorizationReference:string;materialAmount:number}
 | {type:"payout_result";receipt:Pick<SamplePayout,"id"|"reference"|"providerId"|"walletId"|"currency"|"amount"|"authorizationReference">&{bankId:string;status:"pending"|"paid"|"failed"}};
export type FinanceBookingCommand=WorkBookingCommand|FinanceCommand;
const financeTypes=new Set(["finance_setup","verify_payout_bank","post_labour_wallet","authorize_payout","request_payout","payout_result"]);
export function applyFinanceCommand(record:BookingRecord,role:BookingRole,revision:number,key:string,command:FinanceBookingCommand):BookingRecord{
  if(!financeTypes.has(command.type))return applyWorkCommand(record,role,revision,key,command as WorkBookingCommand);
  const c=command as FinanceCommand;
  if(record.source!=="sample"||!key.startsWith("sample-")||role!=="provider")throw new Error("Only this preview provider can apply a keyed finance event.");
  if(record.commands.includes(key))return record;
  if(record.revision!==revision)throw new Error("This wallet changed. Refresh and review before retrying.");
  const next:BookingRecord=JSON.parse(JSON.stringify(record)),at=new Date().toISOString();
  if(c.type==="finance_setup"){
    if(record.finance)throw new Error("The approved sample identity is already recorded.");
    next.finance={approvedIdentity:{providerId:record.providerId,name:"Tobi Adeyemi",reference:"sample-approved-identity-"+record.providerId},payouts:[],labourPosted:0,postings:[]};
  }else{
    if(!record.finance)throw new Error("Load the approved sample identity first.");
    const f=next.finance!,w=next.wallet;
    if(c.type==="verify_payout_bank"){
      const error=verifiedBankError(record,c.bank);if(error)throw new Error(error);
      f.bank={...c.bank};delete f.authorization;
    }else if(c.type==="post_labour_wallet"){
      const l=record.ledger;
      if(!w||!l||w.providerId!==record.providerId||w.bookingId!==record.id||w.ledgerId!==l.id||w.currency!=="NGN"||!completedByCustomer(record)||l.labourReleaseStatus!=="credited"||c.ledgerId!==l.id||c.amount!==l.labourReleased||c.reference!=="sample-wallet-credit-"+l.id+"-labour-"+l.labourReleased||c.amount<=0||!Number.isSafeInteger(c.amount)||f.labourPosted>c.amount)throw new Error("This wallet credit does not match confirmed completed work and its ledger release.");
      const delta=c.amount-f.labourPosted;if(!delta)throw new Error("This labour credit is already posted.");
      if(!Number.isSafeInteger(w.available+delta))throw new Error("The wallet amount is invalid.");
      w.available+=delta;f.labourPosted=c.amount;f.postings.push({id:c.reference,ledgerId:l.id,amount:delta,component:"labour",at});
    }else if(c.type==="authorize_payout"){
      const error=payoutError(record,c.amount);if(error)throw new Error(error);
      if(c.bankId!==f.bank!.id)throw new Error("Review the current bank destination.");
      f.authorization={reference:key,providerId:record.providerId,walletId:w!.id,bankId:c.bankId,amount:c.amount,currency:"NGN"};
    }else if(c.type==="request_payout"){
      const a=f.authorization,b=f.bank;
      if(!a||!b||a.reference!==c.authorizationReference||a.providerId!==record.providerId||a.walletId!==w?.id||a.bankId!==b.id||a.currency!=="NGN")throw new Error("Verified authorization must match the amount, wallet and bank destination.");
      const error=payoutError(record,a.amount);if(error)throw new Error(error);
      // An explicit reservation snapshot supplies the material lot. The client never chooses production lot policy.
      if(!Number.isSafeInteger(c.materialAmount)||c.materialAmount<0||c.materialAmount>a.amount||c.materialAmount>w!.materialAvailable||a.amount-c.materialAmount>w!.available-w!.materialAvailable)throw new Error("The reservation does not reconcile with spendable wallet lots.");
      w!.available-=a.amount;w!.reserved+=a.amount;w!.materialAvailable-=c.materialAmount;w!.materialReserved+=c.materialAmount;
      f.payouts.push({id:key,reference:"sample-payout-"+key,providerId:record.providerId,walletId:w!.id,currency:"NGN",amount:a.amount,materialAmount:c.materialAmount,bank:{...b},authorizationReference:a.reference,status:"pending",createdAt:at,updatedAt:at});delete f.authorization;
    }else if(c.type==="payout_result"){
      const p=f.payouts.find(v=>v.id===c.receipt.id),r=c.receipt;
      if(!p||!w||p.status!=="pending"||(["reference","providerId","walletId","currency","amount","authorizationReference"] as const).some(k=>p[k]!==r[k])||r.bankId!==p.bank.id||!["pending","paid","failed"].includes(r.status)||w.reserved<p.amount||w.materialReserved<p.materialAmount)throw new Error("This result does not match the reserved payout.");
      if(r.status!=="pending"){
        w.reserved-=p.amount;w.materialReserved-=p.materialAmount;
        if(r.status==="paid")w.materialWithdrawn+=p.materialAmount;
        else{
          w.available+=p.amount;w.materialAvailable+=p.materialAmount;
          // A failed payout releases its lot; an existing cancellation must recover it exactly once.
          if(next.cancelled&&next.repayment?.outstanding&&next.repayment.payment?.status!=="pending"){const recovery=Math.min(p.materialAmount,next.repayment.outstanding,w.available);w.available-=recovery;w.materialAvailable-=recovery;next.repayment.recovered+=recovery;next.repayment.outstanding-=recovery;next.repayment.status=next.repayment.outstanding?"due":"settled";}
        }
      }
      p.status=r.status;p.updatedAt=at;
    }
  }
  next.revision++;next.commands.push(key);next.events.push({id:key,type:c.type,revision:next.revision});return next;
}
export function sampleBankProof(record:BookingRecord,bankName:string,bankCode:string,accountNumber:string,accountName=record.finance?.approvedIdentity.name??""):VerifiedPayoutBank{
  return {id:"sample-bank-"+bankCode+"-"+accountNumber,providerId:record.providerId,identityReference:record.finance?.approvedIdentity.reference??"",lookupReference:"sample-lookup-"+bankCode+"-"+accountNumber,bankName,bankCode,accountNumber,accountName,status:"verified"};
}

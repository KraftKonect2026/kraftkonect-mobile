import { accountReadSnapshot } from "@/lib/account/liveAccount";
import { parseOverview, PayoutOverview } from "./livePayouts";

export type RecordedBank={bankName:string;accountName:string;last4:string};
export type RecordedPayout={id:string;amount:number;currency:"NGN";status:string;at?:string};
export type ProviderFinanceRead={ownerId:string;providerId?:string;setupNeeded:boolean;reportedBalance?:number;payouts?:RecordedPayout[];bank?:RecordedBank|null;overview?:PayoutOverview;errors:string[]};
export const liveFinanceSteps=["earnings","activity","report","repayments","banks","choose-bank","bank","amount","review","payout"] as const;
export type LiveFinanceStep=typeof liveFinanceSteps[number];
export function liveFinanceStep(value:unknown):LiveFinanceStep{return typeof value==="string"&&(liveFinanceSteps as readonly string[]).includes(value)?value as LiveFinanceStep:"earnings";}
function object(value:unknown){if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("The financial record could not be loaded.");return value as Record<string,unknown>;}
function text(value:unknown,max=200){return typeof value==="string"&&value.trim()&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():undefined;}
function identifier(value:unknown){const result=text(value);if(!result||/\s/.test(result))throw new Error("The financial record identity could not be confirmed.");return result;}
function amount(value:unknown){if(!Number.isSafeInteger(value)||(value as number)<0)throw new Error("The recorded amount could not be confirmed.");return value as number;}
export function recordedBalance(response:unknown){return amount(response);}
/** Existing amountCents reads use the app's NGN contract; this does not create a new wallet or payout proof. */
export function recordedPayouts(response:unknown):RecordedPayout[]{
  if(!Array.isArray(response))throw new Error("Your saved payouts could not be loaded.");
  const seen=new Set<string>();
  return response.map(value=>{
    const row=object(value),id=identifier(row.id);if(seen.has(id))throw new Error("The saved payout records contain duplicate identities.");seen.add(id);
    return {id,amount:amount(row.amountCents),currency:"NGN",status:text(row.status,80)??"Status unavailable",at:typeof row.createdAt==="string"&&row.createdAt.length<=80&&Number.isFinite(Date.parse(row.createdAt))?row.createdAt:undefined};
  });
}
export function recordedBank(response:unknown):RecordedBank|null{
  if(response===null)return null;const row=object(response),bankName=text(row.bankName,120),accountName=text(row.accountName,200);
  if(!bankName||!accountName||typeof row.accountNumber!=="string"||! /^\d{10}$/.test(row.accountNumber))throw new Error("Your saved payout account could not be confirmed.");
  return {bankName,accountName,last4:row.accountNumber.slice(-4)};
}
export function recordedPayout(snapshot:ProviderFinanceRead,id:unknown){const payout=typeof id==="string"&&snapshot.payouts?.find(value=>value.id===id);if(!payout)throw new Error("Choose a saved payout from your payment activity.");return payout;}
export function recordedStatus(payout:RecordedPayout){
  const known:Record<string,string>={pending:"Pending",processing:"Processing",completed:"Completed",paid:"Paid",failed:"Failed"};
  return (known[payout.status]??"Status unavailable")+" · receipt unavailable";
}
/** The owned read frame may display existing records; it never grants new payout authorization. */
export async function readOwnedProviderFinance(ownerId:string,reader:{me:()=>Promise<unknown>;profile:()=>Promise<unknown>;balance:()=>Promise<unknown>;payouts:()=>Promise<unknown>;bank:()=>Promise<unknown>;overview?:()=>Promise<unknown>;isCurrent:()=>boolean}):Promise<ProviderFinanceRead>{
  const current=()=>{if(!reader.isCurrent())throw new Error("The signed-in identity changed. Refresh earnings.");};
  current();const [me,profile]=await Promise.all([reader.me(),reader.profile()]);current();accountReadSnapshot(ownerId,me);
  if(profile===null)return {ownerId,setupNeeded:true,errors:[]};
  const providerId=identifier(object(profile).id);
  const reads=await Promise.allSettled([reader.balance(),reader.payouts(),reader.bank(),reader.overview?reader.overview():Promise.resolve(undefined)]);current();
  const snapshot:ProviderFinanceRead={ownerId,providerId,setupNeeded:false,errors:[]};
  const apply=(result:PromiseSettledResult<unknown>,label:string,install:(value:unknown)=>void)=>{try{if(result.status!=="fulfilled")throw new Error(label);install(result.value);}catch{snapshot.errors.push(label);}};
  apply(reads[0],"Your account balance could not be loaded.",value=>{snapshot.reportedBalance=recordedBalance(value);});
  apply(reads[1],"Your saved payout activity could not be loaded.",value=>{snapshot.payouts=recordedPayouts(value);});
  apply(reads[2],"Your saved payout account could not be loaded.",value=>{snapshot.bank=recordedBank(value);});
  if(reader.overview)apply(reads[3],"Your wallet and payout records could not be loaded.",value=>{snapshot.overview=parseOverview(value);});
  return snapshot;
}

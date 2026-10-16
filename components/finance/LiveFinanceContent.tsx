import { ReactNode, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Input } from "@/components/Input";
import { LogoLoader } from "@/components/LogoLoader";
import { SelectionChip } from "@/components/SelectionChip";
import { DetailCard, DetailRow, Heading, bs } from "@/components/bookings/Parts";
import { ReportPeriod } from "@/lib/bookings/finance";
import { EarningsReport } from "@/lib/provider/liveReport";
import { money, parseMoney } from "@/lib/bookings/model";
import { LiveFinanceStep, ProviderFinanceRead, recordedPayout, recordedStatus } from "@/lib/provider/liveFinance";
import { payoutAmountError, payoutStatusLabel, PayoutBank, WalletPayout } from "@/lib/provider/livePayouts";
import { AmountCard, FinanceFrame, FinanceRow, SmallBalance } from "./FinanceScreens";
import Colors from "@/constants/colors";

export type PayoutActions={loadBanks:()=>Promise<{name:string;code:string}[]>;resolve:(bankCode:string,accountNumber:string)=>Promise<string>;saveBank:(bankCode:string,accountNumber:string)=>Promise<PayoutBank>;requestPayout:(amountMinor:number)=>Promise<WalletPayout>;loadReport:(period:ReportPeriod,offset:number)=>Promise<EarningsReport>;refresh:()=>Promise<void>|void};
export function LiveFinanceContent({snapshot,step,payoutId,loading,error,onRetry,onBack,onGo,onUnavailable,onSetup,preview=false,actions}:{
 snapshot?:ProviderFinanceRead;step:LiveFinanceStep;payoutId?:string;loading:boolean;error?:string;onRetry:()=>void;onBack:()=>void;onGo:(step:LiveFinanceStep,id?:string)=>void;onUnavailable:(action:string)=>void;onSetup:()=>void;preview?:boolean;actions?:PayoutActions;
}){
  const [amount,setAmount]=useState(""),[period,setPeriod]=useState("All time");
  // Bank account form and payout request (real payouts only).
  const [banks,setBanks]=useState<{name:string;code:string}[]>(),[bankQuery,setBankQuery]=useState(""),[bankPick,setBankPick]=useState<{name:string;code:string}>(),[number,setNumber]=useState(""),[resolved,setResolved]=useState<string>(),[busy,setBusy]=useState(false),[problem,setProblem]=useState<string>();
  useEffect(()=>{if(step==="choose-bank"&&!banks&&actions){let alive=true;setProblem(undefined);actions.loadBanks().then(list=>{if(alive)setBanks(list);}).catch(e=>{if(alive)setProblem(e instanceof Error?e.message:"The bank list could not be loaded.");});return()=>{alive=false;};}},[step,banks,actions]);
  const attempt=async(work:()=>Promise<void>)=>{if(busy)return;setBusy(true);setProblem(undefined);try{await work();}catch(e){setProblem(e instanceof Error?e.message:"Something went wrong. Please try again.");}finally{setBusy(false);}};
  const live=snapshot&&!snapshot.setupNeeded&&snapshot.overview&&actions?snapshot.overview:undefined;
  const titles:Record<LiveFinanceStep,string>={earnings:"Earnings & payouts",activity:"Payment activity",report:"Earnings report",repayments:"Material repayments",banks:"Payout accounts","choose-bank":"Choose bank",bank:"Payout account details",amount:"Request payout",review:"Review payout",payout:"Bank payout"};
  let title=titles[step],body:ReactNode,footer:ReactNode;
  if(loading)body=<LogoLoader label="Loading earnings"/>;
  else if(error||!snapshot)body=<><Callout title="Earnings unavailable" tone="error" message={error??"Your financial records could not be loaded. Try again later."}/><Button title="Try again" onPress={onRetry}/></>;
  else if(snapshot.setupNeeded)body=<><Callout title="Provider setup" message="Complete provider setup to view your provider account records."/><Button title="View provider setup" onPress={onSetup}/></>;
  else if(live&&actions){
    const o=live,typed=parseMoney(amount),amountProblem=amount.trim()?payoutAmountError(o,typed):undefined;
    const bankLine=o.bank?o.bank.bankName+" •••• "+o.bank.accountLast4:"Add your payout bank account";
    const problemBox=problem&&<Callout tone="error" message={problem}/>;
    if(step==="earnings"){
      body=<><AmountCard label="Available to withdraw" value={o.spendable} caption={o.repaymentOwed>0?"Part of your balance is set aside to repay a refund.":"Money from confirmed jobs that you can send to your bank."} smallCaption/><View style={bs.row}><SmallBalance label="Awaiting release" value={o.pending}/><SmallBalance label="Material repayment" value={o.repaymentOwed} warning/></View>{o.reserved>0&&<Callout message={money(o.reserved)+" is on its way to your bank."}/>}<View style={{gap:20}}><FinanceRow title="Earnings report" description="Workmanship and materials by period" onPress={()=>onGo("report")}/><FinanceRow title="Material cost repayment" description={o.repayments.length?o.repayments.length+" cancelled job"+(o.repayments.length>1?"s":"")+" with a refund":"Refund material cost of cancelled jobs"} onPress={()=>onGo("repayments")}/><FinanceRow title="Payment activity" description="Payouts sent to your bank" onPress={()=>onGo("activity")}/><FinanceRow title="Payout accounts" description={bankLine} onPress={()=>onGo("banks")}/></View></>;
      footer=<Button title="Request payout" onPress={()=>onGo("amount")}/>;
    }else if(step==="activity"){
      body=o.payouts.length?<View style={{gap:20}}>{o.payouts.map(payout=><FinanceRow key={payout.id} title="Bank payout" accessibilityLabel={"Bank payout, "+money(payout.amount)+", "+payoutStatusLabel(payout)} right={money(payout.amount)} description={payoutStatusLabel(payout)+" · "+(payout.at?new Date(payout.at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"")} onPress={()=>onGo("payout",payout.id)}/>)}</View>:<Callout title="No payouts yet" message="Payouts you request will appear here."/>;
    }else if(step==="payout"){
      const payout=o.payouts.find(v=>v.id===payoutId);
      body=payout?<><AmountCard label="Payout amount" value={payout.amount}/><DetailCard quiet><DetailRow label="Status" value={payoutStatusLabel(payout)}/><DetailRow label="Requested" value={payout.at?new Date(payout.at).toLocaleString("en-NG"):"—"}/>{payout.paidAt&&<DetailRow label="Paid" value={new Date(payout.paidAt).toLocaleString("en-NG")}/>}<DetailRow label="Sent to" value={payout.bankName+" •••• "+payout.accountLast4}/><DetailRow label="Account name" value={payout.accountName}/><DetailRow label="Reference" value={payout.reference}/></DetailCard>{payout.status==="failed"&&<Callout tone="error" title="This payout didn’t go through" message="The money is back in your wallet. You can request it again."/>}{payout.status==="pending"&&<Callout message="We’re confirming this with the bank. If it doesn’t move soon, contact support with the reference above."/>}</>:<Callout title="Payout unavailable" message="Open a payout from your payment activity."/>;
      footer=<Button title="View activity" onPress={()=>onGo("activity")}/>;
    }else if(step==="banks"){
      body=<>{o.bank?<FinanceRow title={bankLine} description={o.bank.accountName} forward={false}/>:<Callout title="No payout account yet" message="Add the bank account you want to be paid into."/>}{o.bank?.review==="needs_review"&&<Callout tone="warning" title="We need to check this account" message="The account name doesn’t match your name on KraftKonect, so payouts are paused. Contact support and we’ll review it."/>}{o.bank&&o.bank.review!=="needs_review"&&<Callout tone="success" message="This account is ready for payouts."/>}</>;
      footer=<Button title={o.bank?"Change bank account":"Add bank account"} onPress={()=>{setBankPick(undefined);setNumber("");setResolved(undefined);setProblem(undefined);onGo("bank");}}/>;
    }else if(step==="choose-bank"){
      const matches=(banks??[]).filter(b=>b.name.toLocaleLowerCase().includes(bankQuery.trim().toLocaleLowerCase()));
      body=<><Input label="Search banks" placeholder="e.g. Access" value={bankQuery} onChangeText={setBankQuery} autoCapitalize="none" neutralBorderColor={Colors.borderStrong}/>{problemBox}{!banks&&!problem?<LogoLoader label="Loading banks"/>:<View style={{gap:0}}>{matches.map(b=><FinanceRow key={b.code} title={b.name} onPress={()=>{setBankPick(b);setResolved(undefined);setProblem(undefined);onGo("bank");}}/>)}{banks&&!matches.length&&<Callout message="No bank matches that search."/>}</View>}</>;
    }else if(step==="bank"){
      body=<><FinanceRow title="Bank" description={bankPick?.name??"Choose bank"} onPress={()=>onGo("choose-bank")}/><Input label="Account number" value={number} onChangeText={v=>{setNumber(v.replace(/\D/g,"").slice(0,10));setResolved(undefined);setProblem(undefined);}} keyboardType="number-pad" maxLength={10} autoComplete="off" neutralBorderColor={Colors.borderStrong}/>{resolved&&<Callout tone="success" title={resolved} message="Check that this is your account name before saving."/>}{problemBox}<Callout message="The account name must match your name on KraftKonect. We never store your full account number in this app."/></>;
      footer=resolved
        ?<><Button title="Save this account" loading={busy} onPress={()=>void attempt(async()=>{await actions.saveBank(bankPick!.code,number);await actions.refresh();onGo("banks");})}/><Button title="Not my account" variant="outline" disabled={busy} onPress={()=>{setResolved(undefined);}}/></>
        :<Button title="Verify account" loading={busy} disabled={!bankPick||number.length!==10} onPress={()=>void attempt(async()=>{setResolved(await actions.resolve(bankPick!.code,number));})}/>;
    }else if(step==="amount"){
      body=<><AmountCard label="Available to withdraw" value={o.spendable}/><Input label="Payout amount" placeholder="Enter amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" maxLength={16} neutralBorderColor={Colors.borderStrong}/>{amountProblem&&<Callout tone="error" message={amountProblem}/>}<FinanceRow title="Send to" description={bankLine} onPress={()=>onGo("banks")}/></>;
      footer=<Button title="Review payout" disabled={!amount.trim()||!!amountProblem} onPress={()=>onGo("review")}/>;
    }else if(step==="review"){
      const reviewProblem=payoutAmountError(o,typed);
      body=<><AmountCard label="You’re sending" value={typed??undefined}/><DetailCard quiet><DetailRow label="To" value={bankLine}/><DetailRow label="Account name" value={o.bank?.accountName??"—"}/><DetailRow label="Arrives" value="Usually within minutes"/></DetailCard>{reviewProblem&&<Callout tone="error" message={reviewProblem}/>}{problemBox}<Callout message="The money leaves your wallet now. If the bank can’t accept it, it comes straight back."/></>;
      footer=<Button title="Send payout" loading={busy} disabled={!!reviewProblem||typed===null} onPress={()=>void attempt(async()=>{const payout=await actions.requestPayout(typed!);setAmount("");await actions.refresh();onGo("payout",payout.id);})}/>;
    }else if(step==="repayments"){
      body=o.repayments.length?<View style={{gap:20}}>{o.repayments.map(r=><FinanceRow key={r.bookingId} forward={false} title={"Booking "+(r.bookingRef??r.bookingId.slice(0,8))} right={money(r.outstanding)} description={r.outstanding>0?"Owed "+money(r.outstanding)+" of "+money(r.due)+(r.deadline?" · by "+new Date(r.deadline).toLocaleString("en-NG",{timeZone:"Africa/Lagos"}):""):"Settled · "+money(r.due)}/>)}</View>:<Callout title="Nothing to repay" message="If a customer is refunded for money you already received, it shows here."/>;
    }else{
      body=<LiveReport load={actions.loadReport} onActivity={()=>onGo("activity")}/>;
    }
  }
  else if(step==="earnings"){
    body=<><AmountCard label="Account balance" value={snapshot.reportedBalance} caption="Payout availability requires verified wallet and authorization details." smallCaption/><View style={bs.row}><SmallBalance label="Awaiting release"/><SmallBalance label="Material repayment" warning/></View><View style={{gap:20}}><FinanceRow title="Earnings report" description="Workmanship and materials by period" onPress={()=>onGo("report")}/><FinanceRow title="Material cost repayment" description="Refund material cost of cancelled jobs" onPress={()=>onGo("repayments")}/><FinanceRow title="Payment activity" description="Job payments, payouts and repayments" onPress={()=>onGo("activity")}/><FinanceRow title="Payout accounts" description={snapshot.bank?snapshot.bank.bankName+" •••• "+snapshot.bank.last4:snapshot.bank===null?"Add your payout bank account":"Payout account unavailable"} onPress={()=>onGo("banks")}/></View></>;
    footer=<Button title="Request payout" onPress={()=>onGo("amount")}/>;
  }else if(step==="activity"){
    title="Payment activity";
    body=<><Callout title="Payment records" message="This view includes saved bank payouts. Job payment, release and repayment records could not be loaded."/>{snapshot.payouts===undefined?<Callout title="Payout activity unavailable" message="Your saved records could not be loaded. They have not been removed."/>:snapshot.payouts.length?<View style={{gap:20}}>{snapshot.payouts.map(payout=><FinanceRow key={payout.id} title="Bank payout" accessibilityLabel={"Bank payout, "+money(payout.amount)+", "+recordedStatus(payout)+", "+(payout.at?new Date(payout.at).toLocaleString("en-NG"):"Date unavailable")} right={money(payout.amount)} description={recordedStatus(payout)+" · "+(payout.at?new Date(payout.at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"Date unavailable")} onPress={()=>onGo("payout",payout.id)}/>)}</View>:<Callout title="No saved bank payouts" message="Your bank payout records will appear here."/>}</>;
  }else if(step==="payout"){
    title="Bank payout";
    try{const payout=recordedPayout(snapshot,payoutId);body=<><AmountCard label="Recorded payout amount" value={payout.amount}/><DetailCard quiet><DetailRow label="Status" value={recordedStatus(payout)}/><DetailRow label="Date" value={payout.at?new Date(payout.at).toLocaleString("en-NG"):"Date unavailable"}/><DetailRow label="Transfer reference" value="Unavailable"/><DetailRow label="Original destination" value="Unavailable"/></DetailCard><Callout message="This saved status does not include a matching transfer receipt. Current bank details are separate from this payout’s original destination."/></>;}catch{body=<Callout title="Payout unavailable" message="Open a saved payout from your payment activity."/>;}
    footer=<Button title="View activity" onPress={()=>onGo("activity")}/>;
  }else if(step==="banks"){
    title="Payout accounts";
    body=<>{snapshot.bank?<FinanceRow title={snapshot.bank.bankName+" •••• "+snapshot.bank.last4} description={snapshot.bank.accountName} onPress={()=>onGo("bank")}/>:<Callout title={snapshot.bank===null?"No saved payout account":"Payout account unavailable"} message={snapshot.bank===null?"Add a bank account in your approved identity name.":"Your saved bank details could not be loaded. Try again later."}/>}<Callout title="Verified identity required" message="A saved account name does not confirm bank ownership or authorize a payout. Your approved legal identity could not be loaded."/></>;
    footer=<Button title={snapshot.bank?"Update bank account":"Add bank account"} onPress={()=>onGo("bank")}/>;
  }else if(step==="bank"){
    title="Payout account details";
    body=<>{snapshot.bank&&<DetailCard quiet><DetailRow label="Bank" value={snapshot.bank.bankName}/><DetailRow label="Account number" value={"•••• "+snapshot.bank.last4}/><DetailRow label="Recorded account name" value={snapshot.bank.accountName}/></DetailCard>}<Callout title="Bank verification unavailable" message="Your approved legal identity and bank verification could not be confirmed. Your saved bank details stay on your account."/></>;
    footer=<Button title="Continue to bank verification" onPress={()=>onUnavailable("Bank verification")}/>;
  }else if(step==="amount"){
    title="Request payout";
    body=<><AmountCard label="Account balance" value={snapshot.reportedBalance}/><Callout title="Payout availability unavailable" message="Wallet reservations, eligible funds and payout authorization could not be confirmed. An account balance alone does not authorize a payout."/><Input label="Payout amount" placeholder="Enter amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" maxLength={16} neutralBorderColor={Colors.borderStrong}/><FinanceRow title="Send to" description={snapshot.bank?snapshot.bank.bankName+" •••• "+snapshot.bank.last4:"Payout account unavailable"} onPress={()=>onGo("banks")}/></>;
    footer=<Button title="Review payout" disabled={parseMoney(amount)===null||parseMoney(amount)===0} onPress={()=>onUnavailable("Payout authorization")}/>;
  }else if(step==="report"){
    title="Earnings report";
    body=<><View style={[bs.row,{gap:8,flexWrap:"wrap"}]}>{["Week","Month","Year","All time"].map(value=><SelectionChip key={value} label={value} selected={period===value} onPress={()=>setPeriod(value)} style={{paddingHorizontal:8}}/>)}</View><AmountCard label="Net released"/><Callout title={period+" report unavailable"} message="Confirmed release dates, materials, labour and assessed fees could not be loaded. Completed job prices are separate from released earnings."/></>;
  }else{
    title="Material repayments";body=<Callout title="Repayments unavailable" message="Your outstanding and settled repayments could not be loaded. They have not been cleared."/>;
  }
  return <FinanceFrame preview={preview} onBack={onBack} footer={footer}><Heading title={title}/>{body}{snapshot&&!loading&&snapshot.errors.length>0&&<><Callout tone="error" message={snapshot.errors.join(" ")}/><Button title="Refresh records" variant="outline" onPress={onRetry}/></>}</FinanceFrame>;
}

const PERIODS:ReportPeriod[]=["Week","Month","Year","All time"];
/** Money released to the provider in a week, month, year or ever, as the server added it up. */
function LiveReport({load,onActivity}:{load:(period:ReportPeriod,offset:number)=>Promise<EarningsReport>;onActivity:()=>void}){
  const [period,setPeriod]=useState<ReportPeriod>("Month"),[offset,setOffset]=useState(0),[report,setReport]=useState<EarningsReport>(),[problem,setProblem]=useState<string>(),[tries,setTries]=useState(0),loadRef=useRef(load);loadRef.current=load;
  useEffect(()=>{let alive=true;setReport(undefined);setProblem(undefined);loadRef.current(period,offset).then(r=>{if(alive)setReport(r);}).catch(e=>{if(alive)setProblem(e instanceof Error?e.message:"Your earnings report could not be loaded.");});return()=>{alive=false;};},[period,offset,tries]);
  return <>
    <View style={[bs.row,{gap:8,flexWrap:"wrap"}]}>{PERIODS.map(v=><SelectionChip key={v} label={v} selected={period===v} onPress={()=>{setPeriod(v);setOffset(0);}} style={{paddingHorizontal:8}}/>)}</View>
    {period!=="All time"&&<View style={[bs.row,{gap:8}]}><Button title="Previous" variant="outline" size="compact" onPress={()=>setOffset(offset-1)}/><AppText variant="label" style={{flex:1,textAlign:"center"}}>{report?.label??"…"}</AppText><Button title="Next" variant="outline" size="compact" disabled={offset>=0} onPress={()=>setOffset(offset+1)}/></View>}
    {problem?<><Callout tone="error" message={problem}/><Button title="Try again" onPress={()=>setTries(tries+1)}/></>:!report?<LogoLoader label="Loading your report"/>:<>
      <AmountCard label="Net released" value={report.netReleased} caption={report.jobs?report.jobs+" job"+(report.jobs>1?"s":"")+" · after KraftKonect fees.":"Nothing was released in this period."}/>
      <DetailCard quiet backgroundColor={Colors.controlQuiet} title="Released payment breakdown">
        <DetailRow label="Net workmanship" value={money(report.labour)}/>
        <DetailRow label="Net materials funds" value={money(report.materials)}/>
        {report.inspection>0&&<DetailRow label="Inspection fees" value={money(report.inspection)}/>}
        <DetailRow label="Net released" value={money(report.netReleased)} total/>
        <DetailRow label="Customers paid" value={money(report.grossPaid)}/>
        <DetailRow label="KraftKonect booking fee" value={"− "+money(report.fee)}/>
      </DetailCard>
      <Callout message="Refunds taken back from your balance are not subtracted here. They appear in Payment activity."/>
      <FinanceRow title="Payment activity" description="View the individual payment records." onPress={onActivity}/>
    </>}
  </>;
}

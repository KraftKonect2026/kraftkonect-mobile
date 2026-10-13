import { ReactNode, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Input } from "@/components/Input";
import { LogoLoader } from "@/components/LogoLoader";
import { SelectionChip } from "@/components/SelectionChip";
import { DetailCard, DetailRow, Heading, bs } from "@/components/bookings/Parts";
import { money, parseMoney } from "@/lib/bookings/model";
import { LiveFinanceStep, ProviderFinanceRead, recordedPayout, recordedStatus } from "@/lib/provider/liveFinance";
import { AmountCard, FinanceFrame, FinanceRow, SmallBalance } from "./FinanceScreens";
import Colors from "@/constants/colors";

export function LiveFinanceContent({snapshot,step,payoutId,loading,error,onRetry,onBack,onGo,onUnavailable,onSetup,preview=false}:{
 snapshot?:ProviderFinanceRead;step:LiveFinanceStep;payoutId?:string;loading:boolean;error?:string;onRetry:()=>void;onBack:()=>void;onGo:(step:LiveFinanceStep,id?:string)=>void;onUnavailable:(action:string)=>void;onSetup:()=>void;preview?:boolean;
}){
  const [amount,setAmount]=useState(""),[period,setPeriod]=useState("All time");
  const titles:Record<LiveFinanceStep,string>={earnings:"Earnings & payouts",activity:"Payment activity",report:"Earnings report",repayments:"Material repayments",banks:"Payout accounts",bank:"Payout account details",amount:"Request payout",payout:"Bank payout"};
  let title=titles[step],body:ReactNode,footer:ReactNode;
  if(loading)body=<LogoLoader label="Loading earnings"/>;
  else if(error||!snapshot)body=<><Callout title="Earnings unavailable" tone="error" message={error??"Your financial records could not be loaded. Try again later."}/><Button title="Try again" onPress={onRetry}/></>;
  else if(snapshot.setupNeeded)body=<><Callout title="Provider setup" message="Complete provider setup to view your provider account records."/><Button title="View provider setup" onPress={onSetup}/></>;
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

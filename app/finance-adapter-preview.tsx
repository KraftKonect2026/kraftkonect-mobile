import { useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { LiveFinanceContent } from "@/components/finance/LiveFinanceContent";
import { LiveFinanceStep, ProviderFinanceRead, recordedBalance, recordedBank, recordedPayouts } from "@/lib/provider/liveFinance";
import Colors from "@/constants/colors";

export default function FinanceReadPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <Preview/>;}
function Preview(){
  const [step,setStep]=useState<LiveFinanceStep>("earnings"),[payoutId,setPayoutId]=useState<string>(),[error,setError]=useState(false),[dialog,setDialog]=useState<string>();
  const snapshot:ProviderFinanceRead={ownerId:"fixture-account-amina",providerId:"fixture-provider-amina",setupNeeded:false,reportedBalance:recordedBalance(12500000),bank:recordedBank({bankName:"Sample Bank",accountName:"Amina Yusuf Bello",accountNumber:"1234567890"}),payouts:recordedPayouts([{id:"fixture-payout-1",amountCents:5000000,status:"paid",createdAt:"2026-10-12T16:00:00Z"},{id:"fixture-payout-2",amountCents:2500000,status:"processing",createdAt:"2026-10-13T14:00:00Z"}]),errors:[]};
  const go=(next:LiveFinanceStep,id?:string)=>{setStep(next);setPayoutId(id);};
  return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><View style={{minHeight:44,paddingLeft:16,paddingRight:8,backgroundColor:Colors.background,flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>FINANCE READ PREVIEW · Fictional API response · No transfers or bank writes</AppText><Button title={error?"Sample":"Read error"} size="compact" variant="subtle" onPress={()=>setError(value=>!value)}/></View><LiveFinanceContent preview snapshot={error?undefined:snapshot} step={step} payoutId={payoutId} loading={false} error={error?"Sample financial read failed. Your draft and saved records are kept.":undefined} onRetry={()=>setError(false)} onBack={()=>step==="earnings"?setDialog("Account"):go("earnings")} onGo={go} onSetup={()=>setDialog("Provider setup")} onUnavailable={setDialog}/>{dialog&&<Sheet title={dialog+" unavailable"} showClose onClose={()=>setDialog(undefined)}><Callout message="This read preview cannot verify bank ownership, reserve money or request a transfer. No bank account or funds are changed."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}</View>;
}

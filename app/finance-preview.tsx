import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { Sheet } from "@/components/discovery/Parts";
import { BankDraft, FinanceFeeSheet, FinanceScreens, FinanceStep } from "@/components/finance/FinanceScreens";
import Colors from "@/constants/colors";
import { parseMoney } from "@/lib/bookings/model";
import { BankOption, bankAccountError, payoutError, ReportPeriod } from "@/lib/bookings/finance";
import { FinanceBookingCommand, sampleBankProof } from "@/lib/preview/financeModel";
import { completedSampleLedger } from "@/lib/preview/workModel";
import { commandSampleInspection, useSampleInspection } from "@/lib/preview/inspectionStore";
import { useToast } from "@/lib/toast";

const steps:FinanceStep[]=["earnings","activity","report","repayments","banks","bank","choose-bank","amount","review","payout"];
const scenarios=["Sample","Save failure","Bank mismatch","Bank error"] as const;
type Scenario=typeof scenarios[number];
export default function FinancePreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <FinancePreview/>;}
function FinancePreview(){
  const params=useLocalSearchParams<{step?:string}>(),router=useRouter(),insets=useSafeAreaInsets(),toast=useToast();const {record,error:readError,refresh}=useSampleInspection();
  const [step,setStep]=useState<FinanceStep>(steps.includes(params.step as FinanceStep)?params.step as FinanceStep:"earnings");
  const [draft,setDraft]=useState<BankDraft>({number:""}),[query,setQuery]=useState(""),[amount,setAmount]=useState("");
  const [period,setPeriod]=useState<ReportPeriod>("Week"),[offset,setOffset]=useState(0),[scenario,setScenario]=useState<Scenario>("Sample");
  const [states,setStates]=useState(false),[fees,setFees]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string>(),[lookup,setLookup]=useState<"matched"|"mismatch"|"failed">();
  const [payoutId,setPayoutId]=useState<string>();const alive=useRef(true),locked=useRef(false),intent=useRef<{signature:string;key:string}|undefined>(undefined),initializedDraft=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{if(record?.finance?.bank&&!initializedDraft.current){initializedDraft.current=true;setDraft({bank:{name:record.finance.bank.bankName,code:record.finance.bank.bankCode},number:record.finance.bank.accountNumber});setLookup("matched");}},[record?.finance?.bank]);
  const go=(next:FinanceStep)=>{setError(undefined);setStep(next);router.setParams({step:next});};
  const save=async(c:FinanceBookingCommand,revision?:number)=>{
    if(!record)throw new Error("The sample has not loaded.");
    const signature=JSON.stringify(c);if(intent.current?.signature!==signature)intent.current={signature,key:"sample-finance-"+Date.now()+"-"+Math.random().toString(36).slice(2)};
    if(scenario==="Save failure")throw new Error("Sample save failure. Your entry is retained; choose Sample in Preview states to retry.");
    const saved=await commandSampleInspection("provider",revision??record.revision,intent.current.key,c);intent.current=undefined;await refresh();return saved;
  };
  const run=async(action:()=>Promise<void>)=>{if(locked.current)return;locked.current=true;setBusy(true);setError(undefined);try{await action();}catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t save the sample.");}finally{locked.current=false;if(alive.current)setBusy(false);}};
  const setup=()=>run(async()=>{await save({type:"finance_setup"});if(alive.current)toast.info("Approved identity loaded for this fictional provider.");});
  const confirmBank=()=>run(async()=>{if(!record)throw new Error("The sample has not loaded.");const invalid=bankAccountError(draft.bank,draft.number);if(invalid)throw new Error(invalid);
    if(scenario==="Bank mismatch"){if(alive.current){setLookup("mismatch");toast.error("The account names don’t match.");}return;}
    if(scenario==="Bank error"){if(alive.current){setLookup("failed");toast.error("We couldn’t verify this account.");}return;}
    await save({type:"verify_payout_bank",bank:sampleBankProof(record,draft.bank!.name,draft.bank!.code,draft.number)});if(alive.current){setLookup("matched");go("banks");toast.success("Sample bank account verified.");}
  });
  const authorize=()=>run(async()=>{if(!record)throw new Error("The sample has not loaded.");const a=parseMoney(amount),invalid=payoutError(record,a);if(invalid)throw new Error(invalid);await save({type:"authorize_payout",bankId:record.finance!.bank!.id,amount:a!});});
  const confirmPayout=()=>run(async()=>{if(!record?.finance?.authorization||record.finance.authorization.amount!==parseMoney(amount))throw new Error("Verify approval for this amount and bank account.");
    const a=record.finance.authorization.amount,materialAmount=Math.min(a,record.wallet!.materialAvailable);const saved=await save({type:"request_payout",authorizationReference:record.finance.authorization.reference,materialAmount});if(alive.current){setPayoutId(saved.finance!.payouts.at(-1)!.id);go("payout");toast.info("Sample payout reserved. Awaiting a verified result.");}
  });
  const result=(status:"paid"|"failed")=>run(async()=>{const p=record?.finance?.payouts.find(v=>v.id===payoutId)??record?.finance?.payouts.at(-1);if(!p)throw new Error("No pending payout is selected.");await save({type:"payout_result",receipt:{id:p.id,reference:p.reference,providerId:p.providerId,walletId:p.walletId,currency:p.currency,amount:p.amount,authorizationReference:p.authorizationReference,bankId:p.bank.id,status}});if(alive.current){setStates(false);setPayoutId(p.id);go("payout");toast[status==="paid"?"success":"error"](status==="paid"?"Sample payout completed.":"Sample payout wasn’t completed.");}});
  const postLabour=()=>run(async()=>{if(!record?.ledger)throw new Error("No ledger is available.");let saved=record;if(!record.ledger.labourReleased){const ledger=completedSampleLedger(record,true);if(!ledger)throw new Error("Confirmed customer completion is required.");saved=await commandSampleInspection("customer",record.revision,"sample-finance-labour-release-"+Date.now(),{type:"ledger_snapshot",ledger});}
    const l=saved.ledger!;await save({type:"post_labour_wallet",ledgerId:l.id,reference:"sample-wallet-credit-"+l.id+"-labour-"+l.labourReleased,amount:l.labourReleased},saved.revision);if(alive.current){setStates(false);toast.success("Sample ledger release posted to the wallet.");}
  });
  const onDraft=(patch:Partial<BankDraft>)=>{setDraft(v=>({...v,...patch}));setLookup(undefined);setError(undefined);};
  const onBank=(bank:BankOption)=>{onDraft({bank});setQuery("");go("bank");};
  const back=()=>{if(step==="earnings")router.push({pathname:"/app-preview",params:{mode:"provider",tab:"account"}});else if(step==="choose-bank")go("bank");else if(step==="review")go("amount");else go("earnings");};
  const selectedPayout=record?.finance?.payouts.find(v=>v.id===payoutId)??record?.finance?.payouts.at(-1);
  return <View style={{flex:1,paddingTop:insets.top,backgroundColor:Colors.surface}}><View style={{paddingHorizontal:24,paddingVertical:8,backgroundColor:Colors.primarySoft,flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="captionRegular" color={Colors.primary} style={{flex:1}}>Local earnings preview · fictional funds</AppText><Pressable accessibilityRole="button" accessibilityLabel="Earnings preview states" onPress={()=>setStates(true)} style={{minWidth:44,minHeight:44,justifyContent:"center"}}><AppText variant="labelSmall" color={Colors.primary}>States</AppText></Pressable></View>
    {!record||readError?<View style={{padding:24,gap:16}}><HeadingFallback title={readError?"Couldn’t load the sample":"Loading earnings"}/>{readError&&<Callout message={readError} tone="error"/>}<Button title="Retry" onPress={()=>void refresh()}/></View>:!record.finance?<View style={{padding:24,gap:16}}><HeadingFallback title="Set up the earnings preview"/><Callout message="Load the approved identity for this fictional provider. Existing sample booking funds stay unchanged. This does not verify a real person or connect a bank."/><Button title="Load sample approved identity" loading={busy} onPress={setup}/><Button title="Back to booking" variant="outline" onPress={()=>router.push({pathname:"/booking-preview",params:{mode:"provider",step:"work"}})}/>{error&&<Callout message={error} tone="error"/>}</View>:<FinanceScreens record={record} step={step} onStep={go} onBack={back} onBooking={()=>router.push({pathname:"/booking-preview",params:{mode:"provider",step:"work"}})} onRepay={()=>router.push({pathname:"/booking-preview",params:{mode:"provider",step:"repayment"}})} onPayout={id=>{setPayoutId(id);go("payout");}} onFees={()=>setFees(true)} draft={draft} onDraft={onDraft} query={query} onQuery={setQuery} onBank={onBank} amount={amount} onAmount={setAmount} onConfirmBank={confirmBank} onConfirmPayout={confirmPayout} onAuthorize={authorize} period={period} onPeriod={v=>{setPeriod(v);setOffset(0);}} offset={offset} onOffset={setOffset} busy={busy} error={error} lookup={lookup} payoutId={payoutId}/>}
    {fees&&<FinanceFeeSheet onClose={()=>setFees(false)}/>}
    {states&&<Sheet title="Earnings preview" description="Development controls only. No real bank transfer or identity lookup occurs." onClose={()=>setStates(false)} showClose showHandle={false}><View style={{flexDirection:"row",gap:8,flexWrap:"wrap"}}>{scenarios.map(v=><SelectionChip key={v} label={v} selected={scenario===v} onPress={()=>{setScenario(v);setStates(false);}}/>)}</View>{selectedPayout?.status==="pending"&&<><Button title="Simulate paid payout" loading={busy} onPress={()=>void result("paid")}/><Button title="Simulate failed payout" variant="outline" disabled={busy} onPress={()=>void result("failed")}/></>}{record?.stage==="completed"&&record.ledger&&record.finance&&(record.finance.labourPosted<record.ledger.labourNet)&&<Button title="Simulate labour release and wallet posting" variant="outline" loading={busy} onPress={()=>void postLabour()}/>}<Button title="Open booking sample states" variant="outline" onPress={()=>router.push({pathname:"/booking-preview",params:{mode:"provider"}})}/>{error&&<Callout message={error} tone="error"/>}</Sheet>}
  </View>;
}
function HeadingFallback({title}:{title:string}){return <AppText variant="h2">{title}</AppText>;}

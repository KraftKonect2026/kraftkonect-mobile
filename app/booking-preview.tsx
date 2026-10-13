import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { BottomNavigation, navigationItems } from "@/components/BottomNavigation";
import { Sheet } from "@/components/discovery/Parts";
import { BookingList } from "@/components/bookings/BookingList";
import { InspectionJourney } from "@/components/bookings/InspectionJourney";
import { QuoteJourney } from "@/components/bookings/QuoteJourney";
import { WorkJourney } from "@/components/bookings/WorkJourney";
import { WorkStep } from "@/components/bookings/WorkScreens";
import Colors from "@/constants/colors";
import { balanceVerified, BookingRole, BookingSection, completedByCustomer, sampleListItem, sectionFor } from "@/lib/bookings/model";
import { applySampleCommand, sampleInspection } from "@/lib/preview/inspectionModel";
import { applyBookingCommand, canonicalSampleLedger } from "@/lib/preview/quoteModel";
import { applyWorkCommand, canonicalSampleWallet, completedSampleLedger, WorkBookingCommand } from "@/lib/preview/workModel";
import { casesFor } from "@/lib/bookings/work";
import { commandSampleInspection, resetSampleInspection, useSampleInspection } from "@/lib/preview/inspectionStore";
import { sampleConversationId } from "@/lib/messaging/model";
import { previewArt } from "@/lib/preview/discoveryFixtures";
import { addDays, localDate } from "@/lib/discovery/model";

const scenarios=["Sample","Empty","Loading","Error","Save failure","Credit delay","Credit failure","Upload failure"] as const;
type Scenario=typeof scenarios[number];
type SeedStage="request"|"response"|"pending"|"scheduled"|"complete"|"quote"|"balance"|"booked"|"credit-pending"|"working"|"work-review"|"completed"|"withdrawn"|"partial";
export default function BookingPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <BookingPreview/>;}
function BookingPreview(){
  const router=useRouter(),insets=useSafeAreaInsets();const params=useLocalSearchParams<{mode?:string;step?:string;section?:string;caseId?:string}>();
  const [role,setRole]=useState<BookingRole>(params.mode==="provider"?"provider":"customer");
  const [detail,setDetail]=useState(["detail","message","quote","work","cancel","report","proposal","repayment","review","cases","case"].includes(params.step??""));const [messageFirst,setMessageFirst]=useState(params.step==="message");
  const [quoteFlow,setQuoteFlow]=useState(params.step==="quote");
  const [workFlow,setWorkFlow]=useState(["work","cancel","report","proposal","repayment","review","cases","case"].includes(params.step??""));const [workEntry,setWorkEntry]=useState<WorkStep|undefined>(params.step==="case"?"case":params.step==="cases"?"case":params.step==="review"?"review":params.step==="repayment"?"repayment":params.step==="cancel"?"cancel":params.step==="report"?"report-category":params.step==="proposal"?"proposal":undefined);
  const [section,setSection]=useState<BookingSection>(params.section==="active"?"active":params.section==="completed"?"completed":"pending");
  const [scenario,setScenario]=useState<Scenario>("Sample");const [states,setStates]=useState(false);
  const [generation,setGeneration]=useState(0),[resetting,setResetting]=useState(false),[actionError,setActionError]=useState<string>();
  const {record,error,refresh}=useSampleInspection();const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{if(params.mode==="provider"||params.mode==="customer")setRole(params.mode);},[params.mode]);
  const onCommand=async(key:string,command:WorkBookingCommand,revision?:number)=>{
    if(scenario==="Save failure")throw new Error("Sample save failure. Your draft is retained; choose Sample in States to retry.");
    if(scenario==="Credit failure"&&command.type==="ledger_snapshot")throw new Error("Sample ledger credit failure.");
    if(!record)throw new Error("The booking has not loaded.");
    let saved=await commandSampleInspection(role,revision??record.revision,key,command);
    if(command.type==="ledger_snapshot"&&!saved.wallet&&!saved.cancelled){const wallet=canonicalSampleWallet(saved);if(wallet)saved=await commandSampleInspection("provider",saved.revision,key+"-wallet",{type:"wallet_snapshot",wallet});}
    await refresh();return saved;
  };
  const bookings=()=>{setDetail(false);setMessageFirst(false);setQuoteFlow(false);setWorkFlow(false);setWorkEntry(undefined);const next=record?sectionFor(record):"pending";setSection(next);router.setParams({step:"list",section:next});};
  const open=()=>{const work=!!record&&(balanceVerified(record)||!!record.cancelled&&!!record.refund);setDetail(true);setMessageFirst(false);setWorkFlow(work);setWorkEntry(undefined);setQuoteFlow(!work&&!!record?.quote);router.setParams({step:work?"work":record?.quote?"quote":"detail"});};
  const message=()=>{if(record)router.push({pathname:"/messages-preview",params:{mode:role,conversationId:sampleConversationId(record)}});};
  const quote=()=>{setQuoteFlow(true);setWorkFlow(false);setMessageFirst(false);setDetail(true);router.setParams({step:"quote"});};
  const work=(entry?:WorkStep)=>{setWorkEntry(entry);setWorkFlow(true);setQuoteFlow(false);setMessageFirst(false);setDetail(true);setGeneration(v=>v+1);router.setParams({step:entry==="cancel"?"cancel":entry==="report-category"?"report":entry==="proposal"?"proposal":"work"});};
  const seed=async(stage:SeedStage,remote=false)=>{
    if(resetting)return;setResetting(true);setActionError(undefined);
    try{let value=sampleInspection();if(remote)value={...value,serviceMode:"remote"};
      if(stage!=="request")value=applySampleCommand(value,"provider",value.revision,"seed-response",{type:"respond",draft:{minimum:"85000",maximum:"110000",deposit:"5000",date:localDate(addDays(new Date(),1)),time:"10:00"}});
      if(!["request","response"].includes(stage))value=applySampleCommand(value,"customer",value.revision,"seed-checkout",{type:"checkout",address:remote?"":"12 Admiralty Way"});
      if(!["request","response","pending"].includes(stage))value=applySampleCommand(value,"customer",value.revision,"seed-payment",{type:"payment",receipt:{...value.payment!,status:"verified"}});
      const paidWork=["booked","credit-pending","working","work-review","completed","withdrawn","partial"].includes(stage);
      if(["complete","quote","balance"].includes(stage)||paidWork)value=applySampleCommand(value,"provider",value.revision,"seed-findings",{type:"complete_inspection",findings:"Replace the trap and connector seal, then test for leaks."});
      if(["quote","balance"].includes(stage)||paidWork)value=applyBookingCommand(value,"provider",value.revision,"seed-quote",{type:"send_quote",draft:{scope:value.findings!,materials:"45000",labour:"45000",date:localDate(addDays(new Date(),2)),time:"14:00",duration:"3 hours"}});
      if(stage==="balance"||paidWork){
        value=applyBookingCommand(value,"customer",value.revision,"seed-accept",{type:"accept_quote",version:value.quote!.version});
        value=applyBookingCommand(value,"customer",value.revision,"seed-balance-checkout",{type:"balance_checkout",version:value.quote!.version});
      }
      if(paidWork){
        value=applyBookingCommand(value,"customer",value.revision,"seed-balance-proof",{type:"balance_payment",receipt:{...value.balancePayment!,status:"verified"}});
        const ledger=canonicalSampleLedger(value,stage==="credit-pending"?"processing":"credited");
        if(ledger)value=applyBookingCommand(value,"customer",value.revision,"seed-ledger",{type:"ledger_snapshot",ledger});
        const wallet=canonicalSampleWallet(value,stage==="withdrawn"?4275000:stage==="partial"?2000000:0);if(wallet)value=applyWorkCommand(value,"provider",value.revision,"seed-wallet",{type:"wallet_snapshot",wallet});
        if(["working","work-review","completed"].includes(stage))value=applyWorkCommand(value,"provider",value.revision,"seed-work-start",{type:"start_work"});
        if(stage==="work-review"||stage==="completed")value=applyWorkCommand(value,"provider",value.revision,"seed-work-finish",{type:"finish_work"});
        if(stage==="completed"){value=applyWorkCommand(value,"customer",value.revision,"seed-work-confirm",{type:"confirm_work",workEventId:value.workFinishedEventId!});const release=completedSampleLedger(value);if(release)value=applyWorkCommand(value,"customer",value.revision,"seed-labour-request",{type:"ledger_snapshot",ledger:release});}
      }
      await resetSampleInspection(value);await refresh();if(alive.current){setGeneration(v=>v+1);setSection(sectionFor(value));setDetail(false);setMessageFirst(false);setQuoteFlow(false);setWorkFlow(false);setWorkEntry(undefined);setScenario("Sample");setStates(false);router.setParams({step:"list",section:sectionFor(value)});}
    }catch(e){if(alive.current)setActionError(e instanceof Error?e.message:"Couldn’t reset the sample.");}finally{if(alive.current)setResetting(false);}
  };
  const credit=async()=>{
    if(!record||resetting)return;setResetting(true);setActionError(undefined);
    try{const ledger=canonicalSampleLedger(record);if(!ledger)throw new Error("This sample quote has no allocation fixture. A verified server ledger is still required.");await commandSampleInspection("customer",record.revision,"sample-credit-"+Date.now(),{type:"ledger_snapshot",ledger});await refresh();if(alive.current){setGeneration(v=>v+1);setScenario("Sample");setStates(false);}}
    catch(e){if(alive.current)setActionError(e instanceof Error?e.message:"Couldn’t store the sample credit.");}finally{if(alive.current)setResetting(false);}
  };
  const previewEvent=async(actor:BookingRole,command:WorkBookingCommand)=>{
    if(!record||resetting)return;setResetting(true);setActionError(undefined);
    try{await commandSampleInspection(actor,record.revision,"sample-event-"+Date.now()+"-"+Math.random().toString(36).slice(2),command);await refresh();if(alive.current){setScenario("Sample");setStates(false);if(command.type==="ledger_snapshot"){setWorkEntry(undefined);setGeneration(v=>v+1);}}}
    catch(e){if(alive.current)setActionError(e instanceof Error?e.message:"Couldn’t save the sample event.");}finally{if(alive.current)setResetting(false);}
  };
  const listError=error??(scenario==="Error"?"Sample connection error. Try again to restore the preview.":undefined);
  if(params.step==="message"&&record)return <Redirect href={{pathname:"/messages-preview",params:{mode:role,conversationId:sampleConversationId(record)}}}/>;
  return <View style={{flex:1,backgroundColor:Colors.surface,paddingTop:insets.top}}>
    <View style={{minHeight:44,paddingLeft:12,paddingRight:4,flexDirection:"row",alignItems:"center",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1,minWidth:0}}>LOCAL PREVIEW · {role==="provider"?"Provider":"Customer"} · Sample data</AppText><Pressable accessibilityRole="button" accessibilityLabel="Inspection preview states" onPress={()=>setStates(true)} style={{width:44,height:44,justifyContent:"center",alignItems:"center"}}><AppText variant="caption" color={Colors.primary}>States</AppText></Pressable></View>
    {record&&detail ? !messageFirst&&(workFlow||params.step==="detail"&&(balanceVerified(record)||!!record.cancelled&&!!record.refund)) ? <WorkJourney key={role+":"+generation+":work"} record={record} role={role} entry={workEntry} onBookings={bookings} onMessage={message} onCommand={onCommand} onBookAgain={()=>router.push({pathname:"/discovery-preview",params:{step:"profile",providerId:record.providerId,serviceId:record.serviceId}})} onEarnings={()=>router.push("/finance-preview")} initialCaseId={params.caseId} onSupportChat={conversationId=>router.push({pathname:"/messages-preview",params:{mode:role,conversationId}})} uploadFailure={scenario==="Upload failure"}/> : !messageFirst&&(quoteFlow||record.quote) ? <QuoteJourney key={role+":"+generation+":quote"} record={record} role={role} onBookings={bookings} onMessage={message} onCommand={onCommand} creditDelay={scenario==="Credit delay"} onProgress={()=>work("timeline")} onCancel={()=>work("cancel")} onReport={()=>work("report-category")}/> :
      <InspectionJourney key={role+":"+generation} record={record} role={role} initialMessage={messageFirst} onMessage={message} onCommand={onCommand} onBookings={bookings} onQuote={quote} onPaidCancel={()=>work("cancel")} onReschedule={()=>work("booking")} onProposal={()=>work("proposal")} onContext={()=>{setGeneration(v=>v+1);open();}}/> : <>
      <BookingList role={role} section={section} onSection={setSection} items={record&&scenario!=="Empty"?[sampleListItem(record,role)]:[]} onOpen={open} loading={!record&&!listError||scenario==="Loading"} error={listError} onRetry={()=>{setScenario("Sample");void refresh();}} preview art={item=>role==="provider"?require("@/assets/bookings/6cc70.png"):previewArt[item.providerId??"tobi"]?.cover}/>
      <BottomNavigation items={navigationItems(role)} activeKey="work" onPress={tab=>tab==="work"?bookings():router.replace({pathname:"/app-preview",params:{mode:role,tab}})}/>
    </>}
    {states&&<Sheet title="Booking preview" showClose showHandle={false} onClose={()=>{if(!resetting)setStates(false);}}><Callout message="This is one shared sample booking for both participants. Payments, messages and ledger events stay local. No real account or backend is changed."/>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{(["customer","provider"] as const).map(value=><SelectionChip key={value} label={value==="customer"?"View as customer":"View as provider"} selected={role===value} onPress={()=>{setRole(value);router.setParams({mode:value,step:"list"});setDetail(false);setMessageFirst(false);setQuoteFlow(false);setWorkFlow(false);setWorkEntry(undefined);setSection(record?sectionFor(record):"pending");setStates(false);}}/>)}</View>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{scenarios.map(value=><SelectionChip key={value} label={value} selected={scenario===value} onPress={()=>{setScenario(value);if(["Empty","Loading","Error"].includes(value))setDetail(false);setStates(false);}}/>)}</View>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{([ ["request","New request"],["response","Response received"],["pending","Payment pending"],["scheduled","Paid inspection"],["complete","Inspection complete"],["quote","Final quote sent"],["balance","Balance pending"],["booked","Repair booked"],["credit-pending","Materials credit pending"],["working","Work in progress"],["work-review","Waiting for customer confirmation"],["completed","Completed work"],["withdrawn","Materials already withdrawn"],["partial","Materials partially withdrawn"] ] as const).map(([stage,title])=><SelectionChip key={stage} label={title} disabled={resetting} onPress={()=>void seed(stage)}/>)}</View>
      {record&&balanceVerified(record)&&record.ledger?.status!=="credited"&&<Button title="Simulate materials credit" disabled={resetting} onPress={()=>void credit()}/>}
      {record&&completedByCustomer(record)&&record.ledger&&record.ledger.labourReleased<record.ledger.labourNet&&<Button title="Simulate labour credit" onPress={()=>void previewEvent("customer",{type:"ledger_snapshot",ledger:completedSampleLedger(record,true)!})}/>}
      {record?.repayment?.outstanding&&record.wallet?<Button title="Simulate additional wallet funds" variant="outline" onPress={()=>void previewEvent("provider",{type:"sample_wallet_credit",amount:record.repayment!.outstanding})}/>:null}
      {(record?.repayment?.outstanding??0)>0&&record?.wallet&&<Button title="Simulate recovery after notice" variant="outline" onPress={()=>void previewEvent("provider",{type:"recover_materials",method:"automatic",amount:Math.min(record.wallet!.available,record.repayment!.outstanding),now:new Date(Date.parse(record.repayment!.deadline!)+1).toISOString()})}/>}
      {record?.refund&&record.refund.status==="in_review"&&<Button title="Simulate approved refund" variant="outline" onPress={()=>void previewEvent("customer",{type:"refund_update",refundId:record.refund!.id,status:"approved",amount:Math.min(5500000,record.refund!.exposure)})}/>}
      {record?.refund&&["approved","processing","failed"].includes(record.refund.status)&&<Button title={record.refund.status==="processing"?"Simulate refund paid":"Simulate refund processing"} variant="outline" onPress={()=>void previewEvent("customer",{type:"refund_update",refundId:record.refund!.id,status:record.refund!.status==="processing"?"paid":"processing",amount:record.refund!.amount!,reference:"sample-refund-transfer"})}/>}
      {record&&casesFor(record,role).at(-1)&&<Button title="Simulate support review" variant="outline" onPress={()=>void previewEvent(role,{type:"case_update",caseId:casesFor(record,role).at(-1)!.id,status:"under_review"})}/>}
      <Button title="Remote appointment sample" variant="outline" disabled={resetting} onPress={()=>void seed("response",true)}/>{actionError&&<Callout message={actionError} tone="error"/>}
    </Sheet>}
  </View>;
}

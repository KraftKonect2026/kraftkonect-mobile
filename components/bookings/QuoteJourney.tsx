import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { Sheet } from "@/components/discovery/Parts";
import { Calendar } from "@/components/discovery/SearchFields";
import Colors from "@/constants/colors";
import { balanceVerified, BookingRecord, BookingRole, money, parseMoney } from "@/lib/bookings/model";
import { dateLabel, futureDay } from "@/lib/discovery/model";
import { BookingCommand, canonicalSampleLedger, sampleQuoteBreakdown } from "@/lib/preview/quoteModel";
import { useQuoteDraft } from "@/lib/preview/useQuoteDraft";
import { BookingFrame, DetailRow } from "./Parts";
import { CustomerQuote, ProviderQuote, QuoteStep } from "./QuoteScreens";

function initialStep(record:BookingRecord,role:BookingRole):QuoteStep {
  if(balanceVerified(record))return "confirmed";
  if(role==="provider")return record.quote?"sent":"prepare";
  return record.balancePayment?"checkout":record.acceptedQuote?"payment-details":"quote";
}
export function QuoteJourney({record,role,onBookings,onMessage,onCommand,onProgress,onCancel,onReport,creditDelay=false,onResumePayment,onCheckPayment}:{record:BookingRecord;role:BookingRole;onBookings:()=>void;onMessage:()=>void;onCommand:(key:string,command:BookingCommand,revision?:number)=>Promise<BookingRecord>;onProgress:()=>void;onCancel:()=>void;onReport:()=>void;creditDelay?:boolean;onResumePayment?:()=>void;onCheckPayment?:()=>void}){
  const [step,setStep]=useState<QuoteStep>(()=>initialStep(record,role));const [history,setHistory]=useState<QuoteStep[]>([]);
  const [dialog,setDialog]=useState<"date"|"fee"|"scope"|"directions">();const [calendarDate,setCalendarDate]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState<string>();const locked=useRef(false),alive=useRef(true),intent=useRef<{key:string;signature:string}|undefined>(undefined);
  const {draft,ready,error:draftError,update}=useQuoteDraft(record);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const navigate=(next:QuoteStep)=>{setHistory(h=>[...h,step]);setStep(next);setError(undefined);};
  const back=()=>{if(busy)return;if(history.length){setStep(history[history.length-1]);setHistory(history.slice(0,-1));setError(undefined);}else onBookings();};
  const save=async(command:BookingCommand,next?:QuoteStep)=>{
    if(locked.current)return;locked.current=true;setBusy(true);setError(undefined);
    const signature=JSON.stringify(command),key=intent.current?.signature===signature?intent.current.key:"step7-"+Date.now()+"-"+Math.random().toString(36).slice(2);intent.current={key,signature};
    try{
      const stored=await onCommand(key,command);if(!alive.current)return;intent.current=undefined;
      if(command.type==="balance_payment"&&command.receipt.status==="verified"){
        // A separate sample server event supplies the illustrated allocation. Payment alone is not credit.
        const ledger=canonicalSampleLedger(stored,creditDelay?"processing":"credited");
        if(ledger){try{await onCommand(key+"-ledger",{type:"ledger_snapshot",ledger},stored.revision);}catch{if(alive.current)setError("The sample payment is verified, but materials credit has not been recorded. Use Preview states to retry the sample ledger event.");}}
      }
      if(alive.current&&next){setHistory([]);setStep(next);}
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t save this change.");}
    finally{locked.current=false;if(alive.current)setBusy(false);}
  };
  const accepted=record.acceptedQuote;
  const numbers=[parseMoney(draft.materials),parseMoney(draft.labour)];const total=numbers.every(v=>v!==null)?numbers[0]!+numbers[1]!:undefined;
  const breakdown=total!==undefined&&Number.isSafeInteger(total)&&total>=(record.payment?.amount??0)?sampleQuoteBreakdown(total,record.payment?.amount??0):undefined;
  if(!ready)return <BookingFrame preview onBack={onBookings}><LogoLoader label="Loading quote draft"/></BookingFrame>;
  const common={record,step,onStep:navigate,onBack:back,onBookings,onMessage,busy,error:error??draftError,onFee:()=>setDialog("fee"),onCancel,onProgress};
  return <View style={{flex:1}}>{role==="provider"?<ProviderQuote {...common} draft={draft} breakdown={breakdown} onDraft={update} onDate={()=>{setCalendarDate(draft.date);setDialog("date");}} onSend={()=>void save({type:"send_quote",draft},"sent")} onDirections={()=>setDialog("directions")} onReport={onReport}/>:
    <CustomerQuote {...common} onAccept={()=>record.acceptedQuote?navigate("payment-details"):record.quote&&void save({type:"accept_quote",version:record.quote.version},"payment-details")}
      onCheckout={()=>{if(accepted)void save({type:"balance_checkout",version:accepted.version},"checkout");}}
      onPayment={status=>{if(record.balancePayment)void save({type:"balance_payment",receipt:{...record.balancePayment,status}},status==="verified"?"confirmed":undefined);}}
      onScope={()=>setDialog("scope")} onResume={onResumePayment} onCheck={onCheckPayment}/>}
    {dialog==="date"&&<Sheet title="Choose a date" titleVariant="h3" showHandle={false} topPadding={24} bodyPadding={12} bodyGap={16} onClose={()=>setDialog(undefined)}><Calendar layout="appointment" value={calendarDate} onChange={setCalendarDate}/><AppText variant="label" color={Colors.primary}>{dateLabel(calendarDate)}</AppText><Button title="Use this date" disabled={!futureDay(calendarDate)||calendarDate<(record.terms?.date??"")} onPress={()=>{update({date:calendarDate});setDialog(undefined);}}/></Sheet>}
    {dialog==="fee"&&<Sheet title="KK service fee" showClose showHandle={false} onClose={()=>setDialog(undefined)}><Callout message="The provider fee is 5%, capped at ₦20,000 across the deposit and remaining payment for one booking. The form shows the whole-job fee/net; the review shows the remaining-payment fee/net. No second fee is charged for material release, labour release or payout."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}
    {dialog==="scope"&&record.quote&&<Sheet title="What’s included" showClose showHandle={false} onClose={()=>setDialog(undefined)}><AppText variant="body">{record.quote.scope}</AppText><DetailRow label="Materials" value={money(record.quote.materials)}/><DetailRow label="Labour" value={money(record.quote.labour)}/><DetailRow label="Full job price" value={money(record.quote.total)} total/><AppText variant="captionRegular" color={Colors.textSecondary}>Quote version {record.quote.version} · accepted terms remain fixed for this booking.</AppText><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}
    {dialog==="directions"&&<Sheet title="Appointment address" showClose showHandle={false} onClose={()=>setDialog(undefined)}><Callout message={"This fictional sample address is "+(record.address??"unavailable")+". Live directions require the confirmed address."}/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}
  </View>;
}

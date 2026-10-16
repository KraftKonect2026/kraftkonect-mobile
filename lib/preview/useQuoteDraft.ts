import { useEffect, useRef, useState } from "react";
import { BookingRecord, money } from "@/lib/bookings/model";
import { QuoteDraft } from "@/lib/bookings/quotes";
import { addDays, localDate, parseDay, futureDay } from "@/lib/discovery/model";
import { secureStorage } from "@/lib/storage";
import { saveSampleDraft } from "./inspectionStore";
import { saveDraft } from "@/lib/bookings/drafts";
const sampleKey="kk.step7.sample-quote-draft.v1",liveKey="kk.live.quote-draft.v1";
function defaults(record:BookingRecord):QuoteDraft {
  const q=record.quote,live=record.source==="live";
  // A live provider starts from blank amounts; only a sample booking is pre-filled.
  return {scope:q?.scope??record.findings??"",materials:q||!live?money(q?.materials??4500000):"",labour:q||!live?money(q?.labour??4500000):"",date:q?.date??localDate(addDays(parseDay(record.inspectionAppointment?.date??record.terms?.date??"")??new Date(),1)),time:q?.time??(live?"09:00":"14:00"),duration:q?.duration??(live?"":"3 hours")};
}
export function useQuoteDraft(record:BookingRecord) {
  const alive=useRef(true),generation=useRef(0);
  const live=record.source==="live",storageKey=live?liveKey:sampleKey,write=live?saveDraft:saveSampleDraft,hasQuote=!!record.quote;
  const id=record.id,version=record.quote?.version??0,scope=record.quote?.scope??record.findings??"",materials=record.quote?.materials??4500000,labour=record.quote?.labour??4500000,date=record.quote?.date??"",inspectionDate=record.inspectionAppointment?.date??record.terms?.date??"",time=record.quote?.time??(live?"09:00":"14:00"),duration=record.quote?.duration??(live?"":"3 hours");
  const [draft,setDraft]=useState(()=>defaults(record));const [ready,setReady]=useState(false);const [error,setError]=useState<string>();
  useEffect(()=>{
    let active=true;alive.current=true;generation.current++;setReady(false);
    const fallback:QuoteDraft={scope,materials:hasQuote||!live?money(materials):"",labour:hasQuote||!live?money(labour):"",date:date||localDate(addDays(parseDay(inspectionDate)||new Date(),1)),time,duration};
    secureStorage.getItem(storageKey).then(raw=>{
      if(!active)return;let restored=fallback;
      if(raw){try{const saved=JSON.parse(raw);if(saved.version===1&&saved.bookingId===id&&saved.quoteVersion===version){
        const v=saved.draft as Partial<QuoteDraft>;
        restored={scope:typeof v.scope==="string"?v.scope.slice(0,2000):fallback.scope,materials:typeof v.materials==="string"?v.materials.slice(0,16):fallback.materials,labour:typeof v.labour==="string"?v.labour.slice(0,16):fallback.labour,date:typeof v.date==="string"&&futureDay(v.date)?v.date:fallback.date,time:typeof v.time==="string"?v.time.slice(0,5):fallback.time,duration:typeof v.duration==="string"?v.duration.slice(0,80):fallback.duration};
      }}catch{setError(live?"Couldn’t restore this quote draft.":"Couldn’t restore the sample quote draft.");}}
      setDraft(restored);setReady(true);
    }).catch(()=>{if(active){setDraft(fallback);setReady(true);setError(live?"Couldn’t restore this quote draft.":"Couldn’t restore the sample quote draft.");}});
    return()=>{active=false;alive.current=false;};
    // Only a new record/quote version replaces a working draft; unrelated messages preserve edits.
  },[id,version,scope,materials,labour,date,inspectionDate,time,duration,hasQuote,live,storageKey]);
  const update=(patch:Partial<QuoteDraft>)=>{
    if(!ready)return;const next={...draft,...patch},writeGeneration=generation.current;setDraft(next);
    void write(storageKey,{version:1,bookingId:record.id,quoteVersion:record.quote?.version??0,draft:next}).then(()=>{if(alive.current&&generation.current===writeGeneration)setError(undefined);}).catch(()=>{if(alive.current&&generation.current===writeGeneration)setError("Quote changes could not be saved on this device.");});
  };
  return {draft,ready,error,update};
}

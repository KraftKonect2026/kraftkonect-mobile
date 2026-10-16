import { useEffect, useRef, useState } from "react";
import { BookingRecord, BookingRole, ResponseDraft } from "@/lib/bookings/model";
import { addDays, futureDay, localDate } from "@/lib/discovery/model";
import { secureStorage } from "@/lib/storage";
import { saveSampleDraft } from "./inspectionStore";
import { saveDraft } from "@/lib/bookings/drafts";

type Draft={response:ResponseDraft;address:string;findings:string};
export function useInspectionDraft(record:BookingRecord,role:BookingRole) {
  const live=record.source==="live";const key=(live?"kk.live.inspection-draft.":"kk.step6.sample-draft.")+role+".v1";const alive=useRef(true);const write=live?saveDraft:saveSampleDraft;
  const defaults:Draft={response:{minimum:record.terms||!live?String((record.terms?.minimum??8500000)/100):"",maximum:record.terms||!live?String((record.terms?.maximum??11000000)/100):"",deposit:record.terms||!live?String((record.terms?.deposit??500000)/100):"",date:record.terms?.date??(futureDay(record.preferredDate)?record.preferredDate:localDate(addDays(new Date(),1))),time:record.terms?.time??"10:00"},address:role==="customer"?record.address??"":"",findings:role==="provider"?record.findings??"":""};
  const [draft,setDraft]=useState(defaults);const [ready,setReady]=useState(false);const [error,setError]=useState<string>();
  useEffect(()=>{alive.current=true;secureStorage.getItem(key).then(raw=>{
    if(!alive.current)return;
    if(raw){try{const value=JSON.parse(raw);if(value.version===1 && value.bookingId===record.id){const r=value.response??{};setDraft(previous=>({response:{minimum:typeof r.minimum==="string"?r.minimum.slice(0,16):previous.response.minimum,maximum:typeof r.maximum==="string"?r.maximum.slice(0,16):previous.response.maximum,deposit:typeof r.deposit==="string"?r.deposit.slice(0,16):previous.response.deposit,date:futureDay(r.date)?r.date:previous.response.date,time:typeof r.time==="string"?r.time.slice(0,5):previous.response.time},address:role==="customer"&&typeof value.address==="string"?value.address.slice(0,240):"",findings:role==="provider"&&typeof value.findings==="string"?value.findings.slice(0,2000):""}));}}catch{setError(live?"Couldn’t restore this draft.":"Couldn’t restore this sample draft.");}}
    setReady(true);
  }).catch(()=>{if(alive.current){setError(live?"Couldn’t restore this draft.":"Couldn’t restore this sample draft.");setReady(true);}});return()=>{alive.current=false;};},[key,live,record.id,role]);
  const update=(patch:Partial<Draft>)=>{
    if(!ready)return;const next={...draft,...patch};setDraft(next);
    void write(key,{version:1,bookingId:record.id,response:next.response,...(role==="customer"?{address:next.address}:{findings:next.findings})}).then(()=>{if(alive.current)setError(undefined);}).catch(()=>{if(alive.current)setError("Draft changes could not be saved on this device.");});
  };
  return {draft,ready,error,update};
}

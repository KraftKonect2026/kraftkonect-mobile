import { useEffect, useRef, useState } from "react";
import { BookingRecord, BookingRole } from "@/lib/bookings/model";
import { secureStorage } from "@/lib/storage";
import { saveSampleDraft } from "./inspectionStore";
export type WorkDraft={reason:string;customReason:string;category:string;description:string;when:string;help:string;rating:number;reviewText:string};
const empty:WorkDraft={reason:"",customReason:"",category:"",description:"",when:"",help:"",rating:0,reviewText:""};
export function useWorkDraft(record:BookingRecord,role:BookingRole){
  const [draft,setDraft]=useState<WorkDraft>(empty),[ready,setReady]=useState(false),[error,setError]=useState<string>();const alive=useRef(true),generation=useRef(0);const id=record.id,key="kk.step8.sample-draft."+role+".v1";
  useEffect(()=>{let active=true;alive.current=true;generation.current++;setReady(false);
    secureStorage.getItem(key).then(raw=>{if(!active)return;let restored={...empty};if(raw){try{const saved=JSON.parse(raw);if(saved.version===1&&saved.bookingId===id){const v=saved.draft;for(const k of ["reason","customReason","category","description","when","help","reviewText"] as const)restored[k]=typeof v?.[k]==="string"?v[k].slice(0,k==="description"?2000:k==="reviewText"?500:k==="category"?100:k==="when"?160:500):"";restored.rating=Number.isInteger(v?.rating)&&v.rating>=0&&v.rating<=5?v.rating:0;}}catch{setError("Couldn’t restore the sample work draft.");}}setDraft(restored);setReady(true);}).catch(()=>{if(active){setDraft({...empty});setReady(true);setError("Couldn’t restore the sample work draft.");}});
    return()=>{active=false;alive.current=false;};},[id,key]);
  const update=(patch:Partial<WorkDraft>)=>{if(!ready)return;const next={...draft,...patch},g=generation.current;setDraft(next);void saveSampleDraft(key,{version:1,bookingId:id,draft:next}).then(()=>{if(alive.current&&g===generation.current)setError(undefined);}).catch(()=>{if(alive.current&&g===generation.current)setError("Changes could not be saved on this device.");});};
  return {draft,ready,error,update};
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { secureStorage } from "@/lib/storage";
import { BookingRecord, BookingRole } from "@/lib/bookings/model";
import { SAMPLE_BOOKING_KEY, sampleInspection } from "./inspectionModel";
import { applyFinanceCommand, FinanceBookingCommand } from "./financeModel";

let writes:Promise<unknown>=Promise.resolve();
const listeners=new Set<()=>void>();
function serial<T>(action:()=>Promise<T>):Promise<T> {const result=writes.catch(()=>{}).then(action);writes=result;return result;}
export function saveSampleDraft(key:string,value:unknown) {assertDev();return serial(()=>secureStorage.setItem(key,JSON.stringify(value)));}
export function resetSampleInspection(record:BookingRecord):Promise<BookingRecord> {
  assertDev();return serial(async()=>{for(const role of ["customer","provider"]){await secureStorage.removeItem("kk.step6.sample-draft."+role+".v1");await secureStorage.removeItem("kk.step8.sample-draft."+role+".v1");}await secureStorage.removeItem("kk.step7.sample-quote-draft.v1");await secureStorage.setItem(SAMPLE_BOOKING_KEY,JSON.stringify(record));listeners.forEach(notify=>notify());return record;});
}
function assertDev(){if(!__DEV__)throw new Error("Sample bookings are only available in development.");}
export async function readSampleInspection():Promise<BookingRecord> {
  assertDev();const raw=await secureStorage.getItem(SAMPLE_BOOKING_KEY);
  if(!raw)return sampleInspection();
  const result=JSON.parse(raw) as BookingRecord;
  if(result.schema!==1 || result.source!=="sample" || result.id!=="sample-request" || !Array.isArray(result.commands) || !Array.isArray(result.events) || !Array.isArray(result.messages))throw new Error("The local sample is invalid. Reset it in Preview states.");
  return result;
}
export function saveSampleInspection(record:BookingRecord):Promise<BookingRecord> {
  assertDev();return serial(async()=>{await secureStorage.setItem(SAMPLE_BOOKING_KEY,JSON.stringify(record));listeners.forEach(notify=>notify());return record;});
}
export function commandSampleInspection(role:BookingRole,revision:number,key:string,command:FinanceBookingCommand):Promise<BookingRecord> {
  assertDev();return serial(async()=>{const current=await readSampleInspection();const next=applyFinanceCommand(current,role,revision,key,command);if(next!==current){const event=next.events.find(e=>e.id===key);if(event){event.at=new Date().toISOString();event.actor=role;if("receipt" in command)event.details={status:command.receipt.status,...(command.type==="payout_result"?{payoutId:command.receipt.id}:{})};if("caseId" in command)event.details={...event.details,caseId:command.caseId};}}await secureStorage.setItem(SAMPLE_BOOKING_KEY,JSON.stringify(next));listeners.forEach(notify=>notify());return next;});
}
export function useSampleInspection() {
  const [record,setRecord]=useState<BookingRecord>();const [error,setError]=useState<string>();
  const alive=useRef(true);const generation=useRef(0);
  const refresh=useCallback(async()=>{const current=++generation.current;try{const value=await readSampleInspection();if(alive.current && current===generation.current){setRecord(value);setError(undefined);}}catch(e){if(alive.current && current===generation.current)setError(e instanceof Error?e.message:"Couldn’t read the sample booking.");}},[]);
  useEffect(()=>{alive.current=true;listeners.add(refresh);return()=>{alive.current=false;listeners.delete(refresh);};},[refresh]);
  useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));
  return {record,error,refresh};
}

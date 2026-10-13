import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { secureStorage } from "@/lib/storage";
import { BookingRole } from "@/lib/bookings/model";
import { mergeAccountNotificationReads, mergeNotificationReads } from "@/lib/messaging/notifications";
import { sampleAccountId } from "@/lib/account/model";
import { readSampleAccount } from "./accountStore";
import { readAccountSupport } from "./accountSupportStore";
import { readSampleInspection } from "./inspectionStore";
let writes:Promise<unknown>=Promise.resolve();const listeners=new Set<()=>void>();
const key="kk.step9.notification-read.v2";
type MarkerState={schema:2;ownerId:string;customer:string[];provider:string[];account:string[]};
function assertRole(role:BookingRole){if(!__DEV__||!["customer","provider"].includes(role))throw new Error("A local notification owner is required.");}
function markerArray(value:unknown):string[]{if(!Array.isArray(value)||value.some(i=>typeof i!=="string"))throw new Error("Invalid local notification markers.");return value;}
async function readMarkerState():Promise<MarkerState>{
 const raw=await secureStorage.getItem(key);
 if(raw){const r=JSON.parse(raw);if(r.schema!==2||r.ownerId!==sampleAccountId)throw new Error("Notification markers belong to another account.");return {schema:2,ownerId:r.ownerId,customer:markerArray(r.customer),provider:markerArray(r.provider),account:markerArray(r.account)};}
 const old=await Promise.all(["customer","provider"].map(role=>secureStorage.getItem("kk.step9.notification-read."+role+".v1")));
 return {schema:2,ownerId:sampleAccountId,customer:markerArray(JSON.parse(old[0]??"[]")),provider:markerArray(JSON.parse(old[1]??"[]")),account:[]};
}
export async function readNotificationMarkers(role:BookingRole):Promise<string[]>{assertRole(role);const r=await readMarkerState();return [...r[role],...r.account];}
export function markNotificationsRead(role:BookingRole,ids:string[]){
 assertRole(role);const result=writes.catch(()=>{}).then(async()=>{
  const [current,account,support,old]=await Promise.all([readSampleInspection(),readSampleAccount(),readAccountSupport(),readMarkerState()]);
  const bookingIds=ids.filter(id=>id.startsWith("sample-notification-")),accountIds=ids.filter(id=>!id.startsWith("sample-notification-"));
  const next={...old,[role]:mergeNotificationReads(current,role,old[role],bookingIds),account:mergeAccountNotificationReads(account,support,account.id,old.account,accountIds)};
  await secureStorage.setItem(key,JSON.stringify(next));listeners.forEach(f=>f());
 });writes=result;return result;
}
export function useNotificationMarkers(role:BookingRole){const [ids,setIds]=useState<string[]>([]),[error,setError]=useState<string>();const alive=useRef(true),generation=useRef(0);const refresh=useCallback(async()=>{const current=++generation.current;try{const ids=await readNotificationMarkers(role);if(alive.current&&current===generation.current){setIds(ids);setError(undefined);}}catch(e){if(alive.current&&current===generation.current)setError(e instanceof Error?e.message:"Couldn’t read notifications.");}},[role]);useEffect(()=>{alive.current=true;listeners.add(refresh);return()=>{alive.current=false;listeners.delete(refresh);};},[refresh]);useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));return {ids,error,refresh};}

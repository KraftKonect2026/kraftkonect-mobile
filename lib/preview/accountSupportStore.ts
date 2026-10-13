import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { secureStorage } from "@/lib/storage";
import { sampleAccountId } from "@/lib/account/model";
import { AccountSupportCommand, AccountSupportPhoto, AccountSupportThread, accountSupportDraft, applyAccountSupportCommand, assertSupportOwner, sampleAccountSupport } from "@/lib/messaging/accountSupport";
import { readSampleAccount } from "./accountStore";

const key="kk.step9.account-support.v1",listeners=new Set<()=>void>();
let writes:Promise<unknown>=Promise.resolve();
function assertDev(){if(!__DEV__)throw new Error("Support samples are available only in development.");}
function serial<T>(action:()=>Promise<T>):Promise<T>{const result=writes.catch(()=>{}).then(action);writes=result;return result;}
export async function readAccountSupport():Promise<AccountSupportThread> {
  assertDev();const raw=await secureStorage.getItem(key),r=raw?JSON.parse(raw) as AccountSupportThread:sampleAccountSupport();
  assertSupportOwner(r,sampleAccountId);
  if(!Number.isSafeInteger(r.revision)||r.revision<0||!Array.isArray(r.commands)||!Array.isArray(r.messages))throw new Error("The local support record is invalid.");
  return r;
}
export function saveAccountSupportDraft(text:string,photo?:AccountSupportPhoto,intentKey?:string){assertDev();const value=accountSupportDraft(text,photo,intentKey);return serial(()=>secureStorage.setItem("kk.step9.account-support-draft.v1",JSON.stringify(value)));}
export function commandAccountSupport(revision:number,id:string,c:AccountSupportCommand) {
  assertDev();return serial(async()=>{
    const account=await readSampleAccount();
    if(!account.signedIn||account.deletion)throw new Error("Verify account access before opening a private support conversation.");
    const r=await readAccountSupport(),next=applyAccountSupportCommand(r,account.id,revision,id,c);
    await secureStorage.setItem(key,JSON.stringify(next));listeners.forEach(v=>v());return next;
  });
}
export function useAccountSupport() {
  const [record,setRecord]=useState<AccountSupportThread>(),[error,setError]=useState<string>();
  const alive=useRef(true),generation=useRef(0);
  const refresh=useCallback(async()=>{const id=++generation.current;try{const r=await readAccountSupport();if(alive.current&&generation.current===id){setRecord(r);setError(undefined);}}catch(e){if(alive.current&&generation.current===id)setError(e instanceof Error?e.message:"Couldn’t read support.");}},[]);
  useEffect(()=>{alive.current=true;listeners.add(refresh);return()=>{alive.current=false;listeners.delete(refresh);};},[refresh]);
  useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));
  return {record,error,refresh};
}

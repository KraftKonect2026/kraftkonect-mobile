import { useCallback, useEffect, useRef, useState } from "react";
import { secureStorage } from "@/lib/storage";
import { discoveryKey, RequestDraft, safeRequest, safeSearch, SearchDraft } from "@/lib/discovery/model";

type Kind = "search" | "request";
type Draft<K extends Kind> = K extends "search" ? SearchDraft : RequestDraft;
export function useDiscoveryDraft<K extends Kind>(owner:string,kind:K,initial:Partial<Draft<K>>) {
  const key=discoveryKey(owner,kind); const initialRef=useRef(initial);
  const sanitize=useCallback((v:unknown)=> (kind === "search" ? safeSearch(v) : safeRequest(v)) as Draft<K>,[kind]);
  const [state,setState]=useState<{key:string;value:Draft<K>;ready:boolean}>(()=>({key,value:sanitize(initial),ready:false}));
  const [saveError,setSaveError]=useState(false); const queue=useRef(Promise.resolve());
  useEffect(()=> {
    let active=true; setSaveError(false);
    secureStorage.getItem(key).then(raw=> {
      let saved:unknown=null; try {saved=raw ? JSON.parse(raw) : null;} catch { /* Recover a corrupt draft. */ }
      if(active) setState({key,value:sanitize({...sanitize(saved),...initialRef.current}),ready:true});
    }).catch(()=> {if(active){setState({key,value:sanitize(initialRef.current),ready:true});setSaveError(true);}});
    return ()=>{active=false;};
  },[key,sanitize]);
  useEffect(()=> {
    if(!state.ready || state.key!==key) return;
    let active=true; const serialized=JSON.stringify(state.value);
    queue.current=queue.current.catch(()=>{}).then(()=>secureStorage.setItem(key,serialized)).then(()=> {if(active)setSaveError(false);}).catch(()=>{if(active)setSaveError(true);});
    return ()=>{active=false;};
  },[state,key]);
  const update=useCallback((patch:Partial<Draft<K>>)=>setState(previous=>previous.key===key && previous.ready ? {...previous,value:sanitize({...previous.value,...patch})} : previous),[key,sanitize]);
  const flush=useCallback(async()=> {await queue.current; await secureStorage.setItem(key,JSON.stringify(state.value));},[key,state.value]);
  return { draft:state.key===key ? state.value : sanitize(initial),ready:state.key===key && state.ready,update,flush,saveError };
}

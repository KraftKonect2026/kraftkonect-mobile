import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { useAppSelector, store } from "@/store";
import { sameAccountSession } from "@/lib/account/liveAccount";
export type ProviderReadClient=ReturnType<typeof useApolloClient>;

/** Protected reads retain their actor and drop stale focus/identity results. */
export function useOwnedProviderRead<T>(read:(client:ProviderReadClient,ownerId:string,isCurrent:()=>boolean)=>Promise<T>){
  const client=useApolloClient(),ownerId=useAppSelector(s=>s.auth.user?.id),signedIn=useAppSelector(s=>s.auth.isAuthenticated&&!!s.auth.accessToken&&!!s.auth.user);
  const generation=useRef(0),[saved,setSaved]=useState<{ownerId:string;data?:T;loading:boolean;error?:string}>();
  const refresh=useCallback(async()=>{
    if(!ownerId||!signedIn)return;
    const revision=++generation.current;
    const current=()=>{const auth=store.getState().auth;return generation.current===revision&&sameAccountSession(ownerId,auth.user?.id,auth.isAuthenticated&&!!auth.accessToken);};
    setSaved(previous=>({ownerId,data:previous?.ownerId===ownerId?previous.data:undefined,loading:true}));
    try{const data=await read(client,ownerId,current);if(current())setSaved({ownerId,data,loading:false});}
    catch(e){if(current())setSaved(previous=>({ownerId,data:previous?.ownerId===ownerId?previous.data:undefined,loading:false,error:e instanceof Error?e.message:"Your saved records could not be loaded. Try again later."}));}
  },[client,ownerId,signedIn,read]);
  useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));
  const shown=saved&&signedIn&&saved.ownerId===ownerId?saved:undefined;
  return {data:shown?.data,error:shown?.error,loading:shown?.loading??signedIn,ownerId,signedIn,refresh};
}

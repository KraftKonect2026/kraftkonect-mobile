import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { useAppSelector, store } from "@/store";
import { USER_PROFILE_QUERY, MY_PROVIDER_PROFILE_QUERY } from "@/lib/queries";
import { accountReadSnapshot, AccountReadSnapshot, sameAccountSession } from "@/lib/account/liveAccount";
import { useServiceArea } from "./useServiceArea";

export function useAccountRead() {
 const client=useApolloClient(),user=useAppSelector(s=>s.auth.user),signedIn=useAppSelector(s=>s.auth.isAuthenticated&&!!s.auth.accessToken&&!!s.auth.user),ownerId=user?.id,area=useServiceArea();
 const [saved,setSaved]=useState<AccountReadSnapshot>(),[error,setError]=useState<string>(),[loading,setLoading]=useState(false),[freshOwner,setFreshOwner]=useState<string>();
 const alive=useRef(true),generation=useRef(0);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const refresh=useCallback(async()=>{
  if(!ownerId||!signedIn)return;const revision=++generation.current;setLoading(true);setError(undefined);setFreshOwner(undefined);
  try{
   const [me,profile]=await Promise.allSettled([client.query({query:USER_PROFILE_QUERY,fetchPolicy:"no-cache",errorPolicy:"none",context:{accountOwnerId:ownerId,queryDeduplication:false}}),client.query({query:MY_PROVIDER_PROFILE_QUERY,fetchPolicy:"no-cache",errorPolicy:"none",context:{accountOwnerId:ownerId,queryDeduplication:false}})]);
   const auth=store.getState().auth;
   if(!alive.current||generation.current!==revision||!sameAccountSession(ownerId,auth.user?.id,auth.isAuthenticated&&!!auth.accessToken))return;
   if(me.status!=="fulfilled")throw new Error("Couldn’t refresh your account. Your saved sign-in details are retained.");
   const snapshot=accountReadSnapshot(ownerId,me.value.data?.me,profile.status==="fulfilled"?profile.value.data?.myProviderProfile:undefined);
   setSaved(snapshot);setFreshOwner(ownerId);if(profile.status==="rejected")setError("Your account loaded, but provider details could not be refreshed.");
  }catch(e){if(alive.current&&generation.current===revision)setError(e instanceof Error?e.message:"Couldn’t refresh account details.");}
  finally{if(alive.current&&generation.current===revision)setLoading(false);}
 },[client,ownerId,signedIn]);
 useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));
 const snapshot=user?{...(saved&&saved.id===user.id?saved:accountReadSnapshot(user.id,user)),area:area?.label}:undefined;
 return {snapshot,error,loading,refresh,signedIn,ownerId,accountLoaded:!!ownerId&&freshOwner===ownerId&&!loading};
}

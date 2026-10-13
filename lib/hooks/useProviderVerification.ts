import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useApolloClient, useMutation } from "@apollo/client";
import { START_KYC_INQUIRY_MUTATION } from "@/lib/mutations";
import { MY_PROVIDER_PROFILE_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { startOwnedVerification } from "@/lib/onboarding/liveVerification";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { store } from "@/store";
import { useToast } from "@/lib/toast";

export function useProviderVerification(providerId: string | undefined, refresh: () => Promise<string | undefined>, onCompleted?: () => void) {
  const toast=useToast(),client=useApolloClient(),[busy,setBusy]=useState(false),[startInquiry]=useMutation(START_KYC_INQUIRY_MUTATION,{errorPolicy:"none"});
  const alive=useRef(true),lock=useRef(false),timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timeout.current)clearTimeout(timeout.current);};},[]);
  const start=async()=>{
    const auth=store.getState().auth,ownerId=auth.user?.id;
    if(!providerId||!ownerId||!auth.isAuthenticated||!auth.accessToken||lock.current)return;
    lock.current=true;setBusy(true);
    const current=()=>{const authNow=store.getState().auth;return alive.current&&sameAccountSession(ownerId,authNow.user?.id,authNow.isAuthenticated&&!!authNow.accessToken);};
    const finish=()=>{lock.current=false;if(current())setBusy(false);};
    const poll=async(attempt=0):Promise<void>=>{
      if(!current())return;
      try{const status=await refresh();if(!current())return;if(status==="approved"){toast.success("Identity verification approved.");finish();return;}}catch{}
      if(attempt>=7){finish();return;}timeout.current=setTimeout(()=>void poll(attempt+1),2500);
    };
    try{
      const context={accountOwnerId:ownerId,queryDeduplication:false};
      const inquiry=await startOwnedVerification(ownerId,providerId,{
        me:async()=>(await client.query({query:USER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.me,
        profile:async()=>(await client.query({query:MY_PROVIDER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.myProviderProfile,
        start:async id=>(await startInquiry({variables:{providerId:id},context})).data?.startKycInquiry,isCurrent:current,
      });
      const web=async()=>{if(!current())return;await WebBrowser.openBrowserAsync(inquiry.inquiryUrl);if(current())await poll();};
      if(Platform.OS==="web"){await web();return;}
      try{
        const {Inquiry}=await import("react-native-persona");if(!current())return;
        Inquiry.fromInquiry(inquiry.inquiryId).sessionToken(inquiry.clientToken||"")
          .onComplete(()=>{if(current()){onCompleted?.();toast.info("Verification submitted. Checking status.");void poll();}})
          .onCanceled(()=>{if(current()){finish();void refresh().catch(()=>{});}})
          .onError(()=>{if(current())void web().catch(()=>{finish();if(current())toast.error("Could not open verification. Please try again.");});})
          .build().start();
      }catch{if(current())await web();}
    }catch{finish();if(current())toast.error("Could not start verification. Please try again.");}
  };
  return {start,busy};
}

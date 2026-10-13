import { useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/store";
import { ProviderReadClient, useOwnedProviderRead } from "@/lib/hooks/useOwnedProviderRead";
import { USER_PROFILE_QUERY, MY_PROVIDER_PROFILE_QUERY, MY_AVAILABLE_BALANCE_QUERY, MY_PAYOUTS_QUERY, MY_PAYOUT_METHOD_QUERY } from "@/lib/queries";
import { liveFinanceStep, readOwnedProviderFinance } from "@/lib/provider/liveFinance";
import { LiveFinanceContent } from "./LiveFinanceContent";
import { ProviderServiceBoundary } from "@/components/provider/ConnectedProviderManagement";
import Colors from "@/constants/colors";

async function readFinance(client:ProviderReadClient,ownerId:string,isCurrent:()=>boolean){
  const context={accountOwnerId:ownerId,queryDeduplication:false};
  return readOwnedProviderFinance(ownerId,{
    me:async()=>(await client.query({query:USER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.me,
    profile:async()=>(await client.query({query:MY_PROVIDER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.myProviderProfile,
    balance:async()=>(await client.query({query:MY_AVAILABLE_BALANCE_QUERY,fetchPolicy:"no-cache",context})).data?.myAvailableBalance,
    payouts:async()=>(await client.query({query:MY_PAYOUTS_QUERY,fetchPolicy:"no-cache",context})).data?.myPayouts,
    bank:async()=>(await client.query({query:MY_PAYOUT_METHOD_QUERY,fetchPolicy:"no-cache",context})).data?.myPayoutMethod,
    isCurrent,
  });
}
export function ConnectedProviderFinance(){const ownerId=useAppSelector(s=>s.auth.user?.id);return <OwnedFinance key={ownerId??"signed-out"}/>;}
function OwnedFinance(){
  const params=useLocalSearchParams<{step?:string;payoutId?:string}>(),router=useRouter(),data=useOwnedProviderRead(readFinance),[unavailable,setUnavailable]=useState<string>();
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  const step=liveFinanceStep(params.step);
  return <View style={{flex:1,backgroundColor:Colors.surface}}><LiveFinanceContent snapshot={data.data} step={step} payoutId={typeof params.payoutId==="string"?params.payoutId:undefined} loading={data.loading} error={data.error} onRetry={()=>void data.refresh()} onBack={()=>{if(step!=="earnings")router.setParams({step:"earnings",payoutId:""});else router.replace("/provider/(tabs)/profile");}} onGo={(step,payoutId)=>router.setParams({step,payoutId:payoutId??""})} onSetup={()=>router.push("/provider-onboarding/welcome")} onUnavailable={setUnavailable}/>{unavailable&&<ProviderServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

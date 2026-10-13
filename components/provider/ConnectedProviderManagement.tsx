import { useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/store";
import { useOwnedProviderRead, ProviderReadClient } from "@/lib/hooks/useOwnedProviderRead";
import { MY_LISTINGS_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { readOwnedCatalog } from "@/lib/provider/liveCatalog";
import { ManagementStep } from "./ProviderManagementScreens";
import { LiveAvailabilityContent, LiveCatalogContent } from "./LiveCatalogContent";
import { Sheet } from "@/components/discovery/Parts";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import Colors from "@/constants/colors";

export function liveManagementStep(value:unknown):ManagementStep{return value==="service"||value==="create"||value==="edit"?value:"services";}
async function readCatalog(client:ProviderReadClient,ownerId:string,isCurrent:()=>boolean){
  const context={accountOwnerId:ownerId,queryDeduplication:false};
  return readOwnedCatalog(ownerId,{me:async()=>(await client.query({query:USER_PROFILE_QUERY,fetchPolicy:"no-cache",context})).data?.me,listings:async()=>(await client.query({query:MY_LISTINGS_QUERY,fetchPolicy:"no-cache",context})).data?.myProviderProfile,isCurrent});
}
export function ProviderServiceBoundary({action,onClose}:{action:string;onClose:()=>void}){return <Sheet title={action+" unavailable"} showClose onClose={onClose}><Callout message="This service could not be connected. Your saved services, bookings and payments are kept. Please try again later."/><Button title="Done" onPress={onClose}/></Sheet>;}
export function ConnectedProviderServices(){const ownerId=useAppSelector(s=>s.auth.user?.id);return <OwnedServices key={ownerId??"signed-out"}/>;}
function OwnedServices(){
  const router=useRouter(),params=useLocalSearchParams<{step?:string;serviceId?:string}>(),data=useOwnedProviderRead(readCatalog),[unavailable,setUnavailable]=useState<string>();
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  return <View style={{flex:1,backgroundColor:Colors.surface}}><LiveCatalogContent catalog={data.data} loading={data.loading} error={data.error} step={liveManagementStep(params.step)} serviceId={typeof params.serviceId==="string"?params.serviceId:undefined} onRetry={()=>void data.refresh()} onBack={()=>router.replace("/provider/(tabs)/profile")} onGo={(step,serviceId)=>router.setParams({step,serviceId:serviceId??""})} onSetup={()=>router.push("/provider-onboarding/welcome")} onUnavailable={setUnavailable}/>{unavailable&&<ProviderServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}
export function ConnectedProviderAvailability(){
  const router=useRouter(),ownerId=useAppSelector(s=>s.auth.user?.id),signedIn=useAppSelector(s=>s.auth.isAuthenticated&&!!s.auth.accessToken&&!!s.auth.user),[unavailable,setUnavailable]=useState<string>();
  if(!signedIn)return <Redirect href="/sign-in"/>;
  return <View style={{flex:1,backgroundColor:Colors.surface}}><LiveAvailabilityContent key={ownerId} onBack={()=>router.replace("/provider/(tabs)/profile")} onUnavailable={setUnavailable}/>{unavailable&&<ProviderServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

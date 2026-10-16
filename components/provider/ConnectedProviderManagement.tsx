import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useApolloClient } from "@apollo/client";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { loadAvailability, removeService, saveAvailability, saveService } from "@/lib/provider/liveManage";
import { Availability, } from "@/lib/provider/catalog";
import { useToast } from "@/lib/toast";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/store";
import { useOwnedProviderRead, ProviderReadClient } from "@/lib/hooks/useOwnedProviderRead";
import { MY_LISTINGS_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { readOwnedCatalog } from "@/lib/provider/liveCatalog";
import { ManagementStep } from "./ProviderManagementScreens";
import { CatalogActions, LiveAvailabilityContent, LiveCatalogContent } from "./LiveCatalogContent";
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
  const router=useRouter(),client=useApolloClient(),toast=useToast(),params=useLocalSearchParams<{step?:string;serviceId?:string}>(),data=useOwnedProviderRead(readCatalog),[unavailable,setUnavailable]=useState<string>();
  const [busy,setBusy]=useState(false),[error,setError]=useState<string>(),lock=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{setError(undefined);},[params.step,params.serviceId]);
  /** One change at a time: show the server's own sentence if it is refused, and keep the person where they are. */
  const guarded=async<T,>(work:(id:string)=>Promise<T>):Promise<T>=>{
    const id=data.ownerId;if(!id||lock.current)throw new Error("busy");
    lock.current=true;setBusy(true);setError(undefined);
    try{return await work(id);}catch(e){if(alive.current)setError(e instanceof Error?e.message:"Something went wrong. Please try again.");throw e;}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  const actions:CatalogActions={busy,error,
    uploadPhoto:()=>guarded(async()=>{const pick=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.8});if(pick.canceled)return undefined;return uploadImageToCloudinary(pick.assets[0].uri);}),
    save:(id,draft)=>guarded(async owner=>{const saved=await saveService(client,owner,id,draft);await data.refresh();toast.success(id?"Service updated.":"Service published.");return saved;}),
    remove:id=>guarded(async owner=>{await removeService(client,owner,id);await data.refresh();toast.success("Service removed.");}),
  };
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  return <View style={{flex:1,backgroundColor:Colors.surface}}><LiveCatalogContent catalog={data.data} loading={data.loading} error={data.error} step={liveManagementStep(params.step)} serviceId={typeof params.serviceId==="string"?params.serviceId:undefined} onRetry={()=>void data.refresh()} onBack={()=>router.replace("/provider/(tabs)/profile")} onGo={(step,serviceId)=>router.setParams({step,serviceId:serviceId??""})} onSetup={()=>router.push("/provider-onboarding/welcome")} onUnavailable={setUnavailable} actions={actions}/>{unavailable&&<ProviderServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}
export function ConnectedProviderAvailability(){
  const router=useRouter(),client=useApolloClient(),toast=useToast(),ownerId=useAppSelector(s=>s.auth.user?.id),signedIn=useAppSelector(s=>s.auth.isAuthenticated&&!!s.auth.accessToken&&!!s.auth.user),[unavailable,setUnavailable]=useState<string>();
  const [saved,setSaved]=useState<Availability>(),[loadFailed,setLoadFailed]=useState<string>(),[busy,setBusy]=useState(false),[error,setError]=useState<string>();
  useEffect(()=>{
    if(!ownerId)return;let live=true;setSaved(undefined);setLoadFailed(undefined);
    loadAvailability(client,ownerId).then(a=>{if(live)setSaved(a);}).catch(e=>{if(live)setLoadFailed(e instanceof Error?e.message:"Your availability could not be loaded.");});
    return()=>{live=false;};
  },[client,ownerId]);
  const save=(value:Availability)=>{
    if(!ownerId||busy)return;setBusy(true);setError(undefined);
    saveAvailability(client,ownerId,value).then(a=>{setSaved(a);toast.success("Availability saved.");}).catch(e=>setError(e instanceof Error?e.message:"Couldn’t save your availability.")).finally(()=>setBusy(false));
  };
  if(!signedIn)return <Redirect href="/sign-in"/>;
  return <View style={{flex:1,backgroundColor:Colors.surface}}><LiveAvailabilityContent key={ownerId} onBack={()=>router.replace("/provider/(tabs)/profile")} onUnavailable={setUnavailable} saved={saved} loadFailed={loadFailed} onSave={save} busy={busy} error={error}/>{unavailable&&<ProviderServiceBoundary action={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

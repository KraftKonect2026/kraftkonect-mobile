import { useState } from "react";
import { Platform, View } from "react-native";
import { Redirect } from "expo-router";
import { Asset } from "expo-asset";
import * as Linking from "expo-linking";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { LiveAvailabilityContent, LiveCatalogContent } from "@/components/provider/LiveCatalogContent";
import { ManagementStep } from "@/components/provider/ProviderManagementScreens";
import { ownedProviderCatalog } from "@/lib/provider/liveCatalog";
import Colors from "@/constants/colors";

export default function ProviderReadPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <Preview/>;}
function Preview(){
  const [step,setStep]=useState<ManagementStep>("services"),[serviceId,setServiceId]=useState<string>(),[error,setError]=useState(false),[dialog,setDialog]=useState<string>();
  // The fixture's public photo URL resolves to the existing approved local sink asset.
  const assetUri=Asset.fromModule(require("@/assets/design/1b9df.png")).uri;
  const photo=Platform.OS==="web"?new URL(assetUri,Linking.createURL("/")).href:assetUri;
  const catalog=ownedProviderCatalog("fixture-account-amina",{id:"fixture-account-amina",name:"Amina Yusuf Bello"},{id:"fixture-provider-amina",listings:[{id:"fixture-service-1",title:"Kitchen plumbing repair",description:"Inspect and repair kitchen taps, pipes and drainage.",minPriceCents:2500000,priceCents:2500000,currency:"NGN",active:true,photos:[photo]},{id:"fixture-service-hidden",title:"Bathroom pipe repair",description:"Repair leaking bathroom pipes and fittings.",minPriceCents:3000000,currency:"NGN",active:false,photos:[photo]}]});
  const go=(next:ManagementStep,id?:string)=>{setStep(next);setServiceId(id);};
  return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><View style={{minHeight:44,paddingLeft:16,paddingRight:8,backgroundColor:Colors.background,flexDirection:"row",alignItems:"center",gap:8}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>PROVIDER READ PREVIEW · Fictional API response · No uploads or service writes</AppText><Button title={step==="availability"?"Services":"Availability"} size="compact" variant="subtle" onPress={()=>go(step==="availability"?"services":"availability")}/>{step!=="availability"&&<Button title={error?"Sample":"Read error"} size="compact" variant="subtle" onPress={()=>setError(value=>!value)}/>}</View>{step==="availability"?<LiveAvailabilityContent preview onBack={()=>go("services")} onUnavailable={setDialog}/>:<LiveCatalogContent preview catalog={catalog} step={step} serviceId={serviceId} loading={false} error={error?"Sample service read failed. Saved services have not been removed.":undefined} onRetry={()=>setError(false)} onBack={()=>setDialog("Account")} onGo={go} onSetup={()=>setDialog("Provider setup")} onUnavailable={setDialog}/>} {dialog&&<Sheet title={dialog+" unavailable"} showClose onClose={()=>setDialog(undefined)}><Callout message="This read preview cannot select a file, change a service, save weekdays or remove a listing. Your saved fixture records stay available."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}</View>;
}

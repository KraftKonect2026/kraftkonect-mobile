import { useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { ModeHeader } from "@/components/ModeHeader";
import { BottomNavigation, navigationItems } from "@/components/BottomNavigation";
import { AccountHub } from "@/components/account/AccountHub";
import { LiveAccountContent } from "@/components/account/LiveAccountContent";
import { accountReadSnapshot, liveAccountStep, LiveAccountStep } from "@/lib/account/liveAccount";
import { AppMode } from "@/lib/appMode";
import Colors from "@/constants/colors";

export default function AdapterPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <AdapterPreview/>;}
function AdapterPreview(){
 const params=useLocalSearchParams<{step?:string}>(),router=useRouter(),[mode,setMode]=useState<AppMode>("customer"),[step,setStep]=useState<LiveAccountStep|"hub">(params.step?liveAccountStep(params.step):"hub"),[dialog,setDialog]=useState<string>(),[area,setArea]=useState("Lekki Phase 1, Lagos");
 const snapshot=accountReadSnapshot("fixture-account-amina",{id:"fixture-account-amina",name:"Amina Yusuf Bello",phone:"+2348012345678",phoneVerified:true,email:"amina@example.test",emailVerified:true},{id:"fixture-provider-amina",status:"approved",kycStatus:"in_review",bio:"Plumbing specialist helping homes and small businesses."},area);
 const open=(what:string)=>{if(["services","availability","earnings","verification","sign-out","saved"].includes(what))setDialog(what);else setStep(liveAccountStep(what));};
 return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><View style={{paddingHorizontal:16,minHeight:44,backgroundColor:Colors.background,justifyContent:"center"}}><AppText variant="footnote" color={Colors.textSecondary}>READ ADAPTER PREVIEW · Fictional API response · No sign-in, uploads or account writes</AppText></View>{step==="hub"?<><ModeHeader mode={mode} onModeChange={setMode} onNotifications={()=>setDialog("Notifications")} showNotifications={mode==="customer"} showBorder={mode==="customer"}/><AccountHub mode={mode} account={{firstName:snapshot.firstName,lastName:snapshot.lastName,profile:{avatar:false},verificationLabel:snapshot.verificationLabel}} onOpen={open}/><BottomNavigation items={navigationItems(mode)} activeKey="account" onPress={setDialog}/></>:<LiveAccountContent preview step={step} mode={mode} account={snapshot} onBack={()=>setStep("hub")} onGo={setStep} onUnavailable={setDialog} onRecovery={()=>router.push("/recovery")} onSaveArea={async value=>{setArea(value);setStep("privacy");}} onPhoto={()=>setDialog("Photo update")} onSaveBio={async()=>setDialog("Introduction update")}/>}{dialog&&<Sheet title={dialog+" unavailable"} showClose onClose={()=>setDialog(undefined)}><Callout message="This preview demonstrates the account read adapter and service boundary. It does not sign in, select a file, change a real account or send an external request."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}</View>;
}

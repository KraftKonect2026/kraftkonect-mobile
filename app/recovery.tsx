import { useState } from "react";
import { useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { RecoveryFields, RecoveryScreen } from "@/components/account/RecoveryScreens";
import { RecoveryStep } from "@/lib/account/recovery";

/** Public recovery entry. No local proof, scoring, contact change or authenticated session is synthesized here. */
export default function RecoveryRoute(){
 const router=useRouter(),[step,setStep]=useState<RecoveryStep>("choose"),[method,setMethod]=useState<"email"|"identity">("email"),[fields,setFields]=useState<RecoveryFields>({email:"",name:"",oldPhone:"",newPhone:"",code:"",answers:{}}),[unavailable,setUnavailable]=useState(false);
 const signIn=()=>router.replace("/sign-in");
 return <><RecoveryScreen step={step} method={method} onMethod={setMethod} fields={fields} onFields={p=>setFields(f=>({...f,...p}))} onNext={()=>{if(step==="choose")setStep(method==="email"?"email":"identity");else setUnavailable(true);}} onBack={()=>{if(step==="choose")signIn();else setStep("choose");}} onActivity={()=>setUnavailable(true)} onCapture={()=>setUnavailable(true)} onSupport={()=>setStep("support")} onSignIn={signIn} onHome={signIn} onResend={()=>setUnavailable(true)} resendSeconds={0} busy={false} onEmailSupport={()=>setUnavailable(true)}/>{unavailable&&<Sheet title="Recovery temporarily unavailable" showClose onClose={()=>setUnavailable(false)}><Callout message="Your sign-in details have not changed. Recovery needs the account’s verified email or ownership review service. Please try again later."/><AppText variant="bodySmall">For recovery help: support@kraftkonect.com</AppText><Button title="Return to sign in" onPress={signIn}/></Sheet>}</>;
}

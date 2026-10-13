import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Heading } from "@/components/bookings/Parts";
import { AccountFrame, SettingsRow } from "@/components/account/AccountParts";
import { AccountStep } from "@/components/account/AccountScreens";
import { SampleAccount } from "@/lib/account/model";
import Colors from "@/constants/colors";
export function LifecycleScreen({step,r,busy,error,onBack,onGo,onNext,onOpen}:{step:AccountStep;r:SampleAccount;busy:boolean;error?:string;onBack:()=>void;onGo:(step:AccountStep)=>void;onNext:()=>void;onOpen:(target:string)=>void}){
 let title="",subtitle="",body,footer;
 const next=(label:string,error=false)=><Button title={label} loading={busy} onPress={onNext} style={error?{backgroundColor:Colors.error}:undefined}/>;
 const keep=(label="Keep my account",compact=true)=><Button title={label} variant={compact?"subtle":"outline"} size={compact?"compact":"regular"} disabled={busy} onPress={()=>onGo("details")}/>;
 if(step==="delete"){
  title="Delete your account";subtitle="Your account enters a 30-day notice period before final deletion.";
  body=<><Callout title="One account, both roles" message="Deleting your account removes access to both customer and provider features." tone="error"/><View style={{gap:20}}><SettingsRow title="Your profile and services" description="Your profile is hidden when you submit. It is removed at final deletion."/><SettingsRow title="Your personal information" description="Personal data no longer needed is deleted after the notice period."/></View><AppText variant="bodySmall" color={Colors.textSecondary}>Some transaction, dispute or security records may need to be retained where required.</AppText></>;
  footer=<>{next("Continue")}{keep()}</>;
 }else if(step==="delete-activity"){
  title="Active jobs & payments";subtitle="What happens to your open work when you request deletion.";
  body=<><Callout title="30-day notice before final deletion" message="Final deletion follows the 30-day notice period, once open jobs, refunds and repayments are settled."/><View style={{gap:12}}><SettingsRow title="Customer balances will be refunded" description="For active jobs you’re providing, the customer’s paid balance is reviewed for refund through the existing process."/><SettingsRow title="Return materials money to KraftKonect" description="If you received money for materials for those jobs, you must return the amount still due to KraftKonect."/></View><AppText variant="captionRegular" color={Colors.textSecondary}>Support will confirm any repayment due and how to return it to KraftKonect.</AppText><Button title="Review my bookings" variant="outline" onPress={()=>onOpen("bookings")}/></>;
  footer=<>{next("Continue with deletion")}{keep()}</>;
 }else if(step==="delete-confirm"){
  title="Request account deletion?";subtitle="Your 30-day notice starts when you submit.";
  body=<><Callout title="30-day notice · both roles" tone="error" message="Final deletion affects both roles and takes place after 30 days, once open jobs and payments are settled."/><AppText variant="captionRegular" color={Colors.textSecondary}>Your profile is hidden as soon as you submit.</AppText><Callout title="For your active provider jobs" message="The customer’s paid balance will be reviewed for refund through the existing process. Any materials money you received must be repaid to KraftKonect."/><AppText variant="labelSupport">Once deletion is complete, this account cannot be restored.</AppText></>;
  footer=<>{next("Request account deletion",true)}{keep("Keep my account",false)}</>;
 }else if(step==="delete-requested"){
  title="Deletion requested";subtitle="Your 30-day notice period has started.";
  body=<><Callout title="Final deletion after the notice period" message="Final deletion needs the 30-day notice and settlement of open activity. We’ll confirm through your verified contact when it’s complete."/><AppText variant="body" color={Colors.textSecondary}>You’re signed out and your profile is no longer visible to other users.</AppText><Button title="Email support" variant="outline" onPress={()=>onOpen("deletion-support")}/></>;
  footer=<Button title="Back to sign in" onPress={()=>onOpen("sign-in")}/>;
 }else if(step==="deactivate"){
  title="Stop providing services?";subtitle="Deactivate your provider profile and keep your KraftKonect account.";
  body=<><Callout title="Keep using the app as a customer" message="You can still find providers, make bookings and message support."/><View style={{gap:20}}><SettingsRow title="Your services are hidden" description="Customers won’t find your listings or send new requests."/><SettingsRow title="Existing work stays accessible" description="Keep managing accepted jobs, messages and payouts."/><SettingsRow title="Come back whenever you’re ready" description="Reactivate your provider profile from Your account."/></View></>;
  footer=<>{next("Continue")}{keep("Keep providing services")}</>;
 }else if(step==="deactivate-confirm"){
  title="Deactivate your profile?";subtitle="Your customer account will stay active.";
  body=<><Callout title="No new requests" message="Your provider profile and services will be hidden until you reactivate."/><Callout title="Your existing commitments remain" message="Deactivation does not cancel accepted bookings or stop pending payouts."/></>;
  footer=<>{next("Deactivate provider profile")}{keep("Keep profile active",false)}</>;
 }else{
  title=r.providerStatus==="review"?"Reactivation under review":"Provider profile deactivated";subtitle="You can still use KraftKonect as a customer.";
  body=<><Callout title="Your services are hidden" message={r.providerStatus==="review"?"Your provider profile stays hidden until its reactivation review is approved.":"You won’t receive new requests while your provider profile is deactivated."}/><AppText variant="body" color={Colors.textSecondary}>You can still manage existing jobs, messages and payouts.</AppText><Button title="View existing jobs" variant="outline" onPress={()=>onOpen("bookings")}/></>;
  footer=<><Button title="Continue as customer" onPress={()=>onOpen("customer-home")}/><Button title="Reactivate provider profile" disabled={r.providerStatus==="review"||busy} loading={busy} variant="outline" onPress={onNext}/></>;
 }
 return <AccountFrame onBack={onBack} gap={step==="delete-activity"?12:20} footerBottomPadding={24} footer={<View style={{gap:8}}>{footer}</View>}><Heading title={title} subtitle={subtitle} gap={step.startsWith("delete")?8:4}/>{body}{error&&<Callout tone="error" title="Couldn’t save this change" message={error}/>}</AccountFrame>;
}

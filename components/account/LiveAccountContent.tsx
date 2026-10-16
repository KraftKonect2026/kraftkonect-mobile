import { ReactNode, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Callout } from "@/components/Callout";
import { VerificationCode } from "@/components/VerificationCode";
import { AccountFrame, SettingsRow, ToggleRow } from "./AccountParts";
import { PREF_ROWS, Prefs, PrefKey } from "@/lib/account/livePrefs";
import { maskedEmail } from "@/lib/account/liveContact";
import { Heading } from "@/components/bookings/Parts";
import { AccountReadSnapshot, LiveAccountStep } from "@/lib/account/liveAccount";
import { AppMode } from "@/lib/appMode";
import { customerPreferences, providerPreferences, areaError, emailAddress } from "@/lib/account/model";
import { maskedPhone, normalizedPhone, validName } from "@/lib/onboarding/model";
import { ProfilePhotos, WorkPhotos } from "@/components/onboarding/MediaFields";
import Colors from "@/constants/colors";

/** Changes to the phone number, recovery email and name, and pausing a provider profile. Each one asks the server and throws its sentence if refused. */
export type ContactActions={
 sendCheck:(then:"phone-new"|"email")=>Promise<void>;confirmCheck:(code:string)=>Promise<void>;hasProof:boolean;
 sendPhone:(newPhone:string)=>Promise<void>;confirmPhone:(code:string)=>Promise<void>;
 sendEmail:(email:string)=>Promise<void>;confirmEmail:(code:string)=>Promise<void>;
 saveName:(first:string,last:string)=>Promise<void>;setPaused:(paused:boolean)=>Promise<void>;
};
/** "Resend code" with a one minute wait, as on every other code screen. */
function ResendCode({onResend,busy}:{onResend:()=>void;busy:boolean}){
 const [until,setUntil]=useState(Date.now()+60_000),[now,setNow]=useState(Date.now());
 useEffect(()=>{if(until<=Date.now())return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[until]);
 const left=Math.max(0,Math.ceil((until-now)/1000));
 return <View style={{gap:4}}><AppText variant="captionRelaxed" color={Colors.textSecondary} style={{textAlign:"center"}}>{"Didn't get the code?"}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Resend code" disabled={busy||left>0} onPress={()=>{onResend();setUntil(Date.now()+60_000);setNow(Date.now());}} hitSlop={{top:13,bottom:13}} style={{minHeight:18,justifyContent:"center"}}><AppText variant="captionEmphasis" color={busy||left>0?Colors.disabled:Colors.primary} style={{textAlign:"center"}}>{left?"Resend in 00:"+String(left).padStart(2,"0"):"Resend code"}</AppText></Pressable></View>;
}
export function LiveAccountContent({step,mode,account,preview=false,busy=false,error,onBack,onGo,onUnavailable,onRecovery,onSaveArea,onPhoto,onSaveBio,onOpen,onAskDeletionCode,onRequestDeletion,prefs,onPref,contact}:{
 step:LiveAccountStep;mode:AppMode;account:AccountReadSnapshot;preview?:boolean;busy?:boolean;error?:string;
 onBack:()=>void;onGo:(s:LiveAccountStep)=>void;onUnavailable:(what:string)=>void;onRecovery:()=>void;
 onSaveArea:(value:string)=>Promise<void>;onPhoto:(kind:"personal"|"avatar"|"banner")=>void;onSaveBio:(bio:string)=>Promise<void>;
 onOpen?:(target:string)=>void;onAskDeletionCode?:()=>Promise<void>;onRequestDeletion?:(code:string)=>Promise<void>;
 prefs?:Prefs;onPref?:(key:PrefKey,value:boolean)=>void;contact?:ContactActions;
}) {
 const [code,setCode]=useState(""),[newPhone,setNewPhone]=useState(""),[resendAt,setResendAt]=useState(0),[tick,setTick]=useState(Date.now());
 useEffect(()=>{if(resendAt<=Date.now())return;const t=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(t);},[resendAt]);
 useEffect(()=>{if(!["delete-code","phone-check","phone-new-code","email-code"].includes(step))setCode("");},[step]);
 useEffect(()=>{if(step==="phone-new")setNewPhone("");},[step]);
 const resendSeconds=Math.max(0,Math.ceil((resendAt-tick)/1000));
 const live=!!onRequestDeletion&&!!onAskDeletionCode;
 const [first,setFirst]=useState(account.firstName),[last,setLast]=useState(account.lastName),[email,setEmail]=useState(""),[area,setArea]=useState(account.area??""),[bio,setBio]=useState(account.providerBio??"");
 useEffect(()=>{setFirst(account.firstName);setLast(account.lastName);setEmail("");setArea(account.area??"");setBio(account.providerBio??"");},[account.id,account.firstName,account.lastName,account.area,account.providerBio]);
 let title="Your account",subtitle:string|undefined="Personal details and access for both roles.",body:ReactNode,footer:ReactNode,gap=20;
 const unavailable=(label:string)=><Button title={label} disabled={busy} onPress={()=>onUnavailable(label)}/>;
 const names=<><Input label="First name" value={first} onChangeText={setFirst} maxLength={60} editable={!busy}/><Input label="Last name" value={last} onChangeText={setLast} maxLength={60} editable={!busy}/></>;
 const cancel=<Button title="Cancel" variant="outline" disabled={busy} onPress={()=>onGo("details")}/>;
 const section=(label:string,children:ReactNode)=><View><AppText variant="captionRegular" color={Colors.textSecondary}>{label}</AppText>{children}</View>;
 if(step==="details"){
  gap=24;body=<>{mode==="provider"&&section("PERSONAL DETAILS",<><SettingsRow title="Full name" description={account.name} onPress={()=>onGo("name")}/><SettingsRow title="Primary area" description={account.area??"Not selected"} onPress={()=>onGo("area")}/></>)}{section("SIGN-IN & RECOVERY",<><SettingsRow title="Phone number" description={account.phone?maskedPhone(account.phone):"Number unavailable"} onPress={()=>onGo("phone")}/><SettingsRow title="Recovery email" description={account.contactEmail?maskedEmail(account.contactEmail)+(account.contactEmailVerified?" · Verified":" · Not verified"):"Add a recovery email"} onPress={()=>onGo("email")}/></>)}{mode==="provider"&&<Callout message="Use a recovery email if you lose your phone."/>}{section("ACCOUNT CONTROLS",<>{mode==="provider"&&<SettingsRow title="Provider profile status" description={account.providerStatus==="deactivated"?"Paused · hidden from new requests":account.providerStatus==="approved"?"Active":account.providerStatus?"Not live yet":"Profile status unavailable"} onPress={()=>onGo("deactivate")}/>}<SettingsRow title="Delete account" description="Permanently close your KraftKonect account" error onPress={()=>onGo("delete")}/></>)}</>;
 }else if(step==="profile-details"||step==="name"){
  const edit=step==="profile-details";title=edit?"Profile details":"Change your name";subtitle=edit?undefined:"Use your full name as it appears on your ID.";
  body=<>{edit&&<Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo" disabled={busy} onPress={()=>onPhoto("personal")} style={{width:72,height:72,borderRadius:999,alignSelf:"center",justifyContent:"center",alignItems:"center",backgroundColor:Colors.background,overflow:"hidden"}}>{account.avatarUrl&&<Image source={{uri:account.avatarUrl}} style={{width:72,height:72}} contentFit="cover"/>}<Image source={require("@/assets/onboarding/702e9.svg")} style={{width:24,height:24}} contentFit="contain" accessible={false}/></Pressable>}{names}<Callout title={edit?undefined:"Your verified identity matters"} message={edit?"Your first name and photo are visible to providers you contact.":"We’ll review this change against your ID. Your current name stays on your account until it’s approved."}/></>;
  footer=<><Button title={edit?"Save changes":"Request name change"} loading={busy} disabled={busy||!validName(first)||!validName(last)} onPress={()=>contact?void contact.saveName(first,last).catch(()=>undefined):onUnavailable("Name review")}/>{!edit&&cancel}</>;
 }else if(step==="phone"){
  title="Confirm it’s you";subtitle="Verify your current number before changing it.";
  body=<><Callout title="Current phone" message={account.phone?maskedPhone(account.phone):"Number unavailable"}/><Callout message="Your current phone stays active until ownership and the replacement number are verified."/></>;
  footer=<>{contact?<Button title="Send verification code" loading={busy} disabled={busy||!account.phone} onPress={()=>void contact.sendCheck("phone-new").then(()=>onGo("phone-check")).catch(()=>undefined)}/>:unavailable("Send verification code")}<Button title="I can’t access this number" variant="outline" onPress={onRecovery}/>{cancel}</>;
 }else if(contact&&step==="phone-check"){
  title="Enter your code";subtitle="We sent a 6-digit code to "+(account.phone?maskedPhone(account.phone):"your current number")+".";
  body=<><VerificationCode value={code} onChange={setCode} disabled={busy}/><ResendCode busy={busy} onResend={()=>void contact.sendCheck("phone-new").catch(()=>undefined)}/></>;
  footer=<><Button title="Verify" loading={busy} disabled={code.length!==6} onPress={()=>void contact.confirmCheck(code).catch(()=>setCode(""))}/>{cancel}</>;
 }else if(contact&&step==="phone-new"){
  title="Your new number";subtitle="This number will replace your current one once you verify it.";
  body=<><Input label="New phone number" prefix="+234" placeholder="801 234 5678" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" maxLength={20} editable={!busy}/><Callout message="You’ll sign in with this number from now on. Your jobs, messages and reviews stay on your account."/></>;
  footer=<><Button title="Send code" loading={busy} disabled={busy||!normalizedPhone(newPhone)} onPress={()=>void contact.sendPhone(newPhone).then(()=>onGo("phone-new-code")).catch(()=>undefined)}/>{cancel}</>;
 }else if(contact&&step==="phone-new-code"){
  title="Verify your new number";subtitle="Enter the 6-digit code sent to "+(normalizedPhone(newPhone)?maskedPhone(normalizedPhone(newPhone)!):"your new number")+".";
  body=<><VerificationCode value={code} onChange={setCode} disabled={busy}/><ResendCode busy={busy} onResend={()=>void contact.sendPhone(newPhone).catch(()=>undefined)}/></>;
  footer=<><Button title="Verify and change number" loading={busy} disabled={code.length!==6} onPress={()=>void contact.confirmPhone(code).catch(()=>setCode(""))}/>{cancel}</>;
 }else if(step==="email"){
  title="Add a recovery email";subtitle="A backup way to recover access to your account.";
  body=<><Input label="Email address" value={email} onChangeText={setEmail} maxLength={254} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!busy}/><Callout title="Verify before saving" message={contact&&account.contactEmailVerified?"You already have a recovery email. To replace it we’ll first text a code to your phone, then email a code to the new address.":"A recovery email must be verified before it can help restore access."}/></>;
  footer=<><Button title={contact&&account.contactEmailVerified&&!contact.hasProof?"Confirm it’s you first":"Send verification code"} loading={busy} disabled={busy||!emailAddress(email)} onPress={()=>contact?(account.contactEmailVerified&&!contact.hasProof?void contact.sendCheck("email").then(()=>onGo("phone-check")).catch(()=>undefined):void contact.sendEmail(emailAddress(email)!).then(()=>onGo("email-code")).catch(()=>undefined)):onUnavailable("Recovery email verification")}/>{cancel}</>;
 }else if(contact&&step==="email-code"){
  title="Check your email";subtitle="Enter the 6-digit code we sent to "+(emailAddress(email)??"your email")+".";
  body=<><VerificationCode value={code} onChange={setCode} disabled={busy}/><ResendCode busy={busy} onResend={()=>emailAddress(email)&&void contact.sendEmail(emailAddress(email)!).catch(()=>undefined)}/></>;
  footer=<><Button title="Verify email" loading={busy} disabled={code.length!==6} onPress={()=>void contact.confirmEmail(code).catch(()=>setCode(""))}/>{cancel}</>;
 }else if(step==="privacy"||step==="area"){
  title=step==="privacy"?"Location & privacy":mode==="provider"?"Change primary area":"Change default area";subtitle=step==="privacy"?"Choose your area and manage location access.":"Choose an area for nearby service suggestions.";
  body=step==="privacy"?<><Callout title="Default area" message={account.area??"Not selected"}/><SettingsRow title="Change default area" description="Find nearby services without saving a home address." onPress={()=>onGo("area")}/></>:<><Callout title="Current area" message={account.area??"Not selected"}/><Input label="Location" placeholder="e.g. Ikeja" value={area} onChangeText={setArea} maxLength={120} editable={!busy}/><AppText variant="body" color={Colors.textSecondary}>This default area is saved on this device. Add the precise appointment address separately for each job.</AppText></>;
  if(step==="area")footer=<><Button title="Use this location" loading={busy} disabled={!!areaError(area)} onPress={()=>void onSaveArea(area)}/>{cancel}</>;
 }else if(step==="preferences"){
  title="Notifications";subtitle="Choose the push notifications you receive.";
  body=prefs&&onPref?<><View>{PREF_ROWS.map(p=><ToggleRow key={p.key} title={p.label} description={p.description} value={prefs[p.key]} disabled={busy||(p.key!=="pushNotifications"&&p.key!=="emailNotifications"&&!prefs.pushNotifications)} onChange={()=>onPref(p.key,!prefs[p.key])}/>)}</View><AppText variant="captionRegular" color={Colors.textSecondary}>Payout updates, security notices and anything about your account always reach you in your notification list, whatever you choose here.</AppText></>:<><Callout title="Preferences unavailable" message="Your notification settings could not be loaded. Account security and essential in-app updates stay accessible."/><View>{(mode==="provider"?providerPreferences:customerPreferences).map(p=><SettingsRow key={p.key} title={p.label} description={p.description} onPress={()=>onUnavailable("Notification preferences")}/>)}</View></>;
 }else if(step==="payments"){
  title="Payments";subtitle="Manage saved cards and view your payment records.";
  body=<><Callout title="Saved cards unavailable" message="Your authorized payment cards could not be loaded. Try again later."/><View><SettingsRow title="Add payment card" description="Add another debit or credit card" icon="payment" forward="settingsForward" onPress={()=>onGo("add-card")}/><SettingsRow title="Payment history" description="Look up recent booking payments" icon="history" onPress={()=>onGo("payment-history")}/></View><Callout title="Protected payment · No extra fee" message="Pay through the connected secure checkout. Verified payments and release updates stay attached to your job."/><AppText variant="captionRegular" color={Colors.textSecondary}>Never share your card PIN or verification code in chat.</AppText></>;
 }else if(step==="add-card"){
  title="Add payment card";subtitle="Add a card through the secure payment provider.";
  body=<Callout title="Secure card authorization" message="Enter card details only through the payment provider’s secure checkout. Your card is saved after confirmed authorization."/>;footer=unavailable("Continue securely");
 }else if(step==="payment-history"||step==="reviews"){
  title=step==="reviews"?"Your reviews":"Payment history";subtitle=step==="reviews"?"Feedback you’ve shared after completed jobs.":"View payments made through KraftKonect.";
  body=<Callout title={title+" unavailable"} message="Your saved records could not be loaded. They have not been removed. Try again later."/>;
 }else if(step==="help"){
  title="Help & support";subtitle="Find an answer or talk to our support team.";
  body=<><View><SettingsRow title="Message support" icon="support" onPress={()=>onUnavailable("Support")}/><SettingsRow title="Give us feedback" icon="feedback" onPress={()=>onUnavailable("Feedback")}/></View><Callout title="Need help with a booking?" message="Open the booking and choose Report a problem so support can see the job details."/></>;
 }else if(step==="legal"){
  title="Legal";subtitle="Keep your bookings, payments and conversations protected.";
  body=<View><SettingsRow title="Terms of use" minHeight={52} onPress={()=>onUnavailable("Terms of use")}/><SettingsRow title="Privacy policy" minHeight={52} onPress={()=>onUnavailable("Privacy policy")}/></View>;
 }else if(step==="provider-profile"){
  title="Provider profile";subtitle="The information customers see about your work.";
  body=<><ProfilePhotos banner={account.providerBanner??""} avatar={account.providerAvatar??""} disabled={busy} onPhoto={kind=>{if(kind==="avatar"||kind==="banner")onPhoto(kind);}}/><Input label="Business or display name" value="" placeholder="Unavailable" editable={false}/><Input label="Short introduction" value={bio} onChangeText={setBio} maxLength={2000} multiline editable={!busy}/><WorkPhotos photos={[]} onAdd={()=>onUnavailable("Work photos")} onRemove={()=>{}}/><AppText variant="captionRegular" color={Colors.textSecondary}>Your public business name and work photos could not be loaded.</AppText></>;
  footer=<Button title="Save changes" loading={busy} disabled={!account.providerId||bio.trim().length<10} onPress={()=>void onSaveBio(bio)}/>;
 }else if(live&&step==="delete"){
  title="Delete your account";subtitle="Your account enters a 30-day notice period before final deletion.";
  body=<><Callout title="One account, both roles" message="Deleting your account removes access to both customer and provider features." tone="error"/><View style={{gap:20}}><SettingsRow title="Your profile and services" description="Your profile is hidden when you submit. It is removed at final deletion."/><SettingsRow title="Your personal information" description="Your name, phone, email, photos, bank details and addresses are deleted after the notice period."/></View><AppText variant="bodySmall" color={Colors.textSecondary}>Some transaction, dispute or security records are kept where required, without your name.</AppText></>;
  footer=<><Button title="Continue" disabled={busy} onPress={()=>onGo("delete-activity")}/>{cancel}</>;
 }else if(live&&step==="delete-activity"){
  title="Active jobs & payments";subtitle="What happens to your open work when you request deletion.";
  body=<><Callout title="Open jobs end right away" message="Every job still open is cancelled when you submit. Anything already paid goes to KraftKonect support for a refund decision, the same as any cancellation."/><View style={{gap:12}}><SettingsRow title="Customers are refunded" description="For jobs you were providing, the customer’s paid balance is reviewed for refund."/><SettingsRow title="Money you hold" description="Earnings in your wallet are paid to your saved bank account once the notice ends. Money you must return for a refund is taken first."/></View><AppText variant="captionRegular" color={Colors.textSecondary}>Final deletion waits until jobs, refunds, repayments and payouts are settled. Support will tell you if anything is holding it up.</AppText><Button title="Review my bookings" variant="outline" onPress={()=>onOpen?.("bookings")}/></>;
  footer=<><Button title="Continue with deletion" disabled={busy} onPress={()=>onGo("delete-confirm")}/>{cancel}</>;
 }else if(live&&step==="delete-confirm"){
  title="Request account deletion?";subtitle="Your 30-day notice starts when you submit.";
  body=<><Callout title="30-day notice · both roles" tone="error" message="You will be signed out and your profile hidden straight away. Your account is deleted after 30 days once everything is settled."/><AppText variant="body" color={Colors.textSecondary}>{"We’ll text a 6-digit code to "+(account.phone?maskedPhone(account.phone):"your phone")+" to confirm it is you."}</AppText><AppText variant="labelSupport">Once deletion is complete, this account cannot be restored.</AppText></>;
  footer=<><Button title="Send me a code" loading={busy} style={{backgroundColor:Colors.error}} onPress={()=>void onAskDeletionCode!().then(()=>{setResendAt(Date.now()+60_000);setTick(Date.now());onGo("delete-code");}).catch(()=>undefined)}/><Button title="Keep my account" variant="outline" disabled={busy} onPress={()=>onGo("details")}/></>;
 }else if(live&&step==="delete-code"){
  title="Enter your code";subtitle="Enter the 6-digit code we sent to confirm.";
  body=<><VerificationCode value={code} onChange={setCode} disabled={busy}/><View style={{gap:4}}><AppText variant="captionRelaxed" color={Colors.textSecondary} style={{textAlign:"center"}}>{"Didn't get the code?"}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Resend code" disabled={busy||resendSeconds>0} onPress={()=>void onAskDeletionCode!().then(()=>{setResendAt(Date.now()+60_000);setTick(Date.now());}).catch(()=>undefined)} hitSlop={{top:13,bottom:13}} style={{minHeight:18,justifyContent:"center"}}><AppText variant="captionEmphasis" color={busy||resendSeconds>0?Colors.disabled:Colors.primary} style={{textAlign:"center"}}>{resendSeconds?"Resend in 00:"+String(resendSeconds).padStart(2,"0"):"Resend code"}</AppText></Pressable></View></>;
  footer=<><Button title="Request account deletion" loading={busy} disabled={code.length!==6} style={{backgroundColor:Colors.error}} onPress={()=>void onRequestDeletion!(code).catch(()=>setCode(""))}/><Button title="Keep my account" variant="outline" disabled={busy} onPress={()=>onGo("details")}/></>;
 }else if(contact&&(step==="deactivate"||step==="deactivate-confirm")){
  const paused=account.providerStatus==="deactivated";
  if(paused){
   title="Provider profile paused";subtitle="You can still use KraftKonect as a customer.";
   body=<><Callout title="Your services are hidden" message="You won’t receive new requests while your profile is paused."/><AppText variant="body" color={Colors.textSecondary}>Jobs you already accepted, messages and payouts carry on as normal.</AppText></>;
   footer=<><Button title="Resume provider profile" loading={busy} onPress={()=>void contact.setPaused(false).catch(()=>undefined)}/>{cancel}</>;
  }else if(account.providerStatus!=="approved"){
   title="Provider profile";subtitle="Your profile isn’t live yet.";
   body=<Callout title="Nothing to pause" message="Once your provider profile is approved and live you can pause it here."/>;footer=cancel;
  }else if(step==="deactivate"){
   title="Stop providing services?";subtitle="Pause your provider profile and keep your KraftKonect account.";
   body=<><Callout title="Keep using the app as a customer" message="You can still find providers, make bookings and message support."/><View style={{gap:20}}><SettingsRow title="Your services are hidden" description="Customers won’t find your listings or send new requests."/><SettingsRow title="Existing work stays accessible" description="Keep managing accepted jobs, messages and payouts."/><SettingsRow title="Come back whenever you’re ready" description="Resume your provider profile from Your account."/></View></>;
   footer=<><Button title="Continue" disabled={busy} onPress={()=>onGo("deactivate-confirm")}/><Button title="Keep providing services" variant="outline" disabled={busy} onPress={()=>onGo("details")}/></>;
  }else{
   title="Pause your profile?";subtitle="Your customer account will stay active.";
   body=<><Callout title="No new requests" message="Your provider profile and services will be hidden until you resume."/><Callout title="Your existing commitments remain" message="Pausing does not cancel accepted bookings or stop pending payouts."/></>;
   footer=<><Button title="Pause provider profile" loading={busy} onPress={()=>void contact.setPaused(true).catch(()=>undefined)}/><Button title="Keep profile active" variant="outline" disabled={busy} onPress={()=>onGo("details")}/></>;
  }
 }else{
  title=step==="delete"?"Delete your account":"Deactivate provider profile";subtitle=step==="delete"?"Understand what happens before you continue.":"Pause providing services while keeping your account.";
  body=<Callout title={step==="delete"?"Deletion requires ownership verification":"Existing activity stays accessible"} message={step==="delete"?"A verified deletion request starts a 30-day notice and signs you out. Final deletion also requires settlement of open activity.":"Deactivation hides new public discovery. Existing jobs, messages, repayments and earnings stay with your account."}/>;
  footer=<>{unavailable(step==="delete"?"Continue to account verification":"Continue to deactivation")}{cancel}</>;
 }
 return <AccountFrame preview={preview} onBack={onBack} gap={gap} footer={footer&&<View style={{gap:8}}>{footer}</View>}><Heading title={title} subtitle={subtitle}/>{body}{error&&<Callout tone="error" message={error}/>}</AccountFrame>;
}

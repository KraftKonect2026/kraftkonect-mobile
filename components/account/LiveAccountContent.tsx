import { ReactNode, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Callout } from "@/components/Callout";
import { AccountFrame, SettingsRow } from "./AccountParts";
import { Heading } from "@/components/bookings/Parts";
import { AccountReadSnapshot, LiveAccountStep } from "@/lib/account/liveAccount";
import { AppMode } from "@/lib/appMode";
import { customerPreferences, providerPreferences, areaError, emailAddress } from "@/lib/account/model";
import { maskedPhone, validName } from "@/lib/onboarding/model";
import { ProfilePhotos, WorkPhotos } from "@/components/onboarding/MediaFields";
import Colors from "@/constants/colors";

export function LiveAccountContent({step,mode,account,preview=false,busy=false,error,onBack,onGo,onUnavailable,onRecovery,onSaveArea,onPhoto,onSaveBio}:{
 step:LiveAccountStep;mode:AppMode;account:AccountReadSnapshot;preview?:boolean;busy?:boolean;error?:string;
 onBack:()=>void;onGo:(s:LiveAccountStep)=>void;onUnavailable:(what:string)=>void;onRecovery:()=>void;
 onSaveArea:(value:string)=>Promise<void>;onPhoto:(kind:"personal"|"avatar"|"banner")=>void;onSaveBio:(bio:string)=>Promise<void>;
}) {
 const [first,setFirst]=useState(account.firstName),[last,setLast]=useState(account.lastName),[email,setEmail]=useState(""),[area,setArea]=useState(account.area??""),[bio,setBio]=useState(account.providerBio??"");
 useEffect(()=>{setFirst(account.firstName);setLast(account.lastName);setEmail("");setArea(account.area??"");setBio(account.providerBio??"");},[account.id,account.firstName,account.lastName,account.area,account.providerBio]);
 let title="Your account",subtitle:string|undefined="Personal details and access for both roles.",body:ReactNode,footer:ReactNode,gap=20;
 const unavailable=(label:string)=><Button title={label} disabled={busy} onPress={()=>onUnavailable(label)}/>;
 const names=<><Input label="First name" value={first} onChangeText={setFirst} maxLength={60} editable={!busy}/><Input label="Last name" value={last} onChangeText={setLast} maxLength={60} editable={!busy}/></>;
 const cancel=<Button title="Cancel" variant="outline" disabled={busy} onPress={()=>onGo("details")}/>;
 const section=(label:string,children:ReactNode)=><View><AppText variant="captionRegular" color={Colors.textSecondary}>{label}</AppText>{children}</View>;
 if(step==="details"){
  gap=24;body=<>{mode==="provider"&&section("PERSONAL DETAILS",<><SettingsRow title="Full name" description={account.name} onPress={()=>onGo("name")}/><SettingsRow title="Primary area" description={account.area??"Not selected"} onPress={()=>onGo("area")}/></>)}{section("SIGN-IN & RECOVERY",<><SettingsRow title="Phone number" description={account.phone?maskedPhone(account.phone):"Number unavailable"} onPress={()=>onGo("phone")}/><SettingsRow title="Recovery email" description="Recovery status unavailable" onPress={()=>onGo("email")}/></>)}{mode==="provider"&&<Callout message="Use a recovery email if you lose your phone."/>}{section("ACCOUNT CONTROLS",<>{mode==="provider"&&<SettingsRow title="Provider profile status" description="Profile status unavailable" onPress={()=>onGo("deactivate")}/>}<SettingsRow title="Delete account" description="Permanently close your KraftKonect account" error onPress={()=>onGo("delete")}/></>)}</>;
 }else if(step==="profile-details"||step==="name"){
  const edit=step==="profile-details";title=edit?"Profile details":"Change your name";subtitle=edit?undefined:"Use your full name as it appears on your ID.";
  body=<>{edit&&<Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo" disabled={busy} onPress={()=>onPhoto("personal")} style={{width:72,height:72,borderRadius:999,alignSelf:"center",justifyContent:"center",alignItems:"center",backgroundColor:Colors.background,overflow:"hidden"}}>{account.avatarUrl&&<Image source={{uri:account.avatarUrl}} style={{width:72,height:72}} contentFit="cover"/>}<Image source={require("@/assets/onboarding/702e9.svg")} style={{width:24,height:24}} contentFit="contain" accessible={false}/></Pressable>}{names}<Callout title={edit?undefined:"Your verified identity matters"} message={edit?"Your first name and photo are visible to providers you contact.":"We’ll review this change against your ID. Your current name stays on your account until it’s approved."}/></>;
  footer=<><Button title={edit?"Save changes":"Continue to ID check"} disabled={busy||!validName(first)||!validName(last)} onPress={()=>onUnavailable("Name review")}/>{!edit&&cancel}</>;
 }else if(step==="phone"){
  title="Confirm it’s you";subtitle="Verify your current number before changing it.";
  body=<><Callout title="Current phone" message={account.phone?maskedPhone(account.phone):"Number unavailable"}/><Callout message="Your current phone stays active until ownership and the replacement number are verified."/></>;
  footer=<>{unavailable("Send verification code")}<Button title="I can’t access this number" variant="outline" onPress={onRecovery}/>{cancel}</>;
 }else if(step==="email"){
  title="Add a recovery email";subtitle="A backup way to recover access to your account.";
  body=<><Input label="Email address" value={email} onChangeText={setEmail} maxLength={254} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!busy}/><Callout title="Verify before saving" message="A recovery email must be verified before it can help restore access."/></>;
  footer=<><Button title="Send verification code" disabled={busy||!emailAddress(email)} onPress={()=>onUnavailable("Recovery email verification")}/>{cancel}</>;
 }else if(step==="privacy"||step==="area"){
  title=step==="privacy"?"Location & privacy":mode==="provider"?"Change primary area":"Change default area";subtitle=step==="privacy"?"Choose your area and manage location access.":"Choose an area for nearby service suggestions.";
  body=step==="privacy"?<><Callout title="Default area" message={account.area??"Not selected"}/><SettingsRow title="Change default area" description="Find nearby services without saving a home address." onPress={()=>onGo("area")}/></>:<><Callout title="Current area" message={account.area??"Not selected"}/><Input label="Location" placeholder="e.g. Ikeja" value={area} onChangeText={setArea} maxLength={120} editable={!busy}/><AppText variant="body" color={Colors.textSecondary}>This default area is saved on this device. Add the precise appointment address separately for each job.</AppText></>;
  if(step==="area")footer=<><Button title="Use this location" loading={busy} disabled={!!areaError(area)} onPress={()=>void onSaveArea(area)}/>{cancel}</>;
 }else if(step==="preferences"){
  title="Notifications";subtitle="Choose the push notifications you receive.";
  body=<><Callout title="Preferences unavailable" message="Your notification settings could not be loaded. Account security and essential in-app updates stay accessible."/><View>{(mode==="provider"?providerPreferences:customerPreferences).map(p=><SettingsRow key={p.key} title={p.label} description={p.description} onPress={()=>onUnavailable("Notification preferences")}/>)}</View></>;
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
 }else{
  title=step==="delete"?"Delete your account":"Deactivate provider profile";subtitle=step==="delete"?"Understand what happens before you continue.":"Pause providing services while keeping your account.";
  body=<Callout title={step==="delete"?"Deletion requires ownership verification":"Existing activity stays accessible"} message={step==="delete"?"A verified deletion request starts a 30-day notice and signs you out. Final deletion also requires settlement of open activity.":"Deactivation hides new public discovery. Existing jobs, messages, repayments and earnings stay with your account."}/>;
  footer=<>{unavailable(step==="delete"?"Continue to account verification":"Continue to deactivation")}{cancel}</>;
 }
 return <AccountFrame preview={preview} onBack={onBack} gap={gap} footer={footer&&<View style={{gap:8}}>{footer}</View>}><Heading title={title} subtitle={subtitle}/>{body}{error&&<Callout tone="error" message={error}/>}</AccountFrame>;
}

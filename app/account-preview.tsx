import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { SelectionChip } from "@/components/SelectionChip";
import { Sheet } from "@/components/discovery/Parts";
import { AccountScreen, accountDraft, AccountDraft, accountSteps, AccountStep } from "@/components/account/AccountScreens";
import { LifecycleScreen } from "@/components/account/LifecycleScreens";
import { RecordsScreen, RecordsStep } from "@/components/account/RecordsScreens";
import { AccountCommand, accountName, ContactChallenge, ContactProof, emailAddress, SampleAccount } from "@/lib/account/model";
import { commandSampleAccount, resetSampleAccount, useSampleAccount } from "@/lib/preview/accountStore";
import { useSampleInspection } from "@/lib/preview/inspectionStore";
import { sectionFor } from "@/lib/bookings/model";
import { normalizedPhone } from "@/lib/onboarding/model";
import { AppMode } from "@/lib/appMode";
import { useToast } from "@/lib/toast";
import Colors from "@/constants/colors";
const scenarios=["Sample","Loading","Error","Save failure","Invalid code","Expired code","Contact conflict","Upload failure"] as const;
type Scenario=typeof scenarios[number];
const lifecycle:AccountStep[]=["delete","delete-activity","delete-confirm","delete-requested","deactivate","deactivate-confirm","deactivated"];
const records:RecordsStep[]=["payments","payment-history","add-card","reviews"];
const commandId=()=>"sample-account-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);
export default function AccountPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <AccountPreview/>;}
function AccountPreview(){
 const router=useRouter(),toast=useToast(),params=useLocalSearchParams<{step?:string;mode?:string}>();const mode:AppMode=params.mode==="provider"?"provider":"customer";
 const {record:r,error:loadError,refresh}=useSampleAccount(),{record:booking}=useSampleInspection();
 const requested=accountSteps.includes(params.step as AccountStep)?params.step as AccountStep:"details";
 const [step,setStep]=useState<AccountStep>(requested),[draft,setDraft]=useState<AccountDraft>(),[states,setStates]=useState(false),[scenario,setScenario]=useState<Scenario>("Sample"),[busy,setBusy]=useState(false),[error,setError]=useState<string>(),[code,setCode]=useState(""),[codeError,setCodeError]=useState<string>(),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now()),[idReady,setIdReady]=useState(false),[overlay,setOverlay]=useState<"updated"|"name-submitted"|"recovery"|"location"|"unavailable">(),[unavailable,setUnavailable]=useState("");
 const alive=useRef(true),locked=useRef(false),intent=useRef<{key:string;type:AccountCommand["type"]}|undefined>(undefined),deleteProof=useRef<ContactProof|undefined>(undefined);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(r)setDraft(v=>v??accountDraft(r));},[r]);
 useEffect(()=>{setStep(requested);setCode("");setCodeError(undefined);deleteProof.current=undefined;},[requested]);
 useEffect(()=>{if(retryAt<=Date.now())return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[retryAt]);
 const go=(next:AccountStep)=>{if(locked.current)return;setError(undefined);setCodeError(undefined);setCode("");intent.current=undefined;if(next==="details"){deleteProof.current=undefined;setIdReady(false);if(r)setDraft(accountDraft(r));}setStep(next);};
 const run=async(c:AccountCommand,after?:(saved:SampleAccount)=>void)=>{
  if(!r||locked.current)return;locked.current=true;setBusy(true);setError(undefined);
  if(intent.current?.type!==c.type)intent.current={type:c.type,key:commandId()};
  try{if(scenario==="Save failure"||scenario==="Error")throw new Error("Sample save failure. Your entries are kept; choose Sample in States to retry.");const saved=await commandSampleAccount(r.revision,intent.current!.key,c);intent.current=undefined;if(alive.current)after?.(saved);}
  catch(e){if(alive.current){const message=e instanceof Error?e.message:"Couldn’t save your account.";setError(message);toast.error(message);}}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 };
 const startChallenge=async(purpose:ContactChallenge["purpose"],target:string,next:AccountStep)=>{
  if(!r)return;const challenge:ContactChallenge={id:commandId(),accountId:r.id,purpose,target,expiresAt:new Date(Date.now()+300000).toISOString(),...(purpose==="new_phone"?{currentPhoneProof:r.currentPhoneProof}:{})};
  await run({type:"begin_contact",challenge,now:new Date().toISOString()},()=>{setCode("");setCodeError(undefined);setRetryAt(Date.now()+30000);setNow(Date.now());setStep(next);toast.info("Sample code: 123456. No SMS or email is sent.");});
 };
 const open=(target:string)=>{
  if(target==="bookings")router.push({pathname:"/booking-preview",params:{mode}});
  else if(target==="customer-home")router.replace({pathname:"/app-preview",params:{mode:"customer"}});
  else if(target==="sign-in")router.replace("/sign-in");
  else if(target==="support")router.push({pathname:"/support-preview",params:{mode}});
  else if(target==="sample-location")setOverlay("location");
  else {setUnavailable(target==="terms"?"Terms of use":target==="privacy-policy"?"Privacy policy":target==="deletion-support"?"Deletion support":target==="feedback"?"Feedback":"Support");setOverlay("unavailable");}
 };
 const next=async()=>{
  if(!r||!draft)return;
  if(step==="area")await run({type:"area",value:draft.area,provider:mode==="provider"},saved=>{setDraft(accountDraft(saved));setStep(mode==="provider"?"details":"privacy");setOverlay("updated");});
  else if(step==="provider-profile")await run({type:"profile",...draft.profile},saved=>{setDraft(accountDraft(saved));setOverlay("updated");});
  else if(step==="profile-details"||step==="name"){
   if(draft.firstName.trim()+" "+draft.lastName.trim()!==accountName(r))setStep("name-id");
   else if(step==="profile-details")await run({type:"profile",...draft.profile},()=>setOverlay("updated"));
   else {setError("Enter a different full name to request an ID review.");}
  }else if(step==="name-id")await run({type:"name_review",firstName:draft.firstName,lastName:draft.lastName,privateDocumentReference:idReady?"sample-private-id-"+r.id:""},()=>setOverlay("name-submitted"));
  else if(step==="new-phone"){const target=normalizedPhone(draft.phone);if(target)await startChallenge("new_phone",target,"new-phone-code");}
  else if(step==="email"){const target=emailAddress(draft.email);if(target)await startChallenge("email",target,"email-code");}
  else if(["current-phone","new-phone-code","email-code","delete-code"].includes(step)){
   if(!r.challenge){await startChallenge("current_phone",r.phone,step);return;}
   if(scenario==="Invalid code"||code!=="123456"){setCodeError("That code doesn’t match. Please try again.");setCode("");return;}
   if(scenario==="Expired code"||Date.parse(r.challenge.expiresAt)<=Date.now()){setCodeError("This code has expired. Request a new code.");setCode("");setRetryAt(0);return;}
   const proof:ContactProof={...r.challenge,reference:"sample-proof-"+r.challenge.id,status:"verified"};
   if(step==="delete-code"){deleteProof.current=proof;setCode("");setStep("delete-confirm");}
   else await run({type:"verify_contact",proof,now:new Date().toISOString(),conflict:scenario==="Contact conflict"&&step!=="current-phone"},saved=>{setCode("");setCodeError(undefined);if(step==="current-phone")setStep("new-phone");else{setDraft(accountDraft(saved));setStep("details");setOverlay("updated");}});
  }else if(step==="verification")router.push({pathname:"/auth-preview",params:{step:"verification-documents"}});
  else if(step==="deactivate")setStep("deactivate-confirm");
  else if(step==="deactivate-confirm")await run({type:"deactivate",confirmed:true},()=>setStep("deactivated"));
  else if(step==="deactivated")await run({type:"request_reactivation"},()=>toast.info("Sample reactivation is under review. The profile stays hidden."));
  else if(step==="delete"){
   const openActivity=booking&&(sectionFor(booking)==="active"||sectionFor(booking)==="pending"||(booking.repayment?.outstanding??0)>0||booking.refund&&booking.refund.status!=="paid"||booking.finance?.payouts.some(v=>v.status==="pending"));
   if(openActivity)setStep("delete-activity");else await startChallenge("current_phone",r.phone,"delete-code");
  }else if(step==="delete-activity")await startChallenge("current_phone",r.phone,"delete-code");
  else if(step==="delete-confirm"){
   if(!deleteProof.current){setError("Verify the current phone again before requesting deletion.");return;}
   await run({type:"delete_notice",proof:deleteProof.current,now:new Date().toISOString(),confirmed:true},()=>{deleteProof.current=undefined;setStep("delete-requested");});
  }
 };
 const choose=(value:AccountStep)=>{
  if(!r)return;
  if(value==="current-phone"){void startChallenge("current_phone",r.phone,value);return;}
  if(value==="details"&&r.challenge){void run({type:"cancel_contact"},saved=>{setStep(value);setDraft(accountDraft(saved));setCode("");deleteProof.current=undefined;});return;}
  go(value);
 };

 const onPhoto=(kind:"banner"|"avatar"|"gallery")=>{if(busy||!draft)return;if(scenario==="Upload failure"){setError("Sample photo upload failed. Your changes are kept.");toast.error("Upload failed. Please try again.");return;}setDraft({...draft,profile:{...draft.profile,...(kind==="gallery"?{photos:[...draft.profile.photos,"sample-photo-sink"].slice(0,8)}:{[kind]:true})}});toast.info("Sample photo selected. No real file is uploaded.");};
 const activeStep=r?.deletion?"delete-requested":step;
 return <View style={{flex:1,backgroundColor:Colors.surface}}><View style={{minHeight:44,paddingLeft:12,paddingRight:4,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} numberOfLines={1} style={{flex:1,minWidth:0}}>Local account preview · {mode} · {scenario}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Account preview states" onPress={()=>setStates(true)} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><AppText variant="caption" color={Colors.primary}>States</AppText></Pressable></View>
  {!r||!draft||loadError||scenario==="Loading"||scenario==="Error"?<View style={{padding:24,gap:16}}>{loadError||scenario==="Error"?<><Callout title="Couldn’t load your account" message={loadError??"Sample load failure. Your saved account is kept."}/><Button title="Try again" onPress={()=>{setScenario("Sample");void refresh();}}/></>:<LogoLoader label="Loading your account"/>}</View>:!r.signedIn&&!r.deletion?<View style={{padding:24,gap:16}}><Callout title="Sample account signed out" message="Your saved sample account, bookings and messages are kept."/><Button title="Resume local sample" onPress={()=>void run({type:"sample_sign_in"})}/></View>:records.includes(activeStep as RecordsStep)?<RecordsScreen step={activeStep as RecordsStep} r={booking} saveFailure={scenario==="Save failure"} onBack={()=>{if(activeStep==="payment-history"||activeStep==="add-card")go("payments");else router.replace({pathname:"/app-preview",params:{mode,tab:"account"}});}} onGo={go} onBooking={()=>router.push({pathname:"/booking-preview",params:{mode:"customer",section:"completed"}})} onReview={()=>router.push({pathname:"/booking-preview",params:{mode:"customer",step:"review"}})} onGateway={()=>{setUnavailable("Secure card authorization");setOverlay("unavailable");}}/>:lifecycle.includes(activeStep)?<LifecycleScreen step={activeStep} r={r} busy={busy} error={error} onBack={()=>router.replace({pathname:"/app-preview",params:{mode,tab:"account"}})} onGo={choose} onNext={()=>void next()} onOpen={open}/>:<AccountScreen step={activeStep} mode={mode} r={r} draft={draft} busy={busy} error={error} code={code} codeError={codeError} resendSeconds={Math.max(0,Math.ceil((retryAt-now)/1000))} privateIdReady={idReady} onDraft={patch=>{if(!busy){setDraft({...draft,...patch});setError(undefined);intent.current=undefined;}}} onCode={value=>{setCode(value);setCodeError(undefined);}} onBack={()=>router.replace({pathname:"/app-preview",params:{mode,tab:"account"}})} onGo={choose} onNext={()=>void next()} onResend={()=>{if(r.challenge)void startChallenge(r.challenge.purpose,r.challenge.target,activeStep);else void startChallenge("current_phone",r.phone,activeStep);}} onRecover={()=>setOverlay("recovery")} onUploadId={()=>{if(scenario==="Upload failure"){setError("Sample private upload failed. No document was uploaded.");return;}setIdReady(true);toast.info("Sample private ID reference selected. No document is uploaded.");}} onPhoto={onPhoto} onPreference={(key,value)=>void run({type:"preference",mode,key,value},()=>toast.success("Changes saved."))} onOpen={open}/>}
  {states&&<Sheet title="Account preview" showClose onClose={()=>setStates(false)}><Callout message="One fictional identity supports both modes. Codes, uploads, reviews and lifecycle outcomes are local samples; no real account or external service is changed."/><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{scenarios.map(v=><SelectionChip key={v} label={v} selected={scenario===v} onPress={()=>{setScenario(v);setStates(false);}}/>)}</View><Button title="Reset sample account" variant="outline" disabled={busy} onPress={()=>{void resetSampleAccount().then(saved=>{if(alive.current){setDraft(accountDraft(saved));setStep("details");setError(undefined);setCode("");deleteProof.current=undefined;setStates(false);}}).catch(e=>setError(e.message));}}/>{r?.providerStatus==="review"&&<Button title="Simulate approved reactivation" variant="outline" onPress={()=>void run({type:"reactivation_result",identityReference:r.identityReference,approved:true},()=>{setStep("details");setStates(false);})}/>}<Button title="Retained booking settlement preview" variant="outline" onPress={()=>{setStates(false);router.push({pathname:"/booking-preview",params:{mode:"provider",step:"detail"}});}}/></Sheet>}
  {overlay&&<Sheet title={overlay==="updated"?"Account updated":overlay==="name-submitted"?"Name change submitted":overlay==="recovery"?"Can’t access your phone?":overlay==="location"?"Sample location":unavailable} description={overlay==="updated"?"Your changes are saved for both roles. Return to your account to review the updated details.":overlay==="name-submitted"?"We’ll review your ID and let you know when there’s an update.":overlay==="recovery"?"Recover access to your account before changing your sign-in or recovery details.":undefined} showHandle={false} topPadding={24} bodyPadding={16} bodyGap={16} onClose={()=>setOverlay(undefined)}>
   {overlay==="name-submitted"&&<><Callout title="Requested name" message={r?.nameReview?r.nameReview.firstName+" "+r.nameReview.lastName:draft?draft.firstName+" "+draft.lastName:""}/><AppText variant="body" color={Colors.textSecondary}>Your account will continue to show {r?.approvedName} while we review your request.</AppText></>}
   {overlay==="recovery"&&<><Callout title="Ways to recover access" message="Use your verified recovery email or follow the identity verification steps."/><Button title="Recover account" onPress={()=>router.push({pathname:"/recovery-preview",params:{mode,entry:"start"}})}/></>}
   {overlay==="location"&&<><Callout message="The local preview can use a fictional Ikeja area without requesting device location."/><Button title="Use sample Ikeja area" onPress={()=>{if(draft)setDraft({...draft,area:"Ikeja, Lagos"});setOverlay(undefined);}}/></>}
   {overlay==="unavailable"&&<Callout title="Backend connection required" message={unavailable==="Secure card authorization"?"The payment provider connection and saved-card authorization contract are not available. No card credentials are collected or saved locally.":unavailable==="Terms of use"||unavailable==="Privacy policy"?"The published legal document is not included in this design. We’ll connect the approved document when its URL and version are confirmed.":"This destination needs the verified support service. Your local account and pending activity are kept. Booking-specific reports are available from the booking preview."}/>}
   <Button title={overlay==="name-submitted"?"Back to your account":overlay==="recovery"?"Back to account":"Done"} variant={overlay==="recovery"?"outline":"primary"} onPress={()=>{setOverlay(undefined);if(overlay==="name-submitted"||overlay==="recovery")choose("details");}}/>
  </Sheet>}
 </View>;
}

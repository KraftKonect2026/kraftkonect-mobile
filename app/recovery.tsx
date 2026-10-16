import { useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { RecoveryFields, RecoveryScreen } from "@/components/account/RecoveryScreens";
import { RecoverySession, RecoveryStep } from "@/lib/account/recovery";
import { answerActivity, askSupport, backStep, checkIdentity, completeRecovery, IdentityCheck, Question, requestNewPhoneCode, startActivity, startEmailRecovery, startIdentity, verifyEmailCode } from "@/lib/account/liveRecovery";
import { normalizedPhone } from "@/lib/onboarding/model";
import { useToast } from "@/lib/toast";

/**
 * Public recovery entry. The server decides whether the person owns the account and swaps the number;
 * this screen only collects the details and shows each step's result.
 */
export default function RecoveryRoute(){
 const router=useRouter(),client=useApolloClient(),toast=useToast();
 const [step,setStep]=useState<RecoveryStep>("choose"),[method,setMethod]=useState<"email"|"identity">("email");
 const [fields,setFields]=useState<RecoveryFields>({email:"",name:"",oldPhone:"",newPhone:"",code:"",answers:{}});
 const [sessionId,setSessionId]=useState<string>(),[questions,setQuestions]=useState<Question[]>([]),[role,setRole]=useState<"customer"|"provider">("customer");
 const [busy,setBusy]=useState(false),[error,setError]=useState<string>(),[resendAt,setResendAt]=useState(0),[now,setNow]=useState(Date.now()),[newPhone,setNewPhone]=useState<string>();
 const [identity,setIdentity]=useState<IdentityCheck>(),[reference,setReference]=useState<string>();
 const alive=useRef(true),stepRef=useRef<RecoveryStep>("choose");
 stepRef.current=step;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(resendAt<=Date.now())return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[resendAt]);
 const resendSeconds=Math.max(0,Math.ceil((resendAt-now)/1000));
 const patch=(p:Partial<RecoveryFields>)=>{setFields(f=>({...f,...p}));setError(undefined);};
 const go=(next:RecoveryStep)=>{setError(undefined);setStep(next);};
 const signIn=()=>router.replace("/sign-in");
 /** Run one server step, showing its own sentence if it is refused. */
 const attempt=async(work:()=>Promise<void>)=>{
  if(busy)return;setBusy(true);setError(undefined);
  try{await work();}catch(e){if(alive.current)setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}
  finally{if(alive.current)setBusy(false);}
 };
 const sendEmailCode=()=>attempt(async()=>{const id=await startEmailRecovery(client,fields.email,fields.name);setSessionId(id);patch({code:""});setResendAt(Date.now()+60_000);setNow(Date.now());go("email-code");});
 const sendPhoneCode=()=>attempt(async()=>{
  if(!sessionId)throw new Error("Start again from the beginning.");
  const phone=normalizedPhone(fields.newPhone);if(!phone)throw new Error("Enter a valid Nigerian mobile number.");
  await requestNewPhoneCode(client,sessionId,phone);setNewPhone(phone);patch({code:""});setResendAt(Date.now()+60_000);setNow(Date.now());go("phone-code");
 });
 const contactSupport=async()=>{
  go("support");
  const contact=fields.email.trim()||fields.oldPhone.trim();
  if(!fields.name.trim()||!contact)return;
  try{const ref=await askSupport(client,fields.name,contact,"Account recovery help requested from the app. Method tried: "+(method==="email"?"recovery email":"account history")+".");if(alive.current)toast.info("Support has your request. Reference "+ref+".");}catch{/* the email address on screen still works */}
 };
 const onNext=()=>{
  if(step==="choose")return go(method==="email"?"email":"identity");
  if(step==="email")return void sendEmailCode();
  if(step==="email-code")return void attempt(async()=>{if(!sessionId)throw new Error("Start again from the beginning.");await verifyEmailCode(client,sessionId,fields.code);patch({code:""});go("phone");});
  if(step==="identity")return void attempt(async()=>{
   const phone=normalizedPhone(fields.oldPhone);if(!phone)throw new Error("Enter a valid Nigerian mobile number.");
   // A provider who passed identity verification can match a new check against it; everyone else answers questions about their history.
   const check=await startIdentity(client,phone,fields.name);
   if(check){setIdentity(check);setSessionId(check.sessionId);setQuestions([]);go("options");return;}
   setIdentity(undefined);
   const found=await startActivity(client,phone,fields.name);
   if(!found){go("support");void contactSupport();return;}
   setSessionId(found.sessionId);setQuestions(found.questions);patch({answers:{}});go("options");
  });
  if(step==="options"&&identity)return void attempt(async()=>{await launchIdentity(identity);});
  if(step==="activity")return void attempt(async()=>{if(!sessionId)throw new Error("Start again from the beginning.");const result=await answerActivity(client,sessionId,fields.answers);go(result);});
  if(step==="phone")return void sendPhoneCode();
  if(step==="phone-code")return void attempt(async()=>{if(!sessionId)throw new Error("Start again from the beginning.");const done=await completeRecovery(client,sessionId,fields.code);setRole(done.role);setNewPhone(done.newPhone);patch({code:""});go("recovered");});
 };
 /** Ask the server how the check went; it alone decides whether the number can be replaced. */
 const verifyIdentity=async(quiet=false)=>{
  if(!identity)return;
  try{
   const result=await checkIdentity(client,identity.sessionId);
   if(!alive.current)return;
   if(result.reference)setReference(result.reference);
   if(result.step==="phone"){setSessionId(identity.sessionId);patch({code:""});go("phone");}
   else if(result.step==="failed")go("failed");
   else{go("pending");if(!quiet)toast.info("Still being checked. Try again in a moment.");}
  }catch(e){if(alive.current&&!quiet)setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}
 };
 const pollIdentity=async(attempt=0)=>{
  await verifyIdentity(true);
  if(!alive.current)return;
  // Stop as soon as the answer is no longer "pending" (the screen has moved on).
  if(attempt<7)setTimeout(()=>{if(alive.current&&stepRef.current==="pending")void pollIdentity(attempt+1);},2500);
 };
 const launchIdentity=async(check:IdentityCheck)=>{
  go("pending");
  const web=async()=>{await WebBrowser.openBrowserAsync(check.inquiryUrl);if(alive.current)void pollIdentity();};
  if(Platform.OS==="web"){await web();return;}
  try{
   const {Inquiry}=await import("react-native-persona");
   Inquiry.fromInquiry(check.inquiryId).sessionToken(check.clientToken||"")
    .onComplete(()=>{if(alive.current){toast.info("Verification submitted. Checking status.");void pollIdentity();}})
    .onCanceled(()=>{if(alive.current)go("options");})
    .onError(()=>{if(alive.current)void web().catch(()=>{go("options");setError("Could not open verification. Please try again.");});})
    .build().start();
  }catch{await web();}
 };
 const onBack=()=>{if(busy)return;if(step==="choose")return signIn();const previous=backStep(step);if(previous){if(previous==="choose"||previous==="identity"){setSessionId(undefined);setQuestions([]);}go(previous);}};
 const session={source:"sample",id:sessionId??"",accountId:"",oldPhone:"",mode:role,step,method,newPhone,activity:step==="activity"&&sessionId?{id:sessionId,sessionId,accountId:"",expiresAt:"",questions}:undefined} as unknown as RecoverySession;
 return <RecoveryScreen session={session} step={step} method={method} onMethod={setMethod} fields={fields} onFields={patch} onNext={onNext} onBack={onBack}
  onActivity={()=>void (questions.length?Promise.resolve(go("activity")):attempt(async()=>{const phone=normalizedPhone(fields.oldPhone);if(!phone)throw new Error("Enter a valid Nigerian mobile number.");const found=await startActivity(client,phone,fields.name);if(!found){go("support");void contactSupport();return;}setSessionId(found.sessionId);setQuestions(found.questions);patch({answers:{}});go("activity");}))} onCapture={()=>undefined} onSupport={()=>void contactSupport()} onSignIn={signIn} onHome={signIn}
  onResend={()=>void (step==="email-code"?sendEmailCode():sendPhoneCode())} resendSeconds={resendSeconds} busy={busy} error={error}
  hasPreviousIdentity={!!identity} onCheck={step==="pending"&&identity?()=>void verifyIdentity():undefined} reference={reference} onEmailSupport={()=>void Linking.openURL("mailto:support@kraftkonect.com?subject=Account%20recovery")}/>;
}

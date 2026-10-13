import { useEffect, useRef, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Frame, Sheet, Status } from "@/components/discovery/Parts";
import { SelectionChip } from "@/components/SelectionChip";
import { RecoveryFields, RecoveryScreen } from "@/components/account/RecoveryScreens";
import { ActivityChallenge, RecoveryChallenge, RecoveryCommand, RecoveryGrant } from "@/lib/account/recovery";
import { commandSampleAccount, readSampleAccount, resetSampleAccount, recoveryDraftKey, saveRecoveryDraft, useSampleAccount } from "@/lib/preview/accountStore";
import { normalizedPhone } from "@/lib/onboarding/model";
import { secureStorage } from "@/lib/storage";
import Colors from "@/constants/colors";

const draftKey=recoveryDraftKey;
const emptyFields:RecoveryFields={email:"",name:"",oldPhone:"",newPhone:"",code:"",answers:{}};
const scenarios=["Sample","Save failure","Upload failure","Invalid code","Expired code","Phone conflict","Activity failed","No history","Identity unavailable"];
export default function RecoveryPreviewRoute(){if(!__DEV__)return <Redirect href="/"/>;return <RecoveryPreview/>;}
function RecoveryPreview(){
 const router=useRouter(),params=useLocalSearchParams<{mode?:string;entry?:string}>(),mode=params.mode==="provider"?"provider":"customer";
 const {record,error:loadError,refresh}=useSampleAccount(),session=record?.recovery;
 const [newAttempt,setNewAttempt]=useState(false),step=newAttempt&&session?.step==="recovered"?"choose":session?.step??"choose";
 const [fields,setFields]=useState<RecoveryFields>(emptyFields),[method,setMethod]=useState<"email"|"identity">("email"),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string>(),[scenario,setScenario]=useState("Sample"),[dialog,setDialog]=useState<"states"|"support"|undefined>(),[retryAt,setRetryAt]=useState(0),[tick,setTick]=useState(Date.now());
 const alive=useRef(true),lock=useRef(false),entryConsumed=useRef(false),intent=useRef<{signature:string;key:string}|undefined>(undefined);
 useEffect(()=>{if(!record||entryConsumed.current||params.entry!=="start")return;entryConsumed.current=true;if(record.recovery?.step==="recovered")setNewAttempt(true);router.setParams({entry:undefined});},[record,params.entry,router]);
 useEffect(()=>{alive.current=true;secureStorage.getItem(draftKey).then(raw=>{if(!alive.current)return;try{const d=JSON.parse(raw??"{}");setFields(f=>({...f,...Object.fromEntries(["email","name","oldPhone","newPhone"].flatMap(k=>typeof d[k]==="string"?[[k,d[k].slice(0,k==="email"?254:k==="name"?100:20)]]:[]))}));}catch{}setReady(true);}).catch(()=>{if(alive.current){setReady(true);setError("Couldn’t restore the sample recovery draft.");}});return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(ready)void saveRecoveryDraft({email:fields.email,name:fields.name,oldPhone:fields.oldPhone,newPhone:fields.newPhone}).catch(()=>{if(alive.current)setError("Couldn’t save this local draft. Keep the screen open and retry.");});},[ready,fields.email,fields.name,fields.oldPhone,fields.newPhone]);
 useEffect(()=>{setFields(f=>({...f,code:"",answers:{}}));setError(undefined);},[session?.id,session?.challenge?.id,session?.activity?.id]);
 useEffect(()=>{if(!retryAt)return;const timer=setInterval(()=>{const now=Date.now();setTick(now);if(now>=retryAt)clearInterval(timer);},1000);return()=>clearInterval(timer);},[retryAt]);
 const run=async(command:RecoveryCommand)=>{
  if(!record||lock.current)return;const signature=JSON.stringify(command);if(intent.current?.signature!==signature)intent.current={signature,key:"sample-recovery-command-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)};lock.current=true;setBusy(true);setError(undefined);
  try{if(scenario==="Save failure")throw new Error("Sample save failed. Your draft is kept. Choose Sample in States, then retry.");const current=await readSampleAccount();const now=scenario==="Expired code"&&["email_result","phone_result","activity_result"].includes(command.type)?new Date(Date.now()+360000).toISOString():new Date().toISOString();await commandSampleAccount(current.revision,intent.current.key,{type:"recovery",command,now});if(alive.current){intent.current=undefined;if(command.type==="begin")setNewAttempt(false);if(command.type==="email_challenge"||command.type==="phone_challenge"){setRetryAt(Date.now()+30000);setTick(Date.now());}if(command.type==="phone_result")await saveRecoveryDraft();}}
  catch(e){if(alive.current)setError(e instanceof Error?e.message:"Couldn’t save recovery. Your draft is kept.");}finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 const makeChallenge=(purpose:"email"|"phone",target:string):RecoveryChallenge=>({id:"sample-recovery-code-"+Date.now(),sessionId:session!.id,accountId:record!.id,purpose,target,expiresAt:new Date(Date.now()+300000).toISOString()});
 const grant=(method:RecoveryGrant["method"]):RecoveryGrant=>({reference:"sample-ownership-"+Date.now(),sessionId:session!.id,accountId:record!.id,oldPhone:session!.oldPhone,method,expiresAt:new Date(Date.now()+900000).toISOString()});
 const next=()=>{
  if(!record||busy)return;
  if(step==="choose")void run({type:"begin",sessionId:"sample-recovery-"+Date.now(),method,mode});
  else if(step==="email")void run({type:"email_challenge",email:fields.email,name:fields.name,challenge:makeChallenge("email",fields.email.trim().toLowerCase())});
  else if(step==="identity")void run({type:"find_identity",phone:fields.oldPhone,name:fields.name});
  else if(step==="options")void run({type:"open_capture"});
  else if(step==="capture")void run({type:"submit_review",reviewId:"sample-recovery-review-"+Date.now()});
  else if(step==="email-code"||step==="phone-code"){
   if(fields.code!=="123456"||scenario==="Invalid code"){setError("The sample code is invalid. Use 123456 in this development preview.");return;}
   if(step==="email-code")void run({type:"email_result",challengeId:session!.challenge!.id,reference:"sample-email-proof-"+Date.now(),grant:grant("email")});
   else void run({type:"phone_result",challengeId:session!.challenge!.id,reference:"sample-phone-proof-"+Date.now(),conflict:scenario==="Phone conflict"});
  }else if(step==="phone"){const target=normalizedPhone(fields.newPhone);if(target)void run({type:"phone_challenge",challenge:makeChallenge("phone",target)});}
  else if(step==="activity")void run({type:"activity_result",challengeId:session!.activity!.id,answers:Object.entries(fields.answers).map(([questionId,optionId])=>({questionId,optionId})),reference:"sample-activity-result-"+Date.now(),correctCount:scenario==="Activity failed"?2:3,grant:scenario==="Activity failed"?undefined:grant("activity")});
 };
 const activity=()=>{
  if(!session)return;const challenge:ActivityChallenge={id:"sample-activity-"+Date.now(),sessionId:session.id,accountId:record!.id,expiresAt:new Date(Date.now()+300000).toISOString(),questions:["Most recent service","Participant recently messaged","Area of your recent request","Latest payment record"].map((label,index)=>({id:"sample-question-"+(index+1),label,options:["Fixture A","Fixture B","Fixture C"].map((label,i)=>({id:"sample-option-"+i,label}))}))};
  void run({type:"activity_challenge",historyAvailable:scenario!=="No history",challenge:scenario==="No history"?undefined:challenge});
 };
 const signIn=()=>router.replace({pathname:"/auth-preview",params:{step:"sign-in"}});
 const back=()=>{if(busy)return;if(["choose","pending","failed","support","recovered"].includes(step)){if(step==="recovered")router.replace({pathname:"/app-preview",params:{mode:session?.mode??mode}});else signIn();}else void run({type:"back"});};
 const previewBar=<View style={{minHeight:44,paddingLeft:16,paddingRight:8,flexDirection:"row",alignItems:"center",gap:8,backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary} style={{flex:1}}>LOCAL RECOVERY · Fictional account · Code 123456 · No SMS, email or private upload</AppText><Button title="States" size="compact" variant="subtle" disabled={busy} onPress={()=>setDialog("states")}/></View>;
 return <View style={{flex:1,backgroundColor:Colors.surface,width:"100%",maxWidth:600,alignSelf:"center"}}>{!record||!ready||loadError?<Frame>{previewBar}<Status loading={!loadError} error={!!loadError} empty="" onRetry={()=>void refresh()}/></Frame>:record.deletion?<Frame>{previewBar}<Callout title="Deletion notice in progress" message="Recovery does not undo a deletion notice or settle retained activity. Contact support for the authorized path."/><Button title="Contact recovery support" onPress={()=>setDialog("support")}/></Frame>:<RecoveryScreen session={session} step={step} method={method} onMethod={v=>{setMethod(v);if(session&&!newAttempt)void run({type:"method",method:v});}} fields={fields} onFields={p=>setFields(f=>({...f,...p}))} busy={busy} error={error} previewBar={previewBar} onNext={next} onBack={back} hasPreviousIdentity={!!record.identityReference&&scenario!=="Identity unavailable"} onActivity={activity} onCapture={kind=>{if(scenario==="Upload failure"){setError("Sample private capture failed. No file was uploaded.");return;}void run({type:"capture",kind,reference:"sample-private-"+kind+"-"+Date.now()});}} onSupport={()=>void run({type:"support"})} onSignIn={signIn} onHome={()=>router.replace({pathname:"/app-preview",params:{mode:session?.mode??mode}})} onResend={()=>{setFields(f=>({...f,code:""}));if(step==="email-code")void run({type:"email_challenge",email:fields.email,name:fields.name,challenge:makeChallenge("email",session!.challenge!.target)});else if(step==="phone-code")void run({type:"phone_challenge",challenge:makeChallenge("phone",session!.newPhone!)});}} resendSeconds={Math.max(0,Math.ceil((retryAt-tick)/1000))} onEmailSupport={()=>setDialog("support")}/>}
 {dialog==="states"&&<Sheet title="Local recovery states" showClose onClose={()=>setDialog(undefined)}><Callout message="All captures, activity options and verification outcomes are fictional. The local activity result simulates a server response; the client does not score answers or use Figma’s sample answers."/>{scenarios.map(s=><SelectionChip key={s} label={s} selected={scenario===s} onPress={()=>{setScenario(s);setDialog(undefined);setError(undefined);}}/>)}{session?.step==="pending"&&<><Button title="Simulate matched review approval" onPress={()=>{setDialog(undefined);void run({type:"review_result",reviewId:session.review!.id,identityReference:session.review!.identityReference,approved:true,grant:grant("identity")});}}/><Button title="Simulate rejected identity review" variant="outline" onPress={()=>{setDialog(undefined);void run({type:"review_result",reviewId:session.review!.id,identityReference:session.review!.identityReference,approved:false});}}/></>}{session?.step==="recovered"&&<Button title="Start another fictional recovery" variant="outline" onPress={()=>{setNewAttempt(true);setFields(emptyFields);setDialog(undefined);}}/>}<Button title="Reset fictional account and recovery" variant="outline" disabled={busy} onPress={()=>{void resetSampleAccount().then(async()=>{await saveRecoveryDraft();if(alive.current){setFields(emptyFields);setNewAttempt(false);setScenario("Sample");setRetryAt(0);setDialog(undefined);}}).catch(e=>setError(e.message));}}/></Sheet>}
 {dialog==="support"&&<Sheet title="Recovery support" showClose onClose={()=>setDialog(undefined)}><AppText variant="body">support@kraftkonect.com</AppText><Callout message="This local preview does not send an email or open a private support case. The live recovery service must verify ownership and provide the authorized support channel."/><Button title="Done" onPress={()=>setDialog(undefined)}/></Sheet>}
 </View>;
}

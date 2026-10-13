import type { SampleAccount } from "./model";
import { normalizedPhone, validName } from "@/lib/onboarding/model";
export type RecoveryStep="choose"|"email"|"email-code"|"identity"|"options"|"capture"|"pending"|"activity"|"failed"|"support"|"phone"|"phone-code"|"recovered";
export type RecoveryChallenge={id:string;sessionId:string;accountId:string;purpose:"email"|"phone";target:string;expiresAt:string};
export type RecoveryGrant={reference:string;sessionId:string;accountId:string;oldPhone:string;method:"email"|"identity"|"activity";expiresAt:string};
export type ActivityQuestion={id:string;label:string;options:{id:string;label:string}[]};
export type ActivityChallenge={id:string;sessionId:string;accountId:string;expiresAt:string;questions:ActivityQuestion[]};
export type RecoverySession={source:"sample";id:string;accountId:string;oldPhone:string;mode:"customer"|"provider";step:RecoveryStep;method:"email"|"identity";challenge?:RecoveryChallenge;grant?:RecoveryGrant;privateCapture?:{id?:string;selfie?:string};review?:{id:string;identityReference:string;status:"pending"|"approved"|"rejected"};activity?:ActivityChallenge;newPhone?:string;completionReference?:string};
export type RecoveryCommand=
 |{type:"begin";sessionId:string;method:"email"|"identity";mode:"customer"|"provider"}
 |{type:"method";method:"email"|"identity"}
 |{type:"email_challenge";email:string;name:string;challenge:RecoveryChallenge}
 |{type:"email_result";challengeId:string;reference:string;grant:RecoveryGrant}
 |{type:"find_identity";phone:string;name:string}
 |{type:"open_capture"}
 |{type:"capture";kind:"id"|"selfie";reference:string}
 |{type:"submit_review";reviewId:string}
 |{type:"review_result";reviewId:string;identityReference:string;approved:boolean;grant?:RecoveryGrant}
 |{type:"activity_challenge";challenge?:ActivityChallenge;historyAvailable:boolean}
 |{type:"activity_result";challengeId:string;answers:{questionId:string;optionId:string}[];reference:string;correctCount:number;grant?:RecoveryGrant}
 |{type:"phone_challenge";challenge:RecoveryChallenge}
 |{type:"phone_result";challengeId:string;reference:string;conflict?:boolean}
 |{type:"support"}|{type:"back"};
type Facts=Pick<SampleAccount,"id"|"phone"|"email"|"firstName"|"lastName"|"identityReference">;
const sampleRef=(s:string)=>typeof s==="string"&&s.startsWith("sample-")&&s.length<=180;
function future(expires:string,now:string){return Number.isFinite(Date.parse(now))&&Number.isFinite(Date.parse(expires))&&Date.parse(expires)>Date.parse(now);}
function scope(f:Facts,s:RecoverySession){if(s.source!=="sample"||s.accountId!==f.id||s.oldPhone!==f.phone)throw new Error("Recovery must remain attached to the same unchanged account.");}
function grantError(f:Facts,s:RecoverySession,g:RecoveryGrant,method:RecoveryGrant["method"],now:string){if(!sampleRef(g.reference)||g.sessionId!==s.id||g.accountId!==f.id||g.oldPhone!==f.phone||g.method!==method||!future(g.expiresAt,now))throw new Error("Ownership approval does not match this recovery session or has expired.");}
function challengeError(f:Facts,s:RecoverySession,c:RecoveryChallenge,purpose:RecoveryChallenge["purpose"],now:string){if(!sampleRef(c.id)||c.sessionId!==s.id||c.accountId!==f.id||c.purpose!==purpose)throw new Error("Verification must match the current account, session and target.");if(!future(c.expiresAt,now))throw new Error("This code has expired. Request a new code.");}
function nameMatches(f:Facts,name:string){return validName(name)&&name.trim().replace(/\s+/g," ").toLocaleLowerCase()===(f.firstName+" "+f.lastName).toLocaleLowerCase();}
/** Local simulator only. Live challenge generation, attempts, scoring and identity matching belong to the server. */
export function applyRecoveryCommand(f:Facts,current:RecoverySession|undefined,c:RecoveryCommand,now:string):{session:RecoverySession;phone?:string}{
 if(c.type==="begin"){
  if(current&&!["choose","email","identity","recovered"].includes(current.step))throw new Error("The current recovery needs verification, review or support before a new attempt.");
  if(!sampleRef(c.sessionId)||!["email","identity"].includes(c.method)||!["customer","provider"].includes(c.mode))throw new Error("Choose a valid sample recovery session.");
  return {session:{source:"sample",id:c.sessionId,accountId:f.id,oldPhone:f.phone,mode:c.mode,step:c.method==="email"?"email":"identity",method:c.method}};
 }
 if(!current)throw new Error("Start an owning recovery session first.");scope(f,current);
 const s:RecoverySession=JSON.parse(JSON.stringify(current));
 if(c.type==="method"){
  if(!["choose","email","identity"].includes(s.step)||!["email","identity"].includes(c.method))throw new Error("This recovery method can no longer change.");s.method=c.method;s.step=c.method==="email"?"email":"identity";delete s.challenge;
 }else if(c.type==="email_challenge"){
  if(!["email","email-code"].includes(s.step)||!f.email||c.email.trim().toLowerCase()!==f.email||!nameMatches(f,c.name))throw new Error("Check the recovery details or choose identity verification.");
  challengeError(f,s,c.challenge,"email",now);if(c.challenge.target!==f.email)throw new Error("Use the verified recovery email already linked to this account.");s.challenge={...c.challenge};s.step="email-code";
 }else if(c.type==="email_result"){
  if(s.step!=="email-code"||!s.challenge||s.challenge.id!==c.challengeId||s.challenge.target!==f.email||!sampleRef(c.reference))throw new Error("Verify the latest recovery email challenge.");challengeError(f,s,s.challenge,"email",now);grantError(f,s,c.grant,"email",now);s.grant={...c.grant};s.step="phone";delete s.challenge;
 }else if(c.type==="find_identity"){
  if(s.step!=="identity"||normalizedPhone(c.phone)!==f.phone||!nameMatches(f,c.name))throw new Error("Check the old account details before continuing.");s.step="options";
 }else if(c.type==="open_capture"){
  if(s.step!=="options"||!f.identityReference)throw new Error("A previous identity record is required.");s.step="capture";
 }else if(c.type==="capture"){
  if(!["options","capture"].includes(s.step)||!f.identityReference||!["id","selfie"].includes(c.kind)||!sampleRef(c.reference)||!c.reference.startsWith("sample-private-"))throw new Error("Use an explicit private sample capture for the previous identity.");s.step="capture";s.privateCapture={...s.privateCapture,[c.kind]:c.reference};
 }else if(c.type==="submit_review"){
  if(s.step!=="capture"||!s.privateCapture?.id&&!s.privateCapture?.selfie||!sampleRef(c.reviewId)||!f.identityReference)throw new Error("A private capture and previous identity are required.");s.review={id:c.reviewId,identityReference:f.identityReference,status:"pending"};s.step="pending";delete s.privateCapture;delete s.grant;
 }else if(c.type==="review_result"){
  if(s.step!=="pending"||!s.review||s.review.id!==c.reviewId||c.identityReference!==s.review.identityReference||c.identityReference!==f.identityReference||typeof c.approved!=="boolean")throw new Error("The review result does not match this account's pending identity review.");
  s.review.status=c.approved?"approved":"rejected";if(c.approved){if(!c.grant)throw new Error("Matched ownership approval is required.");grantError(f,s,c.grant,"identity",now);s.grant={...c.grant};s.step="phone";}else s.step="options";
 }else if(c.type==="activity_challenge"){
  if(!["options","capture"].includes(s.step)||typeof c.historyAvailable!=="boolean")throw new Error("Activity verification is unavailable in this recovery state.");
  if(!c.historyAvailable){s.step="support";delete s.activity;delete s.privateCapture;}
  else{
   const a=c.challenge;if(!a||!sampleRef(a.id)||a.accountId!==f.id||a.sessionId!==s.id||!future(a.expiresAt,now)||a.questions.length!==4||new Set(a.questions.map(q=>q.id)).size!==4||a.questions.some(q=>!q.id||!q.label.trim()||q.options.length<2||new Set(q.options.map(o=>o.id)).size!==q.options.length||q.options.some(o=>!o.id||!o.label.trim())))throw new Error("Four valid questions must come from the owning activity challenge.");
   s.activity={id:a.id,sessionId:a.sessionId,accountId:a.accountId,expiresAt:a.expiresAt,questions:a.questions.map(q=>({id:q.id,label:q.label,options:q.options.map(o=>({id:o.id,label:o.label}))}))};s.step="activity";delete s.privateCapture;
  }
 }else if(c.type==="activity_result"){
  const a=s.activity;if(s.step!=="activity"||!a||a.id!==c.challengeId||!future(a.expiresAt,now)||!sampleRef(c.reference)||c.answers.length!==4||new Set(c.answers.map(v=>v.questionId)).size!==4||c.answers.some(v=>!a.questions.some(q=>q.id===v.questionId&&q.options.some(o=>o.id===v.optionId)))||!Number.isInteger(c.correctCount)||c.correctCount<0||c.correctCount>4)throw new Error("Submit one answer to each question of the current server challenge.");
  if(c.correctCount<3){s.step="failed";delete s.grant;}else{if(!c.grant)throw new Error("The verified activity result needs an ownership grant.");grantError(f,s,c.grant,"activity",now);s.grant={...c.grant};s.step="phone";}delete s.activity;
 }else if(c.type==="phone_challenge"){
  if(!["phone","phone-code"].includes(s.step)||!s.grant)throw new Error("Confirm account ownership before replacing the number.");grantError(f,s,s.grant,s.grant.method,now);challengeError(f,s,c.challenge,"phone",now);if(!normalizedPhone(c.challenge.target)||normalizedPhone(c.challenge.target)!==c.challenge.target||c.challenge.target===f.phone)throw new Error("Enter a valid replacement number that differs from the old number.");s.newPhone=c.challenge.target;s.challenge={...c.challenge};s.step="phone-code";
 }else if(c.type==="phone_result"){
  if(s.step!=="phone-code"||!s.challenge||s.challenge.id!==c.challengeId||s.challenge.target!==s.newPhone||!s.grant||!sampleRef(c.reference))throw new Error("Verify the latest replacement-number challenge.");grantError(f,s,s.grant,s.grant.method,now);challengeError(f,s,s.challenge,"phone",now);if(c.conflict)throw new Error("This new number belongs to another account. Your existing account is unchanged.");s.completionReference=c.reference;s.step="recovered";delete s.grant;delete s.challenge;return {session:s,phone:s.newPhone};
 }else if(c.type==="support"){s.step="support";delete s.activity;delete s.grant;}
 else if(c.type==="back"){
  const parent:Partial<Record<RecoveryStep,RecoveryStep>>={email:"choose",identity:"choose","email-code":"email",options:"identity",capture:"options",activity:"options",phone:"options","phone-code":"phone"};
  if(["pending","failed","support","recovered"].includes(s.step))throw new Error("This recovery state needs a matching server result or support.");s.step=parent[s.step]??"choose";if(s.step==="options"||s.step==="identity"||s.step==="choose"){delete s.grant;delete s.challenge;delete s.activity;delete s.privateCapture;}
 }
 return {session:s};
}

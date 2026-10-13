import { AppMode } from "@/lib/appMode";
import { normalizedPhone, validName } from "@/lib/onboarding/model";
import { applyRecoveryCommand, RecoveryCommand, RecoverySession } from "./recovery";

export const sampleAccountId="sample-account-tobi";
export type PreferenceKey="requests"|"messages"|"bookings"|"payments"|"reviews"|"reminders"|"payouts"|"offers";
export type AccountPreferences=Record<AppMode,Partial<Record<PreferenceKey,boolean>>>;
export type ContactPurpose="current_phone"|"new_phone"|"email";
export type ContactChallenge={id:string;accountId:string;purpose:ContactPurpose;target:string;expiresAt:string;currentPhoneProof?:string};
export type ContactProof=ContactChallenge&{reference:string;status:"verified"};
export type AccountSecurityEvent={id:string;type:string;previousContact?:string;at?:string;accountId?:string};
export type SampleAccount={schema:1;source:"sample";id:string;revision:number;commands:string[];firstName:string;lastName:string;phone:string;email?:string;defaultArea:string;providerArea:string;approvedName:string;identityReference:string;providerId:string;providerStatus:"active"|"inactive"|"review";preferences:AccountPreferences;profile:{name:string;introduction:string;photos:string[];avatar:boolean;banner:boolean};challenge?:ContactChallenge;currentPhoneProof?:string;currentPhoneVerifiedUntil?:string;nameReview?:{id:string;firstName:string;lastName:string;privateDocumentReference:string;status:"in_review"};securityEvents:AccountSecurityEvent[];signedIn:boolean;recovery?:RecoverySession;deletion?:{id:string;requestedAt:string;noticeEndsAt:string;status:"notice"};};
export const customerPreferences:{key:PreferenceKey;label:string;description:string}[]=[
  {key:"requests",label:"Request responses",description:"New provider responses and questions"},
  {key:"messages",label:"Messages",description:"New messages and conversation updates"},
  {key:"bookings",label:"Booking updates",description:"Arrival, progress and completion"},
  {key:"payments",label:"Payments",description:"Payment confirmations and refund updates"},
  {key:"reviews",label:"Reviews & reminders",description:"Reminders to review completed work"},
  {key:"offers",label:"Offers and product news",description:"Tips and KraftKonect announcements"},
];
export const providerPreferences:{key:PreferenceKey;label:string;description:string}[]=[
  {key:"requests",label:"New requests",description:"New customer requests for your services"},
  {key:"messages",label:"Messages",description:"Customer and support conversations"},
  {key:"bookings",label:"Booking updates",description:"Inspections, quotes and cancellations"},
  {key:"reminders",label:"Job reminders",description:"Upcoming visits and unfinished updates"},
  {key:"payouts",label:"Payout updates",description:"Payment and bank transfer status"},
  {key:"offers",label:"Offers & product news",description:"Optional KraftKonect announcements"},
];
export function accountName(r:SampleAccount){return r.firstName+" "+r.lastName;}
export function areaError(value:string){return value.trim().length<2||value.trim().length>120||/[\u0000-\u001f\u007f]/.test(value)?"Enter an area, up to 120 characters.":undefined;}
export function emailAddress(value:string){const email=value.trim().toLowerCase();return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;}
export type AccountCommand=
  |{type:"preference";mode:AppMode;key:PreferenceKey;value:boolean}
  |{type:"area";value:string;provider?:boolean}
  |{type:"profile";name:string;introduction:string;photos:string[];avatar:boolean;banner:boolean}
  |{type:"begin_contact";challenge:ContactChallenge;now:string}
  |{type:"verify_contact";proof:ContactProof;now:string;conflict?:boolean}
  |{type:"cancel_contact"}
  |{type:"name_review";firstName:string;lastName:string;privateDocumentReference:string}
  |{type:"deactivate";confirmed:boolean}
  |{type:"request_reactivation"}
  |{type:"reactivation_result";identityReference:string;approved:boolean}
  |{type:"delete_notice";proof:ContactProof;now:string;confirmed:boolean}
  |{type:"sign_out"}
  |{type:"sample_sign_in"}|{type:"recovery";command:RecoveryCommand;now:string};
function matchingProof(r:SampleAccount,p:ContactProof,now:string){const c=r.challenge;if(!c||p.status!=="verified"||!p.reference.startsWith("sample-")||p.currentPhoneProof!==c.currentPhoneProof||["id","accountId","purpose","target","expiresAt"].some(k=>p[k as keyof ContactChallenge]!==c[k as keyof ContactChallenge]))throw new Error("Verification does not match the latest account challenge.");if(!Number.isFinite(Date.parse(now))||Date.parse(c.expiresAt)<=Date.parse(now))throw new Error("This code has expired. Request a new code.");}
/** DEV-only outcomes; production challenges, conflicts, identity review and lifecycle are server responsibilities. */
export function applyAccountCommand(r:SampleAccount,ownerId:string,revision:number,key:string,c:AccountCommand):SampleAccount{
  if(r.source!=="sample"||ownerId!==r.id||r.id!==sampleAccountId||!key.startsWith("sample-"))throw new Error("This action belongs to the owning sample account.");
  if(r.commands.includes(key))return r;
  if(r.revision!==revision)throw new Error("Your account changed. Refresh before trying again.");
  if(r.deletion&&c.type!=="sign_out")throw new Error("Deletion is in its notice period. Contact support about retained activity.");
  if(!r.signedIn&&c.type!=="sample_sign_in"&&c.type!=="recovery")throw new Error("Sign in to manage this sample account.");
  if(c.type==="sample_sign_in"&&r.recovery&&r.recovery.step!=="recovered")throw new Error("Recovery is still locked pending ownership verification or support.");
  const n:SampleAccount=JSON.parse(JSON.stringify(r));
  if(c.type==="recovery"){
    const result=applyRecoveryCommand(r,r.recovery,c.command,c.now);n.recovery=result.session;n.signedIn=result.session.step==="recovered";delete n.challenge;delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;if(result.phone){n.phone=result.phone;n.securityEvents.push({id:key,type:"account_recovered",previousContact:r.phone});}
  }else if(c.type==="preference"){
    const options=c.mode==="customer"?customerPreferences:c.mode==="provider"?providerPreferences:[];
    if(typeof c.value!=="boolean"||!options.some(v=>v.key===c.key))throw new Error("Unknown notification preference.");
    n.preferences[c.mode][c.key]=c.value;
  }else if(c.type==="area"){
    const error=areaError(c.value);if(error)throw new Error(error);n.defaultArea=c.value.trim();if(c.provider)n.providerArea=c.value.trim();
  }else if(c.type==="profile"){
    if(!validName(c.name)||c.introduction.trim().length<10||c.introduction.length>2000||c.photos.length>8||c.photos.some(v=>v!=="sample-photo-sink"))throw new Error("Enter a display name, introduction and supported sample work photos.");
    n.profile={name:c.name.trim(),introduction:c.introduction.trim(),photos:[...c.photos],avatar:c.avatar,banner:c.banner};
  }else if(c.type==="begin_contact"){
    const v=c.challenge;if(v.accountId!==r.id||!v.id.startsWith("sample-")||!Number.isFinite(Date.parse(c.now))||!Number.isFinite(Date.parse(v.expiresAt))||Date.parse(v.expiresAt)<=Date.parse(c.now))throw new Error("Invalid account challenge.");
    if(v.purpose==="current_phone"){if(v.target!==r.phone||v.currentPhoneProof)throw new Error("Verify the current phone first.");delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;}
    else if(v.purpose==="new_phone"){if(!r.currentPhoneProof||!r.currentPhoneVerifiedUntil||Date.parse(r.currentPhoneVerifiedUntil)<=Date.parse(c.now)||v.currentPhoneProof!==r.currentPhoneProof||normalizedPhone(v.target)!==v.target||v.target===r.phone)throw new Error("Verify your current phone before choosing a different number.");}
    else if(v.purpose==="email"){if(emailAddress(v.target)!==v.target||v.target===r.email)throw new Error("Enter a different valid email address.");}
    else throw new Error("Unknown verification purpose.");
    n.challenge={...v};
  }else if(c.type==="verify_contact"){
    matchingProof(r,c.proof,c.now);if(c.conflict)throw new Error("Those contact details are already linked to another account.");
    if(c.proof.purpose==="current_phone"){n.currentPhoneProof=c.proof.reference;n.currentPhoneVerifiedUntil=c.proof.expiresAt;}
    else {if(c.proof.purpose==="new_phone"){if(!r.currentPhoneProof||c.proof.currentPhoneProof!==r.currentPhoneProof)throw new Error("Current-phone verification is required.");n.phone=c.proof.target;}else n.email=c.proof.target;n.securityEvents.push({id:key,type:c.proof.purpose==="new_phone"?"phone_changed":"email_changed",previousContact:c.proof.purpose==="new_phone"?r.phone:r.email});delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;}
    delete n.challenge;
  }else if(c.type==="cancel_contact"){delete n.challenge;delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;}
  else if(c.type==="name_review"){
    if(!validName(c.firstName)||!validName(c.lastName)||!c.privateDocumentReference.startsWith("sample-private-id-")||accountName(r)===c.firstName.trim()+" "+c.lastName.trim())throw new Error("Provide a different full name and a private ID review reference.");
    if(r.nameReview)throw new Error("A name change is already under review.");
    n.nameReview={id:key,firstName:c.firstName.trim(),lastName:c.lastName.trim(),privateDocumentReference:c.privateDocumentReference,status:"in_review"};
  }else if(c.type==="deactivate"){
    if(!c.confirmed||r.providerStatus!=="active")throw new Error("Confirm before deactivating your provider profile.");n.providerStatus="inactive";
  }else if(c.type==="request_reactivation"){
    if(r.providerStatus!=="inactive")throw new Error("Only an inactive profile can request reactivation.");n.providerStatus="review";
  }else if(c.type==="reactivation_result"){
    if(r.providerStatus!=="review"||c.identityReference!==r.identityReference)throw new Error("A matching provider review is required.");n.providerStatus=c.approved?"active":"inactive";
  }else if(c.type==="delete_notice"){
    matchingProof(r,c.proof,c.now);if(!c.confirmed||c.proof.purpose!=="current_phone"||c.proof.target!==r.phone)throw new Error("Confirm deletion after verifying the current phone.");
    n.deletion={id:key,requestedAt:c.now,noticeEndsAt:new Date(Date.parse(c.now)+30*86400000).toISOString(),status:"notice"};n.signedIn=false;delete n.challenge;delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;
  }else if(c.type==="sign_out"){n.signedIn=false;delete n.challenge;delete n.currentPhoneProof;delete n.currentPhoneVerifiedUntil;}
  else if(c.type==="sample_sign_in")n.signedIn=true;
  const eventType:Partial<Record<AccountCommand["type"],string>>={name_review:"name_review_requested",deactivate:"provider_deactivated",request_reactivation:"reactivation_requested",delete_notice:"deletion_requested"};
  const type=c.type==="reactivation_result"?(c.approved?"provider_reactivated":"reactivation_declined"):eventType[c.type];
  if(type)n.securityEvents.push({id:key,type});
  const event=n.securityEvents.find(e=>e.id===key);if(event){event.accountId=r.id;if("now" in c)event.at=c.now;}
  n.revision++;n.commands.push(key);return n;
}
export function sampleAccount():SampleAccount{return {schema:1,source:"sample",id:sampleAccountId,revision:0,commands:[],firstName:"Tobi",lastName:"Adeyemi",phone:"+2348012345678",defaultArea:"Lekki Phase 1, Lagos",providerArea:"Lekki Phase 1, Lagos",approvedName:"Tobi Adeyemi",identityReference:"sample-approved-identity-tobi",providerId:"tobi",providerStatus:"active",preferences:{customer:Object.fromEntries(customerPreferences.map(v=>[v.key,v.key!=="offers"])),provider:Object.fromEntries(providerPreferences.map(v=>[v.key,v.key!=="offers"]))},profile:{name:"Tobi Plumbing",introduction:"Plumbing specialist helping homes and small businesses in Lekki with reliable repairs.",photos:["sample-photo-sink","sample-photo-sink"],avatar:true,banner:true},securityEvents:[],signedIn:true};}

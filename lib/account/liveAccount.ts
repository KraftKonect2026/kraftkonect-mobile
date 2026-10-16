import type { User } from "@/types";

export type AccountReadSnapshot={
 id:string;name:string;firstName:string;lastName:string;phone?:string;phoneVerified?:boolean;
 contactEmail?:string;contactEmailVerified?:boolean;avatarUrl?:string;area?:string;
 providerId?:string;verificationLabel:string;providerAvatar?:string;providerBanner?:string;providerBio?:string;
};
function text(value:unknown,max=200,lines=false):string|undefined{return typeof value==="string"&&value.trim()&&value.length<=max&&!(lines?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/).test(value)?value.trim():undefined;}
function imageUrl(value:unknown){const url=text(value,2048);return url&&/^https?:\/\//i.test(url)?url:undefined;}
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Account details are unavailable.");return value as Record<string,unknown>;}
export function sameAccountSession(ownerId:string,currentId:string|undefined,authenticated:boolean){return !!ownerId&&authenticated&&ownerId===currentId;}
export function assertHttpAccountScope(expected:string|null,current:string|null){if(expected!==current)throw new Error("The signed-in identity changed. Please retry from the current account.");}
export function currentRefreshSession(ownerId:string|null,token:string,current:{user?:{id:string}|null;refreshToken?:string|null}){return ownerId===(current.user?.id??null)&&token===current.refreshToken;}
export function verifiedRefreshTokens(value:unknown){const r=object(value);if(typeof r.accessToken!=="string"||!r.accessToken.trim()||typeof r.refreshToken!=="string"||!r.refreshToken.trim())throw new Error("The refreshed session was not confirmed.");return {accessToken:r.accessToken,refreshToken:r.refreshToken};}
/** Display only confirmed legacy DTO fields. Moderation approval is not lifecycle or payout identity proof. */
export function accountReadSnapshot(ownerId:string,me:unknown,provider?:unknown,area?:string):AccountReadSnapshot {
 const user=object(me);if(!ownerId||user.id!==ownerId)throw new Error("The account response does not match this signed-in identity.");
 const givenName=text(user.name),name=givenName??"Your account",parts=givenName?.split(/\s+/)??[""],profile=provider?object(provider):undefined;
 const kyc=profile&&text(profile.kycStatus);
 const verificationLabel=kyc==="approved"?"Identity verified":["pending","submitted","in_review"].includes(kyc??"")?"Verification in review":["failed","declined","rejected","not_submitted"].includes(kyc??"")?"Verification needed":"Verification status unavailable";
 return {id:ownerId,name,firstName:parts[0],lastName:parts.slice(1).join(" "),phone:text(user.phone,30),phoneVerified:typeof user.phoneVerified==="boolean"?user.phoneVerified:undefined,
  contactEmail:text(user.email,254),contactEmailVerified:typeof user.emailVerified==="boolean"?user.emailVerified:undefined,avatarUrl:imageUrl(user.avatarUrl),area:text(area,120),
  providerId:profile&&text(profile.id),verificationLabel,providerAvatar:profile&&imageUrl(profile.avatar),providerBanner:profile&&imageUrl(profile.banner),providerBio:profile&&text(profile.bio,2000,true)};
}
export function matchedAvatarUpdate(ownerId:string,response:unknown,requestedUrl:string):Partial<User> {
 const result=object(response);if(result.id!==ownerId||result.avatarUrl!==requestedUrl||!imageUrl(requestedUrl))throw new Error("The photo update was not confirmed for this account.");return {avatarUrl:requestedUrl};
}
export const liveAccountSteps=["details","profile-details","provider-profile","name","phone","email","privacy","area","preferences","payments","add-card","payment-history","reviews","help","legal","delete","delete-activity","delete-confirm","delete-code","deactivate"] as const;
export type LiveAccountStep=typeof liveAccountSteps[number];
export function liveAccountStep(value:unknown):LiveAccountStep{return typeof value==="string"&&(liveAccountSteps as readonly string[]).includes(value)?value as LiveAccountStep:"details";}

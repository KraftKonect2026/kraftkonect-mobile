import { accountReadSnapshot } from "@/lib/account/liveAccount";

export async function startOwnedVerification(ownerId:string,providerId:string,ports:{me:()=>Promise<unknown>;profile:()=>Promise<unknown>;start:(providerId:string)=>Promise<unknown>;isCurrent:()=>boolean}) {
 const current=()=>{if(!ports.isCurrent())throw new Error("The signed-in account changed. Reopen verification.");};
 current();
 const [me,profile]=await Promise.all([ports.me(),ports.profile()]);current();
 accountReadSnapshot(ownerId,me);
 if(!providerId||!profile||typeof profile!=="object"||!("id" in profile)||profile.id!==providerId)throw new Error("Your provider profile could not be confirmed.");
 const result=await ports.start(providerId);current();
 if(!result||typeof result!=="object"||!("inquiryId" in result)||!("inquiryUrl" in result)||typeof result.inquiryId!=="string"||!result.inquiryId.trim()||typeof result.inquiryUrl!=="string"||!/^https:\/\//.test(result.inquiryUrl))throw new Error("Your verification session could not be confirmed.");
 return {inquiryId:result.inquiryId,inquiryUrl:result.inquiryUrl,clientToken:"clientToken" in result&&typeof result.clientToken==="string"?result.clientToken:undefined};
}

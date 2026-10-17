import { accountReadSnapshot } from "@/lib/account/liveAccount";
import { Service } from "@/lib/discovery/model";
import { ServiceDraft } from "./catalog";
import { priceCents } from "@/lib/onboarding/model";

export type ProviderCatalogRead={ownerId:string;providerId?:string;services?:Service[];setupNeeded:boolean};
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Your services could not be loaded.");return value as Record<string,unknown>;}
function publicText(value:unknown,max:number){return typeof value==="string"&&value.trim()&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)?value:undefined;}
function recordId(value:unknown){const result=publicText(value,200);if(!result||/\s/.test(result))throw new Error("The provider or service identity could not be confirmed.");return result;}
function amount(value:unknown){if(value===null||value===undefined)return undefined;if(!Number.isSafeInteger(value)||(value as number)<0)throw new Error("The recorded starting price could not be confirmed.");return value as number;}
/** Services saved by earlier app versions store the code in lowercase ("ngn"), so compare it case-insensitively. */
function currency(value:unknown){if(typeof value!=="string")return undefined;const code=value.trim().toUpperCase();if(!/^[A-Z]{3}$/.test(code))return undefined;try{new Intl.NumberFormat("en-NG",{style:"currency",currency:code});return code;}catch{return undefined;}}
export function publicServicePhoto(value:unknown):value is string{return typeof value==="string"&&value.length<=2048&&/^https?:\/\/\S+$/i.test(value);}

/** Legacy read fields do not establish the new weekday, lifecycle or archive contracts. */
export function ownedProviderCatalog(ownerId:string,me:unknown,profile:unknown):ProviderCatalogRead{
  accountReadSnapshot(ownerId,me);
  if(profile===null)return {ownerId,setupNeeded:true};
  const provider=object(profile),providerId=recordId(provider.id);
  if(!Array.isArray(provider.listings))throw new Error("Your saved services could not be loaded.");
  const seen=new Set<string>();
  const services=provider.listings.map(value=>{
    const listing=object(value),id=recordId(listing.id),title=publicText(listing.title,300);
    if(seen.has(id)||!title||typeof listing.active!=="boolean")throw new Error("The saved service record could not be confirmed.");
    seen.add(id);
    const price=amount(listing.priceCents),minimum=amount(listing.minPriceCents),unit=currency(listing.currency);
    if(listing.photos!==null&&listing.photos!==undefined&&!Array.isArray(listing.photos))throw new Error("The service photos could not be loaded.");
    return {id,title,description:publicText(listing.description,10000),active:listing.active,category:publicText(listing.category,100),
      priceCents:unit?price:undefined,minPriceCents:unit?minimum:undefined,currency:unit,photos:Array.isArray(listing.photos)?listing.photos.filter(publicServicePhoto):[]} satisfies Service;
  });
  return {ownerId,providerId,services,setupNeeded:false};
}
export function ownedCatalogService(catalog:ProviderCatalogRead,id:unknown){
  const service=typeof id==="string"&&catalog.services?.find(value=>value.id===id);
  if(!service)throw new Error("Choose a saved service from My services.");return service;
}
export function liveServiceDraft(service?:Service):ServiceDraft{
  const value=service?.minPriceCents??service?.priceCents;
  return {title:service?.title??"",description:service?.description??"",price:value===undefined||value===null?"":(value/100).toLocaleString("en-NG",{maximumFractionDigits:2}),photos:service?.photos?[...service.photos]:[]};
}
export function liveServiceDraftError(draft:ServiceDraft){
  if(draft.title.trim().length<5||draft.title.trim().length>100||/[\u0000-\u001f\u007f]/.test(draft.title))return "Enter a service name with 5–100 characters.";
  if(draft.description.trim().length<20||draft.description.length>2000)return "Describe the service in 20–2,000 characters.";
  if(priceCents(draft.price)===null)return "Enter a valid starting price greater than ₦0.";
  if(!draft.photos.length||draft.photos.length>6||!draft.photos.every(publicServicePhoto))return "Add a completed public service photo before publishing.";
  return undefined;
}
export async function readOwnedCatalog(ownerId:string,reader:{me:()=>Promise<unknown>;listings:()=>Promise<unknown>;isCurrent:()=>boolean}){
  const assertCurrent=()=>{if(!reader.isCurrent())throw new Error("The signed-in identity changed. Refresh My services.");};
  assertCurrent();const [me,profile]=await Promise.all([reader.me(),reader.listings()]);assertCurrent();return ownedProviderCatalog(ownerId,me,profile);
}
export async function saveOwnedRequestStatus(ownerId:string,providerId:string,available:boolean,reader:{me:()=>Promise<unknown>;profile:()=>Promise<unknown>;save:(available:boolean)=>Promise<unknown>;isCurrent:()=>boolean}){
  const assertCurrent=()=>{if(!reader.isCurrent())throw new Error("The signed-in identity changed. Reopen availability.");};
  if(!ownerId||!providerId||typeof available!=="boolean")throw new Error("The request status could not be confirmed.");
  assertCurrent();const [me,profile]=await Promise.all([reader.me(),reader.profile()]);assertCurrent();
  accountReadSnapshot(ownerId,me);
  if(object(profile).id!==providerId)throw new Error("The provider profile changed. Refresh before saving.");
  const result=await reader.save(available);assertCurrent();const receipt=object(result);
  if(receipt.id!==providerId||receipt.available!==available)throw new Error("The request status update was not confirmed.");
  return {providerId,available};
}

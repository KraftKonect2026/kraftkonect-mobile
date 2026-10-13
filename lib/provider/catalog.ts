import { priceCents } from "@/lib/onboarding/model";
import { parseDay, Provider, Service } from "@/lib/discovery/model";
export type ServiceDraft={title:string;description:string;price:string;photos:string[]};
export type Availability={available:boolean;days:number[]};
export type SampleCatalog={schema:1;source:"sample";providerId:string;revision:number;services:Service[];availability:Availability;providerEnabled:boolean;commands:string[]};
export const dayOptions=[{day:1,label:"Mon"},{day:2,label:"Tue"},{day:3,label:"Wed"},{day:4,label:"Thu"},{day:5,label:"Fri"},{day:6,label:"Sat"},{day:0,label:"Sun"}];
export function serviceDraftError(d:ServiceDraft):string|undefined{
  if(d.title.trim().length<5||d.title.trim().length>100||/[\u0000-\u001f\u007f]/.test(d.title))return "Enter a service name with 5–100 characters.";
  if(d.description.trim().length<20||d.description.length>2000)return "Describe the service in 20–2,000 characters.";
  if(priceCents(d.price)===null)return "Enter a valid starting price greater than ₦0.";
  if(!d.photos.length||d.photos.length>6||d.photos.some(v=>v!=="sample-photo-sink"))return "Add a sample work photo before publishing.";
  return undefined;
}
export function availabilityError(a:Availability):string|undefined{
  return typeof a.available!=="boolean"||!Array.isArray(a.days)||new Set(a.days).size!==a.days.length||a.days.some(d=>!Number.isInteger(d)||d<0||d>6)||a.available&&!a.days.length?"Choose at least one day when available.":undefined;
}
export function availabilityLabel(a:Availability):string{return !a.available?"Unavailable":a.days.length===7?"Available · every day":"Available · "+dayOptions.filter(v=>a.days.includes(v.day)).map(v=>v.label).join(", ");}
export function toggleDay(days:number[],day:number|"all"):number[]{return day==="all"?(days.length===7?[]:dayOptions.map(v=>v.day)):days.includes(day)?days.filter(v=>v!==day):dayOptions.map(v=>v.day).filter(v=>v===day||days.includes(v));}
export function serviceToDraft(s?:Service):ServiceDraft{return s?{title:s.title,description:s.description??"",price:((s.minPriceCents??s.priceCents??0)/100).toLocaleString("en-NG",{maximumFractionDigits:2}),photos:s.photos??[]}: {title:"",description:"",price:"",photos:[]};}
export type CatalogCommand={type:"save_service";id?:string;draft:ServiceDraft}|{type:"delete_service";id:string}|{type:"availability";value:Availability};
export function applyCatalogCommand(record:SampleCatalog,role:"customer"|"provider",providerId:string,revision:number,key:string,c:CatalogCommand):SampleCatalog{
  if(record.source!=="sample"||role!=="provider"||providerId!==record.providerId||!key.startsWith("sample-"))throw new Error("Only this sample provider can manage its services and availability.");
  if(record.commands.includes(key))return record;
  if(record.revision!==revision)throw new Error("Your services changed. Refresh before retrying.");
  const next:SampleCatalog=JSON.parse(JSON.stringify(record));
  if(c.type==="availability"){const error=availabilityError(c.value);if(error)throw new Error(error);next.availability={available:c.value.available,days:[...c.value.days]};}
  else if(c.type==="delete_service"){const s=next.services.find(v=>v.id===c.id&&v.active===true);if(!s)throw new Error("This current service could not be found.");s.active=false;}
  else{
    const error=serviceDraftError(c.draft);if(error)throw new Error(error);
    if(c.id&&!next.services.some(v=>v.id===c.id&&v.active===true))throw new Error("This current service could not be found.");
    const saved:Service={id:c.id??key,title:c.draft.title.trim(),description:c.draft.description.trim(),active:true,category:c.id?record.services.find(v=>v.id===c.id)?.category:undefined,minPriceCents:priceCents(c.draft.price)!,currency:"NGN",photos:[...c.draft.photos]};
    if(c.id)next.services=next.services.map(v=>v.id===c.id?saved:v);else next.services.push(saved);
  }
  next.revision++;next.commands.push(key);return next;
}
export function withSampleCatalog(provider:Provider,catalog?:SampleCatalog):Provider{
  return !catalog||provider.id!==catalog.providerId?provider:{...provider,services:catalog.services.map(s=>({...s})),available:catalog.providerEnabled&&catalog.availability.available,requestDays:catalog.availability.days,providerEnabled:catalog.providerEnabled};
}
export function acceptsDay(days:number[]|undefined,date:string):boolean{const d=parseDay(date);return !!d&&(!days||days.includes(d.getDay()));}

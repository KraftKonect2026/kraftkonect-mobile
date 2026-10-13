import { draftKey } from "@/lib/onboarding/model";

export type DiscoveryStep = "what" | "where" | "when" | "results" | "profile" | "request" | "review" | "sent" | "saved" | "again" | "pending" | "message";
export type SearchDraft = { version: 1; problem: string; category: string; area: string; date: string; latitude?: number; longitude?: number };
export type RequestDraft = { version: 1; providerId: string; serviceId: string; area: string; date: string; description: string };
export type Service = { id: string; title: string; description?: string; active?: boolean; category?: string; priceCents?: number | null; minPriceCents?: number | null; currency?: string; photos?: string[] };
export type Review = { id: string; userName?: string; rating?: number; comment?: string; date?: string };
export type Provider = { id: string; name: string; status?: string; verified?: boolean; category?: string; categories?: string[]; avatar?: string; banner?: string; bio?: string; portfolio?: string[]; rating?: number | null; reviewCount?: number | null; services?: Service[]; reviews?: Review[]; available?: boolean; blockedDates?: string[];requestDays?:number[];providerEnabled?:boolean };
export type CompletedJob = { id: string; status: string; bookingDate?: string; createdAt?: string; provider?: { id: string }; listing?: { id: string; title?: string } };
export const categories = [ { key: "cleaning", label: "Cleaning" }, { key: "general", label: "Repairs" }, { key: "beauty", label: "Beauty" }, { key: "moving", label: "Moving" }, { key: "plumbing", label: "Plumbing" }, { key: "electrical", label: "Electrical" }, { key: "gardening", label: "Gardening" } ];
export function localDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year,month,day] = value.split("-").map(Number);
  const date = new Date(year,month-1,day,12);
  return localDate(date) === value ? date : null;
}
export function futureDay(value: string, today = localDate()): boolean { return !!parseDay(value) && value >= today; }
export function addDays(date: Date, days: number): Date { return new Date(date.getFullYear(),date.getMonth(),date.getDate()+days,12); }
export function dateLabel(value: string): string { return parseDay(value)?.toLocaleDateString("en-US", { month:"short", day:"numeric" }) ?? "Add date"; }
export function nextMonday(today = new Date()): Date { return addDays(today, ((8-today.getDay())%7)||7); }
export function emptySearch(): SearchDraft { return { version:1, problem:"", category:"", area:"", date:"" }; }
export function safeSearch(value: unknown): SearchDraft {
  const result = emptySearch(); if (!value || typeof value !== "object") return result;
  const obj = value as Record<string,unknown>;
  for (const key of ["problem","area"] as const) if(typeof obj[key] === "string") result[key] = obj[key].slice(0,160);
  if (typeof obj.category === "string" && [...categories.map(c=>c.key),"painting"].includes(obj.category)) result.category = obj.category;
  if (typeof obj.date === "string" && futureDay(obj.date)) result.date = obj.date;
  if (typeof obj.latitude === "number" && Number.isFinite(obj.latitude) && Math.abs(obj.latitude)<=90 && typeof obj.longitude === "number" && Number.isFinite(obj.longitude) && Math.abs(obj.longitude)<=180) { result.latitude=obj.latitude; result.longitude=obj.longitude; }
  return result;
}
export function safeRequest(value: unknown): RequestDraft {
  const result: RequestDraft = { version:1,providerId:"",serviceId:"",area:"",date:"",description:"" };
  if (!value || typeof value !== "object") return result;
  const obj = value as Record<string,unknown>;
  for(const key of ["providerId","serviceId","area","description"] as const) if(typeof obj[key] === "string") result[key] = obj[key].slice(0,key === "description" ? 1000 : 160);
  if(typeof obj.date === "string" && futureDay(obj.date)) result.date=obj.date;
  return result;
}
export function discoveryKey(owner: string, kind: "search" | "request" | "recent" | "saved") { return draftKey("discovery/"+kind+"/"+owner); }
export function isPublic(provider: Provider): boolean { return provider.status === "approved" && provider.verified === true && provider.providerEnabled!==false; }
export function servicePrice(service?: Service): number | null {
  const price = service?.minPriceCents ?? service?.priceCents;
  return typeof price === "number" && Number.isSafeInteger(price) && price >= 0 ? price : null;
}
export function startingPrice(service?: Service): string {
  const price=servicePrice(service); if(price == null) return "Price to be confirmed";
  return "From " + new Intl.NumberFormat("en-NG", { style:"currency", currency:service?.currency || "NGN", minimumFractionDigits: price%100 ? 2 : 0, maximumFractionDigits:2 }).format(price/100);
}
export function activeServices(provider: Provider): Service[] { return (provider.services ?? []).filter(s=>s.active === true); }
export function matchingService(provider: Provider, category: string): Service | undefined { return activeServices(provider).find(s=> !category || s.category === category) ?? activeServices(provider)[0]; }
export function sortedProviders(providers: Provider[], category: string, order: "default" | "low" | "high"): Provider[] {
  const eligible=providers.filter(p=> isPublic(p) && activeServices(p).length && (!category || p.category===category || p.categories?.includes(category) || activeServices(p).some(s=>s.category===category)));
  if(order === "default") return eligible;
  return eligible.map((p,index)=>({p,index,price:servicePrice(matchingService(p,category))})).sort((a,b)=>a.price==null ? b.price==null ? a.index-b.index : 1 : b.price==null ? -1 : (order==="low" ? a.price-b.price : b.price-a.price)||a.index-b.index).map(x=>x.p);
}
export function requestError(draft: RequestDraft, provider?: Provider): string | null {
  if(!provider || !isPublic(provider)) return "This provider is not currently available for requests.";
  if(!activeServices(provider).some(s=>s.id === draft.serviceId)) return "This service is no longer offered. Choose a current service.";
  if(provider.available === false) return "This provider is currently unavailable. Choose another provider.";
  if(!futureDay(draft.date)) return "Choose a preferred date today or later.";
  if(provider.requestDays&&!provider.requestDays.includes(parseDay(draft.date)!.getDay()))return "The provider does not accept requests on this weekday. Choose another date.";
  if(provider.blockedDates?.some(d=>d.slice(0,10)===draft.date)) return "The provider is unavailable on that date. Choose another date.";
  if(!draft.area.trim()) return "Enter the area where you need the service.";
  if(draft.description.trim().length<10) return "Tell the provider what you need in at least 10 characters.";
  return null;
}
export function completedJobs(jobs: CompletedJob[]): CompletedJob[] {
  return jobs.filter(j=>j.status === "completed" && !!j.provider?.id && !!j.listing?.id).sort((a,b)=> (Date.parse(b.bookingDate || b.createdAt || "") || 0)-(Date.parse(a.bookingDate || a.createdAt || "") || 0));
}
export type RequestReceipt = { id:string; providerId:string; serviceId:string; status:"pending"; conversationId?:string };
// Future backend adapter must validate a stored record. No client flag/timer proves submission.
export function confirmedRequest(value: unknown, draft: RequestDraft): RequestReceipt {
  const receipt=value as RequestReceipt | null;
  if(!receipt || typeof receipt.id !== "string" || !receipt.id.trim() || receipt.status !== "pending" || receipt.providerId!==draft.providerId || receipt.serviceId!==draft.serviceId) throw new Error("Request was not confirmed.");
  return { id:receipt.id,providerId:receipt.providerId,serviceId:receipt.serviceId,status:"pending", ...(typeof receipt.conversationId === "string" && receipt.conversationId.trim() ? {conversationId:receipt.conversationId} : {}) };
}

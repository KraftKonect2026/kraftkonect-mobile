import { addDays, localDate, Provider, CompletedJob } from "@/lib/discovery/model";
import type { ProviderArt } from "@/components/discovery/Parts";

export const previewArt:Record<string,ProviderArt> = {
  tobi: { cover:require("@/assets/design/1b9df.png"),resultSubtitle:"Plumbing and leak repair",avatar:require("@/assets/discovery/2543d.png"),
    gallery:[require("@/assets/discovery/70d86.jpg"),require("@/assets/discovery/43d3e.jpg"),require("@/assets/discovery/4bd4a.jpg"),require("@/assets/discovery/bbe0b.jpg")],
    galleryBases:[require("@/assets/discovery/d8c1e.png"),require("@/assets/discovery/d65fd.png"),require("@/assets/discovery/5a905.png"),require("@/assets/discovery/bb673.png")],
    fullGallery:[require("@/assets/discovery/fe85c.png"),require("@/assets/design/1b9df.png"),require("@/assets/discovery/3e99e.png"),require("@/assets/discovery/bbe0b.jpg")],
    thumbnails:[require("@/assets/discovery/269cf.png"),require("@/assets/discovery/c868d.png"),require("@/assets/discovery/1fe84.png"),require("@/assets/discovery/b2890.png")] },
  kola:{cover:require("@/assets/design/eba1f.png"),bookAgainCover:require("@/assets/discovery/930fb.jpg"),gallery:[]},ade:{cover:require("@/assets/design/c73f3.png"),gallery:[]},
  amara:{cover:require("@/assets/design/631d0.png"),gallery:[]},coolair:{cover:require("@/assets/design/c73f3.png"),gallery:[]},
  "kola-electric":{cover:require("@/assets/design/77163.png"),gallery:[]},
};
const today=new Date();
export const discoveryProviders:Provider[]=[
  {id:"tobi",name:"Tobi Plumbing",status:"approved",verified:true,category:"plumbing",categories:["plumbing"],available:true,rating:4.8,reviewCount:4,
    bio:"Verified plumbing provider serving homes and small businesses across Lekki and nearby areas.",services:[
      {id:"kitchen",title:"Kitchen plumbing repair",description:"Leaks, traps and connectors",active:true,category:"plumbing",minPriceCents:2000000,currency:"NGN"},
      {id:"bathroom",title:"Bathroom pipe repair",description:"Pipes, fittings and leaks",active:true,category:"plumbing",minPriceCents:2500000,currency:"NGN"},
      {id:"leak",title:"Leak diagnosis & repair",description:"Find and repair common leaks",active:true,category:"plumbing",minPriceCents:2500000,currency:"NGN"}],reviews:[
      {id:"r1",userName:"Amara H.",rating:5,comment:"Clear communication and tidy work.",date:localDate(addDays(today,-21))},
      {id:"r2",userName:"Jordan M.",rating:5,comment:"Exceeded expectations in every way. Very professional and easy to work with. Responsive, reliable and careful with our home. The leak was repaired and everything was left clean.",date:localDate(addDays(today,-7))},
      {id:"r3",userName:"Priya S.",rating:4,comment:"Very professional and easy to work with.",date:localDate(addDays(today,-60))},
      {id:"r4",userName:"Leo T.",rating:5,comment:"Responsive, reliable, and great results.",date:localDate(addDays(today,-5))}]},
  {id:"kola",name:"Kola Repairs",status:"approved",verified:true,category:"general",categories:["plumbing","general","electrical"],rating:4.9,reviewCount:0,bio:"Home repairs and maintenance.",services:[{id:"home",title:"Plumbing and home repairs",description:"Home fixtures, pipes and fittings",category:"plumbing",active:true,minPriceCents:2200000,currency:"NGN"},{id:"electrical",title:"Electrical repairs",category:"electrical",active:true,minPriceCents:1500000,currency:"NGN"}]},
  {id:"ade",name:"Ade Home Services",status:"approved",verified:true,category:"plumbing",rating:4.8,reviewCount:0,services:[{id:"pipe",title:"Pipe, sink and fixture repair",category:"plumbing",active:true,minPriceCents:1850000,currency:"NGN"}]},
  {id:"amara",name:"Amara Home Care",status:"approved",verified:true,category:"cleaning",rating:4.9,reviewCount:0,services:[{id:"clean",title:"Home cleaning",description:"Cleaning for your home",category:"cleaning",active:true,minPriceCents:1800000,currency:"NGN"}]},
  {id:"coolair",name:"CoolAir Repairs",status:"approved",verified:true,category:"general",rating:4.8,reviewCount:0,services:[{id:"air",title:"AC servicing",description:"Air conditioner maintenance",category:"general",active:true,minPriceCents:1500000,currency:"NGN"}]},
  {id:"kola-electric",name:"Kola Electric",status:"approved",verified:true,category:"electrical",rating:4.8,reviewCount:0,services:[{id:"electrical",title:"Electrical repairs",category:"electrical",active:true,minPriceCents:1800000,currency:"NGN"}]},
];
export const discoveryHistory:CompletedJob[]=[
  // Each illustrative job also completed on its booking date.
  {id:"b1",status:"completed",bookingDate:localDate(addDays(today,-10)),provider:{id:"amara"},listing:{id:"clean",title:"Home cleaning"}},
  {id:"b2",status:"completed",bookingDate:localDate(addDays(today,-20)),provider:{id:"kola"},listing:{id:"home",title:"Plumbing and home repairs"}},
  {id:"b3",status:"completed",bookingDate:localDate(addDays(today,-24)),provider:{id:"coolair"},listing:{id:"air",title:"AC servicing"}},
  {id:"b4",status:"completed",bookingDate:localDate(addDays(today,-30)),provider:{id:"tobi"},listing:{id:"kitchen",title:"Kitchen plumbing repair"}},
];
export function discoveryPreviewId(id:string):string { return discoveryProviders.some(p=>p.id===id) ? id : ({"preview-amara":"amara","preview-kola-repairs":"kola","preview-coolair":"coolair","preview-kola-electric":"kola-electric"} as Record<string,string>)[id] ?? id; }

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname,"..");
const modules = new Map();
function load(relative) {
  const full = path.join(root,relative);
  if(modules.has(full))return modules.get(full).exports;
  const compiled = ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod = new Module(full,module);mod.filename=full;mod.paths=Module._nodeModulePaths(path.dirname(full));
  const original=mod.require.bind(mod);mod.require=spec=>spec.startsWith("@/") ? load(spec.slice(2)+".ts") : original(spec);
  modules.set(full,mod);mod._compile(compiled,full);return mod.exports;
}
const m=load("lib/discovery/model.ts");let count=0;
function check(name,fn){fn();count++;console.log("PASS "+name);}
const provider={id:"p1",name:"Provider",status:"approved",verified:true,services:[{id:"s1",title:"Repair",category:"plumbing",active:true,minPriceCents:2000000,currency:"NGN"}]};
const draft={version:1,providerId:"p1",serviceId:"s1",date:m.localDate(),area:"Lekki",description:"Repair the leaking kitchen pipe."};
check("Calendar rejects impossible dates and accepts leap days",()=>{
  for(const value of ["2026-02-30","2026-02-29","2026-13-01","2026-00-01","2026-01-00","12/10/2026","2026-1-1"])assert.equal(m.parseDay(value),null);
  assert.equal(m.localDate(m.parseDay("2028-02-29")),"2028-02-29");
});
check("Calendar arithmetic preserves local days across DST and month/year boundaries",()=>{
  process.env.TZ="America/Toronto";
  assert.equal(m.localDate(m.addDays(new Date(2026,2,7,12),2)),"2026-03-09");
  assert.equal(m.localDate(m.addDays(new Date(2026,9,31,12),2)),"2026-11-02");
  assert.equal(m.localDate(m.addDays(new Date(2026,11,31,12),1)),"2027-01-01");
  assert.equal(m.localDate(m.nextMonday(new Date(2026,9,12,12))),"2026-10-19");
});
check("Past dates cannot be restored or submitted",()=>{
  assert.equal(m.futureDay("2026-10-11","2026-10-12"),false);
  assert.equal(m.futureDay("2026-10-12","2026-10-12"),true);
  assert.equal(m.safeSearch({date:"2000-01-01"}).date,"");assert.equal(m.safeRequest({...draft,date:"2000-01-01"}).date,"");
});
check("Search restores only bounded public preferences and valid paired coordinates",()=>{
  const result=m.safeSearch({category:"plumbing",problem:"leak",area:"Lekki",date:m.localDate(),latitude:6.45,longitude:3.4,accessToken:"private",address:"private"});
  assert.equal(result.latitude,6.45);assert.equal(result.longitude,3.4);assert.equal("accessToken" in result,false);assert.equal("address" in result,false);
  for(const coords of [{latitude:NaN,longitude:3},{latitude:91,longitude:3},{latitude:6,longitude:181},{latitude:6}])assert.equal(m.safeSearch(coords).latitude,undefined);
  assert.equal(m.safeSearch({problem:"x".repeat(10000),category:"invented"}).problem.length,160);assert.equal(m.safeSearch({category:"invented"}).category,"");
});
check("Request drafts exclude success, credentials and exact addresses",()=>{
  const result=m.safeRequest({...draft,description:"x".repeat(4000),status:"sent",id:"receipt",conversationId:"private",accessToken:"private",address:"private"});
  assert.equal(result.description.length,1000);
  for(const key of ["status","id","conversationId","accessToken","address"])assert.equal(key in result,false);
});
check("Account and preview keys are distinct and native-safe",()=>{
  const keys=["account/a","account_a","preview/step5","😀"].flatMap(owner=>["search","request","recent","saved"].map(kind=>m.discoveryKey(owner,kind)));
  assert.equal(new Set(keys).size,keys.length);keys.forEach(key=>assert.match(key,/^[A-Za-z0-9._-]+$/));
});
check("Only approved verified providers with active services are discoverable",()=>{
  const candidates=[provider,{...provider,id:"pending",status:"pending"},{...provider,id:"unverified",verified:false},{...provider,id:"inactive",services:[{...provider.services[0],active:false}]},{...provider,id:"unknown",services:[{id:"s",title:"Unknown"}]}];
  assert.deepEqual(m.sortedProviders(candidates,"plumbing","default").map(p=>p.id),["p1"]);
});
check("Service-specific numeric sorting handles zero, missing prices and ties",()=>{
  const item=(id,price)=>({...provider,id,services:[{...provider.services[0],minPriceCents:price}]});
  const candidates=[item("unknown",null),item("high",2200000),item("low",1850000),item("tie",1850000),item("zero",0)];
  assert.deepEqual(m.sortedProviders(candidates,"plumbing","low").map(p=>p.id),["zero","low","tie","high","unknown"]);
  assert.deepEqual(m.sortedProviders(candidates,"plumbing","high").map(p=>p.id),["high","low","tie","zero","unknown"]);
  assert.equal(m.startingPrice({id:"s",title:"Unknown"}),"Price to be confirmed");assert.equal(m.servicePrice({minPriceCents:-1}),null);
});
check("Book again retains the original service and filters non-completed jobs",()=>{
  const jobs=[{id:"old",status:"completed",bookingDate:"2026-10-01",provider:{id:"p1"},listing:{id:"s1"}},{id:"new",status:"completed",bookingDate:"2026-10-10",provider:{id:"p1"},listing:{id:"other-service"}},{id:"pending",status:"pending",bookingDate:"2026-10-12",provider:{id:"p1"},listing:{id:"s1"}},{id:"missing",status:"completed",provider:{id:"p1"}}];
  assert.deepEqual(m.completedJobs(jobs).map(j=>[j.id,j.listing.id]),[["new","other-service"],["old","s1"]]);
});
check("Request gate checks provider approval, current service, unavailable and blocked dates",()=>{
  assert.equal(m.requestError(draft,provider),null);
  for(const p of [undefined,{...provider,status:"pending"},{...provider,verified:false},{...provider,available:false},{...provider,services:[{...provider.services[0],active:false}]},{...provider,blockedDates:[draft.date+"T00:00:00Z"]}])assert.ok(m.requestError(draft,p));
  for(const patch of [{serviceId:"old-service"},{date:"2000-01-01"},{area:" "},{description:"short"}])assert.ok(m.requestError({...draft,...patch},provider));
});
check("Success requires a stored matching pending record, never a client flag",()=>{
  const good={id:"server-record",providerId:"p1",serviceId:"s1",status:"pending",conversationId:"server-conversation"};
  for(const bad of [null,{},true,{sent:true},{...good,id:" "},{...good,status:"paid"},{...good,providerId:"other"},{...good,serviceId:"other"}])assert.throws(()=>m.confirmedRequest(bad,draft));
  assert.equal(m.confirmedRequest(good,draft).conversationId,"server-conversation");
  assert.equal("conversationId" in m.confirmedRequest({...good,conversationId:" "},draft),false);
});
console.log("\nDiscovery regression checks passed: "+count+".");

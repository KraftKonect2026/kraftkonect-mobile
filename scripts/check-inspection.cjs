const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript");
const root=path.resolve(__dirname,"..");const modules=new Map();
function load(relative){const file=path.join(root,relative);if(modules.has(file))return modules.get(file).exports;const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));const original=mod.require.bind(mod);mod.require=spec=>spec.startsWith("@/")?load(spec.slice(2)+".ts"):original(spec);modules.set(file,mod);mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports;}
const m=load("lib/bookings/model.ts"),p=load("lib/preview/inspectionModel.ts"),d=load("lib/discovery/model.ts");
let count=0;function check(name,fn){fn();count++;console.log("PASS "+name);}
const draft={minimum:"85000",maximum:"110000",deposit:"5000",date:d.localDate(d.addDays(new Date(),1)),time:"10:00"};
const initial=()=>p.sampleInspection();
const response=()=>p.applySampleCommand(initial(),"provider",0,"response",{type:"respond",draft});
const checkout=()=>{const r=response();return p.applySampleCommand(r,"customer",r.revision,"checkout",{type:"checkout",address:"12 Admiralty Way"});};
const paid=()=>{const r=checkout();return p.applySampleCommand(r,"customer",r.revision,"verify",{type:"payment",receipt:{...r.payment,status:"verified"}});};
check("Money uses integer minor units and rejects malformed, negative and unsafe input",()=>{
  assert.equal(m.parseMoney("₦85,000.25"),8500025);assert.equal(m.parseMoney("0"),0);
  for(const value of ["-1","NaN","Infinity","1e3","1.123","12,34","9007199254740992","","£500"])assert.equal(m.parseMoney(value),null);
});
check("Provider response validates range, deposit, real date and appointment time",()=>{
  assert.equal(m.responseError(draft),null);
  assert.equal(m.responseError({...draft,minimum:"0"}),null);
  for(const patch of [{minimum:"-1"},{maximum:"84999"},{deposit:"0"},{date:"2000-01-01"},{date:"2026-02-30"},{time:"24:00"},{time:"10:75"}])assert.ok(m.responseError({...draft,...patch}));
});
check("No response or date suggestion confirms an inspection",()=>{
  assert.equal(m.inspectionVerified(initial()),false);assert.equal(m.inspectionVerified(response()),false);assert.equal(m.sectionFor(response()),"pending");
  assert.equal(response().address,undefined);assert.equal(m.statusFor(response()),"Response received");
});
check("Only the correct participant can respond, pay or complete",()=>{
  assert.throws(()=>p.applySampleCommand(initial(),"customer",0,"bad-response",{type:"respond",draft}));
  const r=response();assert.throws(()=>p.applySampleCommand(r,"provider",r.revision,"bad-checkout",{type:"checkout",address:"12 Admiralty Way"}));
  const b=paid();assert.throws(()=>p.applySampleCommand(b,"customer",b.revision,"bad-complete",{type:"complete_inspection",findings:"Replace the trap and connector seal."}));
});
check("Pending and failed payment never expose the exact address to the provider",()=>{
  const r=checkout();assert.equal(m.sectionFor(r),"pending");assert.equal(m.exactAddress(r,"provider"),undefined);assert.equal(m.exactAddress(r,"customer"),"12 Admiralty Way");
  assert.equal("address" in p.sampleParticipantView(r,"provider"),false);
  const failed=p.applySampleCommand(r,"customer",r.revision,"fail",{type:"payment",receipt:{...r.payment,status:"failed"}});
  assert.equal(m.sectionFor(failed),"pending");assert.equal(m.exactAddress(failed,"provider"),undefined);
});
check("Payment proof must match reference, booking, version, amount, currency and purpose",()=>{
  const r=checkout();for(const patch of [{reference:"other"},{bookingId:"other"},{termsVersion:2},{amount:499999},{currency:"USD"},{purpose:"balance"}]){
    assert.throws(()=>p.applySampleCommand(r,"customer",r.revision,"bad-payment",{type:"payment",receipt:{...r.payment,status:"verified",...patch}}));
    assert.equal(m.inspectionVerified({...r,payment:{...r.payment,status:"verified",...patch}}),false);
  }
  assert.equal(m.inspectionVerified({...paid(),acceptedTermsVersion:99}),false);
});
check("A confirmed inspection is Active in both modes and reveals its approved address",()=>{
  const r=paid();assert.equal(m.inspectionVerified(r),true);assert.equal(m.sectionFor(r),"active");assert.equal(m.exactAddress(r,"provider"),"12 Admiralty Way");
  for(const role of ["provider","customer"])assert.equal(m.sampleListItem(r,role).status,"Inspection scheduled");
});
check("Checkout does not allow missing addresses or duplicate pending attempts",()=>{
  const r=response();assert.throws(()=>p.applySampleCommand(r,"customer",r.revision,"blank",{type:"checkout",address:" "}));
  const pending=checkout();assert.throws(()=>p.applySampleCommand(pending,"customer",pending.revision,"repeat",{type:"checkout",address:"12 Admiralty Way"}));
});
check("Remote inspections require no residential address",()=>{
  let r={...response(),serviceMode:"remote"};r=p.applySampleCommand(r,"customer",r.revision,"remote-checkout",{type:"checkout",address:""});
  assert.equal(r.address,undefined);r=p.applySampleCommand(r,"customer",r.revision,"remote-verify",{type:"payment",receipt:{...r.payment,status:"verified"}});
  assert.equal(m.inspectionVerified(r),true);assert.equal(m.exactAddress(r,"provider"),undefined);
});
check("Pending or verified payments lock the agreed response version",()=>{
  for(const r of [checkout(),paid()])assert.throws(()=>p.applySampleCommand(r,"provider",r.revision,"changed",{type:"respond",draft:{...draft,deposit:"6000"}}));
});
check("Changing unpaid terms increments the version and clears an unsuccessful payment",()=>{
  let r=checkout();r=p.applySampleCommand(r,"customer",r.revision,"fail",{type:"payment",receipt:{...r.payment,status:"failed"}});
  r=p.applySampleCommand(r,"provider",r.revision,"new-response",{type:"respond",draft:{...draft,deposit:"6000"}});
  assert.equal(r.terms.version,2);assert.equal(r.payment,undefined);assert.equal(r.address,undefined);assert.equal(r.acceptedTermsVersion,undefined);
});
check("Stored command retries are idempotent; stale revisions cannot overwrite changes",()=>{
  const r=response();assert.equal(p.applySampleCommand(r,"provider",0,"response",{type:"respond",draft}),r);
  assert.throws(()=>p.applySampleCommand(r,"customer",0,"response",{type:"respond",draft}));
  assert.throws(()=>p.applySampleCommand(r,"provider",0,"another-response",{type:"respond",draft}));assert.equal(r.events.length,1);
});
check("Inspection completion requires verified payment and saved findings, with no work completion",()=>{
  const command={type:"complete_inspection",findings:"Replace the trap and connector seal, then test for leaks."};
  const r=checkout();assert.throws(()=>p.applySampleCommand(r,"provider",r.revision,"early",command));
  const b=paid();assert.throws(()=>p.applySampleCommand(b,"provider",b.revision,"blank-findings",{...command,findings:" "}));
  const next=p.applySampleCommand(b,"provider",b.revision,"complete",command);assert.equal(next.stage,"inspection_complete");assert.equal(next.findings,command.findings);assert.equal(m.statusFor(next),"Awaiting final quote");assert.equal(m.sectionFor(next),"active");
});
check("Unpaid cancellation/decline requires reason and never implies a paid refund",()=>{
  const r=response();assert.throws(()=>p.applySampleCommand(r,"customer",r.revision,"blank-reason",{type:"cancel_request",reason:""}));
  const cancelled=p.applySampleCommand(r,"provider",r.revision,"decline",{type:"cancel_request",reason:"Unavailable on this date"});assert.equal(m.sectionFor(cancelled),"cancelled");assert.equal(cancelled.payment,undefined);
  for(const b of [checkout(),paid()])assert.throws(()=>p.applySampleCommand(b,"customer",b.revision,"cancel-paid",{type:"cancel_request",reason:"Changed plans"}));
});
check("Sample messages are participant-tagged, bounded and durable in the same record",()=>{
  const r=response(),text="x".repeat(1000);const next=p.applySampleCommand(r,"provider",r.revision,"message-1",{type:"message",text});assert.equal(next.messages[0].sender,"provider");assert.equal(next.messages[0].text.length,1000);assert.equal(next.stage,r.stage);assert.throws(()=>p.applySampleCommand(r,"provider",r.revision,"too-long",{type:"message",text:"x".repeat(1001)}));
});
check("Legacy pending does not become a new unpaid request or expose notes as an address",()=>{
  const r=m.legacyListItem({id:"old",status:"pending",description:"Private notes",listing:{title:"Old repair"}},"customer");assert.equal(r.section,"active");assert.equal(r.status,"Existing booking");assert.equal(r.legacy,true);assert.equal("address" in r,false);
});
check("Sample fee displays net deposit while retaining the full gross customer credit",()=>{
  assert.deepEqual(p.sampleDepositBreakdown(500000),{fee:25000,net:475000});assert.equal(p.sampleDepositBreakdown(100000000).fee,2000000);assert.equal(paid().terms.deposit,500000);
});
console.log("\nInspection regression checks passed: "+count+".");

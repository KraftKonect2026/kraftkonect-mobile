const assert=require("node:assert/strict"),load=require("./load-typescript.cjs");
const m=load("lib/bookings/model.ts"),q=load("lib/bookings/quotes.ts"),p=load("lib/preview/inspectionModel.ts"),s=load("lib/preview/quoteModel.ts"),d=load("lib/discovery/model.ts");
let count=0;function check(name,fn){fn();count++;console.log("PASS "+name);}
const date=d.localDate(d.addDays(new Date(),1)),workDate=d.localDate(d.addDays(new Date(),2));
const draft={scope:"Replace the trap and connector seal, then test for leaks.",materials:"45000",labour:"45000",date:workDate,time:"14:00",duration:"3 hours"};
function inspected(){let r=p.sampleInspection();r=s.applyBookingCommand(r,"provider",r.revision,"response",{type:"respond",draft:{minimum:"85000",maximum:"110000",deposit:"5000",date,time:"10:00"}});r=s.applyBookingCommand(r,"customer",r.revision,"deposit-checkout",{type:"checkout",address:"12 Admiralty Way"});r=s.applyBookingCommand(r,"customer",r.revision,"deposit-proof",{type:"payment",receipt:{...r.payment,status:"verified"}});return s.applyBookingCommand(r,"provider",r.revision,"findings",{type:"complete_inspection",findings:draft.scope});}
function quoted(){const r=inspected();return s.applyBookingCommand(r,"provider",r.revision,"quote",{type:"send_quote",draft});}
function accepted(){const r=quoted();return s.applyBookingCommand(r,"customer",r.revision,"accept",{type:"accept_quote",version:1});}
function pending(){const r=accepted();return s.applyBookingCommand(r,"customer",r.revision,"balance-checkout",{type:"balance_checkout",version:1});}
function paid(){const r=pending();return s.applyBookingCommand(r,"customer",r.revision,"balance-proof",{type:"balance_payment",receipt:{...r.balancePayment,status:"verified"}});}
check("Final quote requires a completed verified inspection and coherent scope/date/costs",()=>{
  assert.ok(q.quoteError(p.sampleInspection(),draft));assert.equal(q.quoteError(inspected(),draft),null);
  for(const patch of [{scope:" "},{materials:"-1"},{labour:"1e4"},{date:"2000-01-01"},{time:"24:00"},{duration:""},{materials:"0",labour:"4000"}])assert.ok(q.quoteError(inspected(),{...draft,...patch}));
});
check("Gross deposit credit is deducted exactly once from materials plus labour",()=>{
  const r=quoted();assert.equal(r.quote.total,9000000);assert.equal(r.quote.depositCredit,500000);assert.equal(r.quote.remaining,8500000);assert.equal(r.quote.currency,"NGN");
});
check("Whole-job and remaining-payment fee scopes reconcile",()=>{
  assert.deepEqual(s.sampleQuoteBreakdown(9000000,500000),{total:9000000,deposit:500000,remaining:8500000,fee:450000,net:8550000,depositFee:25000,depositNet:475000,balanceFee:425000,balanceNet:8075000});
});
check("Deposit and balance share one fee cap, including a cap reached by the deposit",()=>{
  for(const [total,deposit] of [[50000000,500000],[100000000,30000000],[50000000,40000000]]){const r=s.sampleQuoteBreakdown(total,deposit);assert.equal(r.fee,2000000);assert.equal(r.depositFee+r.balanceFee,r.fee);assert.equal(r.depositNet+r.balanceNet,r.net);assert.equal(r.net,total-2000000);}
  assert.equal(s.sampleQuoteBreakdown(50000000,40000000).balanceFee,0);
});
check("Fee arithmetic rejects invalid minor units and a deposit above the final quote",()=>{
  for(const [total,deposit] of [[NaN,0],[900,1000],[1000,-1],[1.5,0],[Number.MAX_SAFE_INTEGER+1,0]])assert.throws(()=>s.sampleQuoteBreakdown(total,deposit));
});
check("Participants cannot send, accept or pay on the other's behalf",()=>{
  let r=inspected();assert.throws(()=>s.applyBookingCommand(r,"customer",r.revision,"bad-quote",{type:"send_quote",draft}));r=quoted();assert.throws(()=>s.applyBookingCommand(r,"provider",r.revision,"bad-accept",{type:"accept_quote",version:1}));r=accepted();assert.throws(()=>s.applyBookingCommand(r,"provider",r.revision,"bad-checkout",{type:"balance_checkout",version:1}));
});
check("Accepted terms are a frozen snapshot and cannot be overwritten by a replacement quote",()=>{
  const r=accepted();assert.notEqual(r.quote,r.acceptedQuote);assert.deepEqual(r.quote,r.acceptedQuote);assert.throws(()=>s.applyBookingCommand(r,"provider",r.revision,"replacement",{type:"send_quote",draft:{...draft,labour:"50000"}}));
});
check("Quote versions and current review are mandatory for acceptance/checkout",()=>{
  const r=quoted();assert.throws(()=>s.applyBookingCommand(r,"customer",r.revision,"stale-accept",{type:"accept_quote",version:99}));assert.throws(()=>s.applyBookingCommand(r,"customer",r.revision,"unaccepted-pay",{type:"balance_checkout",version:1}));const a=accepted();assert.throws(()=>s.applyBookingCommand(a,"customer",a.revision,"stale-pay",{type:"balance_checkout",version:99}));
});
check("Pending balance never books repair work or material release",()=>{
  const r=pending();assert.equal(q.balanceVerified(r),false);assert.equal(r.stage,"quote_sent");assert.equal(m.statusFor(r),"Balance payment pending");assert.equal(r.ledger,undefined);assert.throws(()=>s.applyBookingCommand(r,"customer",r.revision,"duplicate-checkout",{type:"balance_checkout",version:1}));
});
check("Verified balance receipt matches purpose, amount, currency, booking, version and reference",()=>{
  const r=pending();for(const patch of [{purpose:"inspection"},{amount:1},{currency:"USD"},{bookingId:"other"},{quoteVersion:99},{reference:"other"}]){assert.throws(()=>s.applyBookingCommand(r,"customer",r.revision,"bad-proof",{type:"balance_payment",receipt:{...r.balancePayment,status:"verified",...patch}}));assert.equal(q.balanceVerified({...r,balancePayment:{...r.balancePayment,status:"verified",...patch}}),false);}
});
check("Unsuccessful balance can retry without another deposit credit or fee cap",()=>{
  let r=pending();r=s.applyBookingCommand(r,"customer",r.revision,"fail",{type:"balance_payment",receipt:{...r.balancePayment,status:"failed"}});assert.equal(m.statusFor(r),"Balance payment unsuccessful");r=s.applyBookingCommand(r,"customer",r.revision,"retry",{type:"balance_checkout",version:1});assert.equal(r.balancePayment.amount,8500000);assert.equal(r.quote.depositCredit,500000);assert.equal(q.balanceVerified(r),false);
});
check("Repair confirmation follows explicit verified payment, not acceptance or elapsed time",()=>{
  const r=paid();assert.equal(q.balanceVerified(r),true);assert.equal(r.stage,"work_scheduled");assert.equal(m.statusFor(r),"Work scheduled");assert.equal(m.sectionFor(r),"active");assert.equal(r.ledger,undefined);
  for(const role of ["customer","provider"])assert.ok(m.sampleListItem(r,role).date.includes(d.dateLabel(workDate)));
});
check("Ledger snapshots must belong to the paid booking and conserve the provider entitlement",()=>{
  const r=paid(),ledger=s.canonicalSampleLedger(r);assert.ok(ledger);assert.equal(q.ledgerError(r,ledger),null);
  for(const patch of [{bookingId:"other"},{quoteVersion:99},{depositReference:"other"},{balanceReference:"other"},{fee:2000000},{materialsNet:9000000},{materialsReleased:9000000},{gross:8500000},{labourReleased:-1},{labourReleased:4275000}])assert.ok(q.ledgerError(r,{...ledger,...patch}));
  assert.ok(q.ledgerError(pending(),ledger));
});
check("Material credit and pending labour are distinct; allocating or crediting does not assess another fee",()=>{
  let r=paid();r=s.applyBookingCommand(r,"customer",r.revision,"ledger",{type:"ledger_snapshot",ledger:s.canonicalSampleLedger(r)});assert.equal(r.ledger.materialsReleased,4275000);assert.equal(r.ledger.labourReleased,0);assert.equal(r.ledger.materialsNet+r.ledger.labourNet,r.ledger.net);assert.equal(r.ledger.fee,450000);
});
check("Processing release is not available credit; noncanonical quotes do not invent an allocation",()=>{
  const r=paid(),ledger=s.canonicalSampleLedger(r,"processing");assert.equal(ledger.status,"processing");assert.equal(ledger.materialsReleased,0);
  const changed={...r,quote:{...r.quote,materials:4000000,labour:5000000},acceptedQuote:{...r.acceptedQuote,materials:4000000,labour:5000000}};assert.equal(s.canonicalSampleLedger(changed),null);
});
check("Quote and payment retries are idempotent, with stale revisions rejected",()=>{
  const r=quoted();assert.equal(s.applyBookingCommand(r,"provider",0,"quote",{type:"send_quote",draft}),r);assert.throws(()=>s.applyBookingCommand(r,"customer",0,"accept-stale-revision",{type:"accept_quote",version:1}));
  const b=paid();assert.equal(s.applyBookingCommand(b,"customer",0,"balance-proof",{type:"balance_payment",receipt:{...b.balancePayment,status:"verified"}}),b);
});
check("A deposit-covered quote still requires explicit booking confirmation and no additional charge",()=>{
  let r=inspected();r=s.applyBookingCommand(r,"provider",r.revision,"zero-quote",{type:"send_quote",draft:{...draft,materials:"0",labour:"5000"}});assert.equal(r.quote.remaining,0);r=s.applyBookingCommand(r,"customer",r.revision,"zero-accept",{type:"accept_quote",version:1});assert.equal(q.balanceVerified(r),false);r=s.applyBookingCommand(r,"customer",r.revision,"zero-checkout",{type:"balance_checkout",version:1});assert.equal(r.balancePayment.amount,0);assert.equal(q.balanceVerified(r),false);
});
console.log("\nQuote/payment regression checks passed: "+count+".");

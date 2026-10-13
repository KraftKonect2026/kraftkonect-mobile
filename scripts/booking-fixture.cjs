const load=require('./load-typescript.cjs');
const m=load('lib/bookings/model.ts'),p=load('lib/preview/inspectionModel.ts'),q=load('lib/preview/quoteModel.ts'),w=load('lib/preview/workModel.ts'),d=load('lib/discovery/model.ts');
function fixture({withdrawn=0,reserved=0,wallet=true}={}){
  let r=p.sampleInspection();const run=(role,key,c)=>r=w.applyWorkCommand(r,role,r.revision,key,c);
  run('provider','response',{type:'respond',draft:{minimum:'85000',maximum:'110000',deposit:'5000',date:d.localDate(d.addDays(new Date(),1)),time:'10:00'}});
  run('customer','checkout',{type:'checkout',address:'12 Admiralty Way'});run('customer','deposit',{type:'payment',receipt:{...r.payment,status:'verified'}});
  run('provider','findings',{type:'complete_inspection',findings:'Replace the trap and connector seal, then test for leaks.'});
  run('provider','quote',{type:'send_quote',draft:{scope:r.findings,materials:'45000',labour:'45000',date:d.localDate(d.addDays(new Date(),2)),time:'14:00',duration:'3 hours'}});
  run('customer','accept',{type:'accept_quote',version:1});run('customer','balance-checkout',{type:'balance_checkout',version:1});run('customer','balance',{type:'balance_payment',receipt:{...r.balancePayment,status:'verified'}});
  run('customer','ledger',{type:'ledger_snapshot',ledger:q.canonicalSampleLedger(r)});if(wallet)run('provider','wallet',{type:'wallet_snapshot',wallet:w.canonicalSampleWallet(r,withdrawn,reserved)});return r;
}
module.exports={fixture,load,m,w,d};

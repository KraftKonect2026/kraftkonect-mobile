const assert=require('node:assert/strict');
const {load,fixture}=require('./booking-fixture.cjs');
const m=load('lib/messaging/accountSupport.ts'),a=load('lib/account/model.ts');
let count=0;const check=(name,run)=>{run();count++;console.log('PASS '+name);};
const now='2026-10-12T20:00:00.000Z';
const send=(r,key,text='A question about my account',extra={})=>m.applyAccountSupportCommand(r,a.sampleAccountId,r.revision,key,{type:'message',conversationId:r.id,text,at:now,...extra});
const read=(r,key,throughId,bySupport=false)=>m.applyAccountSupportCommand(r,a.sampleAccountId,r.revision,key,{type:'read',conversationId:r.id,throughId,bySupport});
check('The same support thread and own bubbles follow one identity across both modes',()=>{
 const r=send(m.sampleAccountSupport(),'sample-message');const customer=m.accountSupportConversation(r,a.sampleAccountId,'customer'),provider=m.accountSupportConversation(r,a.sampleAccountId,'provider');
 assert.equal(customer.id,provider.id);assert.equal(customer.accountId,provider.accountId);assert.equal(customer.messages[0].sender,'customer');assert.equal(provider.messages[0].sender,'provider');assert.equal(customer.bookingId,undefined);
});
check('Owner and conversation checks happen before an idempotent retry',()=>{
 const r=send(m.sampleAccountSupport(),'sample-message');const command={type:'message',conversationId:r.id,text:'Hello',at:now};
 assert.throws(()=>m.applyAccountSupportCommand(r,'foreign',0,'sample-message',command));assert.throws(()=>m.applyAccountSupportCommand(r,a.sampleAccountId,0,'sample-message',{...command,conversationId:'foreign'}));
 assert.equal(m.applyAccountSupportCommand(r,a.sampleAccountId,0,'sample-message',command),r);
});
check('Stale edits and duplicate sends cannot overwrite or duplicate a support message',()=>{
 const before=m.sampleAccountSupport(),r=send(before,'sample-message');assert.throws(()=>m.applyAccountSupportCommand(r,a.sampleAccountId,before.revision,'sample-another',{type:'message',conversationId:r.id,text:'Hello',at:now}));
 assert.equal(send(r,'sample-message').messages.length,1);assert.equal(before.messages.length,0);
});
check('Blank, oversized and undated submissions reject without changing history',()=>{
 const r=m.sampleAccountSupport();for(const extra of [{text:''},{text:'x'.repeat(1001)},{at:'invalid'}])assert.throws(()=>send(r,'sample-message','Hello',extra));assert.equal(r.messages.length,0);
});
check('Photos bind the stable owner and conversation, rather than the current mode',()=>{
 const r=m.sampleAccountSupport(),photo={id:'sample-photo-1',ownerId:a.sampleAccountId,conversationId:r.id,name:'sample.png',uri:'sample://photo',mime:'image/png',status:'ready'};
 const next=send(r,'sample-photo-message','',{attachments:[photo]});assert.equal(m.accountSupportConversation(next,a.sampleAccountId,'provider').messages[0].attachments[0].owner,'provider');
 for(const patch of [{ownerId:'foreign'},{conversationId:'booking-thread'},{uri:'file:///personal.jpg'},{status:'uploading'}])assert.throws(()=>send(r,'sample-bad','',{attachments:[{...photo,...patch}]}));
 assert.throws(()=>send(r,'sample-duplicate-photo','',{attachments:[photo,photo]}));
});
check('Unread and read markers persist across both modes and cannot move backwards',()=>{
 let r=send(m.sampleAccountSupport(),'sample-own');r=send(r,'sample-reply','A support reply',{incoming:true});
 assert.equal(m.accountSupportConversation(r,a.sampleAccountId,'customer').unread,1);assert.equal(m.accountSupportConversation(r,a.sampleAccountId,'provider').unread,1);
 r=read(r,'sample-read','sample-reply');r=read(r,'sample-old-read','sample-own');assert.equal(r.readThrough,'sample-reply');assert.equal(m.accountSupportConversation(r,a.sampleAccountId,'provider').unread,0);assert.throws(()=>read(r,'sample-unknown','missing'));
});
check('Sending and receiving do not invent a support Read acknowledgement',()=>{
 let r=send(m.sampleAccountSupport(),'sample-own');assert.equal(m.supportReadMessage(r,a.sampleAccountId,'sample-own'),false);
 r=send(r,'sample-reply','A support reply',{incoming:true});assert.equal(m.supportReadMessage(r,a.sampleAccountId,'sample-own'),false);
 r=read(r,'sample-support-read','sample-own',true);assert.equal(m.supportReadMessage(r,a.sampleAccountId,'sample-own'),true);assert.throws(()=>m.supportReadMessage(r,'foreign','sample-own'));
});
check('Support projection never includes another owner or unrelated booking data',()=>{
 const r=m.sampleAccountSupport();assert.throws(()=>m.accountSupportConversation(r,'foreign','customer'));assert.throws(()=>m.accountSupportConversation({...r,ownerId:'foreign'},a.sampleAccountId,'customer'));
 const booking=fixture(),before=JSON.stringify(booking);send(r,'sample-message');assert.equal(JSON.stringify(booking),before);
});
check('An explicitly simulated reply stays distinct from the account sender and has a real saved date',()=>{
 const r=send(m.sampleAccountSupport(),'sample-reply','A support reply',{incoming:true}),row=m.accountSupportConversation(r,a.sampleAccountId,'provider');
 assert.equal(row.messages[0].sender,'support');assert.equal(row.last.at,now);assert.equal(row.support,true);assert.equal(row.generalSupport,true);
});
check('Restorable drafts keep an idempotency key and whitelist only supported public photo fields',()=>{
 const photo={id:'sample-photo-1',ownerId:a.sampleAccountId,conversationId:m.accountSupportId,name:'sample.png',uri:'sample://photo',mime:'image/png',status:'ready',privateBytes:'must not persist'};
 const draft=m.accountSupportDraft('Hello',photo,'sample-send-intent');assert.equal(draft.intentKey,'sample-send-intent');assert.equal(draft.photo.privateBytes,undefined);assert.throws(()=>m.accountSupportDraft('Hello',photo,'external-key'));assert.throws(()=>m.accountSupportDraft('Hello',{...photo,uri:'file:///private.jpg'}));
});
console.log(count+' shared account support checks passed.');

import { BookingLedger, BookingRecord, BookingRole, completedByCustomer, balanceVerified, inspectionVerified, RepaymentRecord, WalletSnapshot } from "@/lib/bookings/model";
import { casesFor, dateProposalError, refundableExposure, reportError, reviewError, walletSnapshotError } from "@/lib/bookings/work";
import { applyBookingCommand, BookingCommand } from "./quoteModel";
import { messageError, SamplePhotoAttachment } from "@/lib/messaging/model";

export type WorkCommand=
 | {type:"propose_date";purpose:"inspection"|"work";date:string;time:string}
 | {type:"respond_date";proposalId:string;version:number;accept:boolean}
 | {type:"start_work"}|{type:"finish_work"}|{type:"confirm_work";workEventId:string}
 | {type:"cancel_paid";reason:string}
 | {type:"wallet_snapshot";wallet:WalletSnapshot}
 | {type:"sample_wallet_credit";amount:number}
 | {type:"authorize_repayment"}
 | {type:"recover_materials";amount:number;method:"balance"|"automatic";authorizationReference?:string;now?:string}
 | {type:"repayment_checkout"}
 | {type:"repayment_result";receipt:NonNullable<RepaymentRecord["payment"]>}
 | {type:"refund_update";refundId:string;status:"approved"|"processing"|"paid"|"failed";amount:number;reference?:string}
 | {type:"submit_review"|"edit_review";rating:number;text:string}|{type:"delete_review";reviewId:string}
 | {type:"report";category:string;description:string;when:string;help:string;photo?:{id:string;name:string;uri:string}}
 | {type:"case_update";caseId:string;status:"under_review"|"resolved";outcome?:string}
 | {type:"case_message";caseId:string;text:string;incoming?:boolean;attachments?:SamplePhotoAttachment[]}
 | {type:"mark_case_read";caseId:string;throughId:string};
export type WorkBookingCommand=BookingCommand|WorkCommand;
const workTypes=new Set(["propose_date","respond_date","start_work","finish_work","confirm_work","cancel_paid","wallet_snapshot","sample_wallet_credit","authorize_repayment","recover_materials","repayment_checkout","repayment_result","refund_update","submit_review","edit_review","delete_review","report","case_update","case_message","mark_case_read"]);
const providerTypes=new Set(["propose_date","start_work","finish_work","wallet_snapshot","sample_wallet_credit","authorize_repayment","recover_materials","repayment_checkout","repayment_result"]);
const customerTypes=new Set(["respond_date","confirm_work","refund_update","submit_review","edit_review","delete_review"]);
const positive=(a:number)=>Number.isSafeInteger(a)&&a>0;
export function applyWorkCommand(record:BookingRecord,role:BookingRole,revision:number,key:string,command:WorkBookingCommand):BookingRecord {
  if(!workTypes.has(command.type))return applyBookingCommand(record,role,revision,key,command as BookingCommand);
  const c=command as WorkCommand;
  if(c.type==="mark_case_read"){
    if(record.source!=="sample"||!key.trim()||(role!=="customer"&&role!=="provider"))throw new Error("An owning sample participant is required.");
    const sc=casesFor(record,role).find(v=>v.id===c.caseId);if(!sc)throw new Error("This case belongs to another reporter.");
    if(record.commands.includes(key))return record;
    if(record.revision!==revision)throw new Error("This booking changed. Refresh before retrying.");
    const target=sc.messages.findIndex(m=>m.id===c.throughId),current=sc.messages.findIndex(m=>m.id===sc.readThrough);
    if(target<0||target<current)throw new Error("Review the current conversation before marking it read.");
    return {...record,revision:record.revision+1,commands:[...record.commands,key],events:[...record.events,{id:key,type:c.type,revision:record.revision+1}],supportCases:record.supportCases!.map(v=>v.id===sc.id?{...v,readThrough:c.throughId}:v)};
  }
  if(record.source!=="sample"||!key.trim())throw new Error("Only a keyed local sample event can use this simulator.");
  if(providerTypes.has(c.type)&&role!=="provider"||customerTypes.has(c.type)&&role!=="customer")throw new Error("This action belongs to the other participant.");
  if("caseId" in c&&!casesFor(record,role).some(v=>v.id===c.caseId))throw new Error("This support case belongs to another reporter.");
  if(record.commands.includes(key))return record;
  if(record.revision!==revision)throw new Error("This booking changed. Refresh before retrying.");
  const next:BookingRecord=JSON.parse(JSON.stringify(record));const at=new Date().toISOString();
  if(c.type==="propose_date"){
    const error=dateProposalError(record,c.date,c.time,c.purpose);if(error)throw new Error(error);
    next.dateProposal={id:key,version:(record.dateProposal?.version??0)+1,date:c.date,time:c.time,purpose:c.purpose,status:"proposed",by:role};
  }else if(c.type==="respond_date"){
    if(typeof c.accept!=="boolean")throw new Error("Accept or decline the proposal explicitly.");
    const p=record.dateProposal;if(!p||p.status!=="proposed"||p.id!==c.proposalId||p.version!==c.version)throw new Error("Review the current date proposal.");
    const error=dateProposalError(record,p.date,p.time,p.purpose);if(error)throw new Error(error);
    next.dateProposal={...p,status:c.accept?"accepted":"declined"};if(c.accept){if(p.purpose==="work")next.workAppointment={date:p.date,time:p.time};else next.inspectionAppointment={date:p.date,time:p.time};}
  }else if(["start_work","finish_work","confirm_work"].includes(c.type)){
    if(record.cancelled||!balanceVerified(record))throw new Error("Confirmed paid work is required.");
    if(c.type==="start_work"){if(record.stage!=="work_scheduled")throw new Error("Work has already started or ended.");next.stage="work_in_progress";next.workStartedAt=at;}
    else if(c.type==="finish_work"){if(!["work_scheduled","work_in_progress"].includes(record.stage))throw new Error("Only active work can be marked ready for review.");next.stage="work_review";next.workFinishedAt=at;next.workFinishedEventId=key;}
    else if(c.type==="confirm_work"){if(record.stage!=="work_review"||!record.workFinishedEventId||c.workEventId!==record.workFinishedEventId)throw new Error("Review the provider’s saved completion before confirming.");next.stage="completed";next.completion={id:key,customerId:record.customerId,workEventId:c.workEventId,quoteVersion:record.acceptedQuote!.version,at};}
  }else if(c.type==="wallet_snapshot"){
    if(record.finance?.payouts.length||record.finance?.postings.length)throw new Error("A wallet with postings or reservations needs a reconciled event, not an initial snapshot.");
    if(record.cancelled&&record.repayment?.status!=="awaiting_wallet")throw new Error("A cancellation's recovered balance cannot be overwritten.");const error=walletSnapshotError(record,c.wallet);if(error)throw new Error(error);next.wallet={...c.wallet};
    if(record.cancelled&&next.repayment){const recovered=Math.min(next.wallet.materialAvailable,next.repayment.outstanding);next.wallet.available-=recovered;next.wallet.materialAvailable-=recovered;next.repayment.recovered+=recovered;next.repayment.outstanding-=recovered;next.repayment.status=next.repayment.outstanding?"due":"settled";}
  }else if(c.type==="sample_wallet_credit"){
    if(!record.wallet||!positive(c.amount)||!Number.isSafeInteger(record.wallet.available+c.amount))throw new Error("A matching sample wallet and positive credit are required.");next.wallet!.available+=c.amount;
  }else if(c.type==="cancel_paid"){
    if(record.cancelled||record.stage==="completed"||!inspectionVerified(record))throw new Error("This booking cannot be cancelled through the paid-booking flow.");
    if(record.balancePayment?.status==="pending")throw new Error("The balance payment is pending. Verify its result before reviewing cancellation.");
    if(c.reason.trim().length<3||c.reason.length>500)throw new Error("Choose a cancellation reason or tell us why.");
    next.cancelled={by:role,reason:c.reason.trim()};next.refund={id:"sample-refund-"+key,bookingId:record.id,currency:"NGN",exposure:refundableExposure(record),status:"in_review"};
    const due=record.ledger?.materialsReleased??0;
    if(due){const recover=Math.min(record.wallet?.materialAvailable??0,record.wallet?.available??0,due);if(next.wallet){next.wallet.available-=recover;next.wallet.materialAvailable-=recover;}
      next.repayment={id:"sample-repayment-"+key,bookingId:record.id,ledgerId:record.ledger!.id,currency:"NGN",due,recovered:recover,outstanding:due-recover,status:!record.wallet?"awaiting_wallet":due===recover?"settled":"due",deadline:due>recover?new Date(Date.now()+86400000).toISOString():undefined};}
  }else if(["authorize_repayment","recover_materials","repayment_checkout","repayment_result"].includes(c.type)){
    const debt=record.repayment;if(!record.cancelled||!debt||debt.outstanding<=0)throw new Error("No unpaid materials obligation remains.");
    if(c.type==="authorize_repayment"){next.repayment!.authorizationReference=key;}
    else if(c.type==="recover_materials"){
      if(c.method!=="balance"&&c.method!=="automatic")throw new Error("Unknown recovery method.");
      if(!record.wallet||!positive(c.amount)||c.amount>debt.outstanding||c.amount>record.wallet.available)throw new Error("This amount exceeds the spendable balance or unpaid obligation.");
      if(debt.payment?.status==="pending")throw new Error("A repayment is pending. Check it before another deduction.");
      if(c.method==="balance"&&(!c.authorizationReference||c.authorizationReference!==debt.authorizationReference))throw new Error("Verified provider authorization is required.");
      if(c.method==="automatic"&&(!debt.deadline||!c.now||!Number.isFinite(Date.parse(c.now))||Date.parse(c.now)<Date.parse(debt.deadline)))throw new Error("Automatic recovery requires the stored notice deadline to have passed.");
      next.wallet!.available-=c.amount;next.repayment!.recovered+=c.amount;next.repayment!.outstanding-=c.amount;next.repayment!.status=next.repayment!.outstanding?"due":"settled";delete next.repayment!.authorizationReference;
    }else if(c.type==="repayment_checkout"){
      if(debt.payment?.status==="pending")throw new Error("A repayment checkout is already pending.");next.repayment!.payment={reference:"sample-repayment-"+key,bookingId:record.id,obligationId:debt.id,purpose:"repayment",currency:"NGN",amount:debt.outstanding,status:"pending"};
    }else if(c.type==="repayment_result"){
      const p=debt.payment,r=c.receipt;if(!p||p.status!=="pending"||!["pending","failed","verified"].includes(r.status)||(["reference","bookingId","obligationId","purpose","currency","amount"] as const).some(k=>p[k]!==r[k])||r.amount>debt.outstanding)throw new Error("This receipt does not match the unpaid obligation.");
      next.repayment!.payment={...p,status:r.status};if(r.status==="verified"){next.repayment!.recovered+=r.amount;next.repayment!.outstanding-=r.amount;next.repayment!.status=next.repayment!.outstanding?"due":"settled";}
      else if(r.status==="failed"&&next.wallet){const recovered=Math.min(next.wallet.materialAvailable,next.wallet.available,next.repayment!.outstanding);next.wallet.available-=recovered;next.wallet.materialAvailable-=recovered;next.repayment!.recovered+=recovered;next.repayment!.outstanding-=recovered;next.repayment!.status=next.repayment!.outstanding?"due":"settled";}
    }
  }else if(c.type==="refund_update"){
    const f=record.refund;if(!record.cancelled||!f||f.id!==c.refundId||!Number.isSafeInteger(c.amount)||c.amount<0||c.amount>f.exposure)throw new Error("The refund decision does not match the cancelled booking.");
    if(c.status==="approved"){if(f.status!=="in_review")throw new Error("The refund decision is already recorded.");}
    else{if(f.amount!==c.amount||!c.reference?.trim()||!["approved","processing","failed"].includes(f.status))throw new Error("A matching approved refund and processing reference are required.");if(c.status==="paid"&&f.status!=="processing")throw new Error("A refund is paid only after matching processing confirmation.");if(f.reference&&f.reference!==c.reference)throw new Error("The refund reference changed.");}
    next.refund={...f,amount:c.amount,status:c.status,reference:c.reference??f.reference};
  }else if(c.type==="submit_review"||c.type==="edit_review"){
    const error=reviewError(record,c.rating,c.text);if(error)throw new Error(error);
    if(c.type==="submit_review"&&record.review||c.type==="edit_review"&&!record.review)throw new Error("Use the existing review entry for this booking.");
    next.review={id:record.review?.id??key,bookingId:record.id,customerId:record.customerId,rating:c.rating,text:c.text.trim(),updatedAt:at};
  }else if(c.type==="delete_review"){
    if(!completedByCustomer(record)||!record.review||record.review.id!==c.reviewId)throw new Error("This review does not belong to the completed customer booking.");delete next.review;
  }else if(c.type==="report"){
    const error=reportError(c.category,c.description,c.when,c.help);if(error)throw new Error(error);
    if(c.photo&&(!c.photo.id.startsWith("sample-")||!c.photo.uri||c.photo.name.length>160))throw new Error("Only an explicit sample evidence reference can enter this preview.");
    next.supportCases=[...(record.supportCases??[]),{id:"sample-case-"+key,reference:"SAMPLE-ISS-"+String((record.supportCases?.length??0)+1).padStart(4,"0"),bookingId:record.id,reporter:role,category:c.category.trim(),description:c.description.trim(),when:c.when.trim(),help:c.help.trim(),photo:c.photo,status:"received",messages:[]}];
  }else if(c.type==="case_update"){
    const sc=next.supportCases!.find(v=>v.id===c.caseId)!;if(sc.status==="resolved")throw new Error("This case already has a saved outcome.");if(c.status==="resolved"&&(!c.outcome?.trim()||c.outcome.length>2000))throw new Error("A support outcome is required.");sc.status=c.status;sc.outcome=c.outcome?.trim();
  }else if(c.type==="case_message"){
    const error=messageError(record,role,c.text,c.attachments,c.caseId);if(error)throw new Error(error);
    if(c.incoming&&c.attachments?.length)throw new Error("Only the reporter's explicit sample photos are supported.");
    next.supportCases!.find(v=>v.id===c.caseId)!.messages.push({id:key,sender:c.incoming?"support":"reporter",text:c.text.trim(),at,attachments:c.attachments?.map(a=>({...a}))});
  }
  next.revision++;next.commands.push(key);next.events.push({id:key,type:c.type,revision:next.revision});return next;
}
export function canonicalSampleWallet(record:BookingRecord,withdrawn=0,reserved=0):WalletSnapshot|null {
  const l=record.ledger;if(!l||l.status!=="credited"||withdrawn+reserved>l.materialsReleased||withdrawn<0||reserved<0)return null;
  return {id:"sample-wallet-"+l.id,bookingId:record.id,ledgerId:l.id,providerId:record.providerId,currency:"NGN",available:l.materialsReleased-withdrawn-reserved,reserved,materialAvailable:l.materialsReleased-withdrawn-reserved,materialReserved:reserved,materialWithdrawn:withdrawn};
}
export function completedSampleLedger(record:BookingRecord,credited=false):BookingLedger|null {
  if(!completedByCustomer(record)||!record.ledger)return null;
  return {...record.ledger,labourReleaseStatus:credited?"credited":"processing",labourReleased:credited?record.ledger.labourNet:record.ledger.labourReleased,labourCreditedAt:credited?(record.ledger.labourCreditedAt??new Date().toISOString()):record.ledger.labourCreditedAt};
}

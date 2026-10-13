import { BookingRecord, completedByCustomer } from "@/lib/bookings/model";
import { Provider, Review } from "@/lib/discovery/model";
/** Only the complete fictional review list is used here; live API snippets are never re-aggregated. */
export function withSampleReview(provider:Provider,record?:BookingRecord):Provider {
  if(!record||record.source!=="sample"||record.providerId!==provider.id||!completedByCustomer(record))return provider;
  const baseline=(provider.reviews??[]).filter(r=>r.id!==record.review?.id),review=record.review;
  const reviews:Review[]=review?[{id:review.id,userName:record.customerName,rating:review.rating,comment:review.text,date:review.updatedAt.slice(0,10)},...baseline]:baseline;
  const ratings=reviews.map(r=>r.rating).filter((v):v is number=>Number.isInteger(v)&&v!>=1&&v!<=5);
  return {...provider,reviews,reviewCount:ratings.length,rating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null};
}

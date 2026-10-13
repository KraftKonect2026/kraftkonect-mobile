import { Redirect, useLocalSearchParams } from "expo-router";

/** The old immediate checkout cannot represent the unpaid-request/inspection/quote sequence. */
export function LegacyCheckoutEntry({receipt=false}:{receipt?:boolean}) {
  const params=useLocalSearchParams<{providerId?:string;serviceId?:string;bookingId?:string}>();
  if(receipt&&typeof params.bookingId==="string"&&params.bookingId.trim())return <Redirect href={{pathname:"/booking-detail/[id]",params:{id:params.bookingId}}}/>;
  if(typeof params.providerId==="string"&&params.providerId.trim())return <Redirect href={{pathname:"/provider/[id]",params:{id:params.providerId,...(typeof params.serviceId==="string"?{serviceId:params.serviceId}:{})}}}/>;
  return <Redirect href="/"/>;
}

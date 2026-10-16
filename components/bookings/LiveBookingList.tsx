import { useCallback, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { BookingList } from "./BookingList";
import { BookingRole, BookingSection, legacyListItem } from "@/lib/bookings/model";
import { FlowBookingPayload, flowListItem, MY_FLOW_BOOKINGS_QUERY } from "@/lib/bookings/liveFlow";
import { useOwnedBookingsRead } from "@/lib/hooks/useOwnedBookingsRead";
import { useAppSelector } from "@/store";
export function LiveBookingList({role,initialSection="active"}:{role:BookingRole;initialSection?:BookingSection}) {
  const account=useAppSelector(s=>s.auth.user?.id);
  return <OwnedBookingList key={(account??"signed-out")+":"+role} account={account} role={role} initialSection={initialSection}/>;
}
function OwnedBookingList({account,role,initialSection}:{account?:string;role:BookingRole;initialSection:BookingSection}) {
  const router=useRouter(),[section,setSection]=useState(initialSection),data=useOwnedBookingsRead(role);
  // New request-to-payout bookings. If the server does not offer them yet, existing bookings still show.
  const flow=useQuery<{myFlowBookings:FlowBookingPayload[]}>(MY_FLOW_BOOKINGS_QUERY,{variables:{role},skip:!account,fetchPolicy:"no-cache",errorPolicy:"none",context:{accountOwnerId:account,queryDeduplication:false}});
  const refetchFlow=flow.refetch,firstFocus=useRef(true);
  // Coming back from a request's detail screen shows its new stage.
  useFocusEffect(useCallback(()=>{if(firstFocus.current){firstFocus.current=false;return;}void refetchFlow().catch(()=>undefined);},[refetchFlow]));
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  const records=data.data?.records??[];
  const flowRows=flow.error?[]:flow.data?.myFlowBookings??[];
  const flowIds=new Set(flowRows.map(f=>f.id));
  const items=[...flowRows.map(f=>flowListItem(f,role)),...records.map(r=>legacyListItem(r,role))];
  return <BookingList role={role} section={section} onSection={setSection} items={items}
    onOpen={id=>flowIds.has(id)?router.push({pathname:"/request/[id]",params:{id}}):router.push(role==="provider"?{pathname:"/provider/job/[id]",params:{id}}:{pathname:"/booking-detail/[id]",params:{id}})}
    loading={(data.loading&&!data.data)||(flow.loading&&!flow.data&&!flow.error&&!records.length)} error={data.error} onRetry={()=>{void data.refresh();void flow.refetch().catch(()=>undefined);}}
    art={item=>{const r=records.find(r=>r.id===item.id);return role==="provider"?r?.customer?.avatarUrl:r?.provider?.avatar;}}/>;
}

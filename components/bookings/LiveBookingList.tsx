import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { BookingList } from "./BookingList";
import { BookingRole, BookingSection, legacyListItem } from "@/lib/bookings/model";
import { useOwnedBookingsRead } from "@/lib/hooks/useOwnedBookingsRead";
import { useAppSelector } from "@/store";
export function LiveBookingList({role,initialSection="active"}:{role:BookingRole;initialSection?:BookingSection}) {
  const account=useAppSelector(s=>s.auth.user?.id);
  return <OwnedBookingList key={(account??"signed-out")+":"+role} role={role} initialSection={initialSection}/>;
}
function OwnedBookingList({role,initialSection}:{role:BookingRole;initialSection:BookingSection}) {
  const router=useRouter(),[section,setSection]=useState(initialSection),data=useOwnedBookingsRead(role);
  if(!data.signedIn)return <Redirect href="/sign-in"/>;
  const records=data.data?.records??[];
  return <BookingList role={role} section={section} onSection={setSection} items={records.map(r=>legacyListItem(r,role))}
    onOpen={id=>router.push(role==="provider"?{pathname:"/provider/job/[id]",params:{id}}:{pathname:"/booking-detail/[id]",params:{id}})}
    loading={data.loading&&!data.data} error={data.error} onRetry={()=>void data.refresh()}
    art={item=>{const r=records.find(r=>r.id===item.id);return role==="provider"?r?.customer?.avatarUrl:r?.provider?.avatar;}}/>;
}

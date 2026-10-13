import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { useAppSelector } from "@/store";
import { useOwnedBookingsRead } from "@/lib/hooks/useOwnedBookingsRead";
import { ownedBooking } from "@/lib/bookings/liveBookings";
import { useOpenChat } from "@/lib/useOpenChat";
import { BookingRole, legacyListItem, money } from "@/lib/bookings/model";
import { BookingFrame, bs, DetailCard, DetailRow, Heading } from "./Parts";
export function LegacyBookingDetail({role}:{role:BookingRole}){
  const account=useAppSelector(s=>s.auth.isAuthenticated&&s.auth.accessToken?s.auth.user?.id:undefined);
  if(!account)return <Redirect href="/sign-in"/>;
  return <OwnedLegacyBooking key={account+":"+role} role={role}/>;
}
function OwnedLegacyBooking({role}:{role:BookingRole}){
  const router=useRouter(),openChat=useOpenChat(),{id}=useLocalSearchParams<{id?:string}>(),data=useOwnedBookingsRead(role);
  const raw=data.data?ownedBooking(data.data,id):undefined,item=raw?legacyListItem(raw,role):undefined;
  const recipient=role==="provider"?raw?.customer?.id:raw?.provider?.user?.id;
  const bookings=()=>router.replace(role==="provider"?"/provider/jobs":"/(app)/(tabs)/bookings");
  return <BookingFrame onBack={()=>router.canGoBack()?router.back():bookings()} footer={<View style={bs.actions}>
    {raw&&recipient&&<Button title={"Message "+item!.participant.split(" ")[0]} disabled={data.loading||!!data.error} onPress={()=>void openChat(recipient)}/>}
    {role==="customer"&&raw?.status==="completed"&&<Button title="Prepare a review" variant="outline" onPress={()=>router.push({pathname:"/review/[bookingId]",params:{bookingId:raw.id}})}/>}
    {role==="customer"&&raw?.status==="completed"&&raw.provider?.id&&<Button title="Book provider again" variant="outline" onPress={()=>router.push({pathname:"/(app)/provider/[id]",params:{id:raw.provider!.id!,serviceId:raw.listing?.id??""}})}/>}
    <Button title={role==="provider"?"Back to jobs":"Back to bookings"} variant="outline" onPress={bookings}/>
  </View>}>
    <Heading title={role==="provider"?"Existing job":"Existing booking"} subtitle={item?.title}/>
    {data.error&&<><Callout title={raw?"Showing the last loaded booking":"Could not load booking"} message={data.error} tone="error"/><Button title="Try again" disabled={data.loading} onPress={()=>void data.refresh()}/></>}
    {data.loading&&!raw?<LogoLoader label="Loading booking"/>:!raw&&!data.error?<Callout title="Booking unavailable" message="This booking was not returned for the signed-in participant."/>:raw&&<>
      <DetailCard title="Saved booking details"><DetailRow label="Reference" value={raw.bookingRef??raw.id}/><DetailRow label={role==="provider"?"Customer":"Provider"} value={item!.participant}/><DetailRow label="Saved appointment" value={item!.date}/><DetailRow label="Status" value={item!.status}/><DetailRow label="Recorded amount" value={raw.totalPriceCents!==undefined&&raw.currency?raw.currency==="NGN"?money(raw.totalPriceCents):(raw.totalPriceCents/100).toLocaleString()+" "+raw.currency:"Unavailable"}/></DetailCard>
      {raw.description&&<DetailCard title="Service description"><AppText variant="body">{raw.description}</AppText></DetailCard>}
      {raw.notes&&<DetailCard title="Saved notes"><AppText variant="body">{raw.notes}</AppText></DetailCard>}
      {raw.revisionReason&&<DetailCard title="Revision request"><AppText variant="body">{raw.revisionReason}</AppText></DetailCard>}
      <Callout title="Booking updates unavailable" message="Your saved booking details are shown here. Inspection, quote, payment and completion details could not be confirmed. Booking changes and payment actions are unavailable right now; please try again later."/>
    </>}
  </BookingFrame>;
}

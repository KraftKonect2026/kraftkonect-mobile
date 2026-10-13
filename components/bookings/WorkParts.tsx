import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Icon } from "@/components/discovery/Parts";
import Colors from "@/constants/colors";
import { appointmentLabel, BookingRecord, BookingRole } from "@/lib/bookings/model";
import { currentAppointment } from "@/lib/bookings/work";
import { BookingIcon, bs, DetailCard } from "./Parts";
export function TimelineRow({title,detail,state="upcoming"}:{title:string;detail:string;state?:"done"|"current"|"upcoming"}){
  return <View style={[bs.row,{padding:12,alignItems:"flex-start",borderRadius:12,backgroundColor:state==="current"?Colors.primarySoft:undefined}]}>{state==="done"?<BookingIcon name="done"/>:state==="current"?<BookingIcon name="calendar"/>:<Image source={require("@/assets/design/2a0eb.svg")} style={{width:24,height:24}} contentFit="contain" accessible={false}/>}<View style={{flex:1,minWidth:0,gap:4}}><AppText variant="label">{title}</AppText><AppText variant="bodySmall" color={Colors.textSecondary}>{detail}</AppText></View></View>;
}
export function JobSummary({record,role,status}:{record:BookingRecord;role:BookingRole;status:string}){
  return <DetailCard quiet><AppText variant="captionRegular" color={Colors.primary}>{status.toUpperCase()}</AppText><AppText variant="labelLarge">{record.serviceTitle}</AppText><AppText variant="body" color={Colors.textSecondary}>{role==="provider"?record.customerName+" · Customer":record.providerName+" · Provider"}</AppText><AppText variant="label">{appointmentLabel(currentAppointment(record))}</AppText><AppText variant="body" color={Colors.textSecondary}>{record.serviceMode==="remote"?"Remote appointment":record.address??"Address unavailable"}</AppText><AppText variant="captionRegular" color={Colors.textSecondary}>Booking {record.id}</AppText></DetailCard>;
}
export function ReasonChoice({title,description,selected,onPress,disabled=false}:{title:string;description?:string;selected:boolean;onPress:()=>void;disabled?:boolean}){
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{checked:selected,disabled}} aria-checked={selected} disabled={disabled} onPress={onPress} style={[bs.row,{minHeight:56,paddingHorizontal:14,paddingVertical:12,borderWidth:1,borderColor:selected?Colors.primary:Colors.borderControl,borderRadius:14,backgroundColor:selected?Colors.primarySoft:Colors.surface}]}><Icon name={selected?"selected":"radio"}/><View style={{flex:1,minWidth:0,gap:4}}><AppText variant="label">{title}</AppText>{description&&<AppText variant="captionRegular" color={Colors.textSecondary}>{description}</AppText>}</View></Pressable>;
}
export function ConfirmationBlock({title,message}:{title:string;message:string}){
  return <View style={{backgroundColor:Colors.background,borderRadius:24,paddingHorizontal:20,paddingVertical:24,alignItems:"center",gap:12}}><View style={{width:64,height:64,borderRadius:999,backgroundColor:Colors.primary,alignItems:"center",justifyContent:"center"}}><Icon name="check"/></View><AppText variant="labelLarge" style={{textAlign:"center"}}>{title}</AppText><AppText variant="body" color={Colors.textSecondary} style={{textAlign:"center"}}>{message}</AppText></View>;
}
export function ReceiptAction({title,onPress}:{title:string;onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[bs.row,{minHeight:44,justifyContent:"center",gap:4}]}><AppText variant="label" color={Colors.primary} style={{textDecorationLine:"underline"}}>{title}</AppText><Image source={require("@/assets/bookings/9f924.svg")} style={{width:18,height:18}} contentFit="contain" accessible={false}/></Pressable>;}

import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import { SelectionChip } from "@/components/SelectionChip";
import { LogoLoader } from "@/components/LogoLoader";
import { PhotoSource } from "@/components/discovery/Parts";
import Colors from "@/constants/colors";
import { BookingListItem, BookingRole, BookingSection } from "@/lib/bookings/model";
import { BookingIcon, Heading } from "./Parts";

export function BookingList({role,section,onSection,items,onOpen,loading,error,onRetry,preview=false,art}:{role:BookingRole;section:BookingSection;onSection:(s:BookingSection)=>void;items:BookingListItem[];onOpen:(id:string)=>void;loading?:boolean;error?:string;onRetry:()=>void;preview?:boolean;art?:(item:BookingListItem)=>PhotoSource|undefined}) {
  const insets=useSafeAreaInsets();const provider=role==="provider";
  const sections=[{id:"pending",title:provider?"Requests":"Pending"},{id:"active",title:"Active"},{id:"completed",title:"Completed"},{id:"cancelled",title:"Cancelled"}] as const;
  const visible=items.filter(item=>item.section===section);
  return <ScrollView style={{width:"100%",maxWidth:600,alignSelf:"center"}} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content,{paddingTop:(preview?0:insets.top)+10}]}>
    <Heading title={provider?"Jobs":"Bookings"} subtitle={provider?"Follow new requests, active jobs and completed work.":"All your requests and booked work in one place."}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:4}}>{sections.map((s,index)=><SelectionChip key={s.id} label={s.title} selected={section===s.id} onPress={()=>onSection(s.id)} style={{width:[81,70,94,88][index],paddingHorizontal:0}}/>)}</ScrollView>
    <AppText variant="labelLarge">{section==="pending" ? provider?"Your requests":"Pending requests" : `${sections.find(s=>s.id===section)!.title} ${provider?"jobs":"bookings"}`}</AppText>
    {loading ? <LogoLoader label={provider?"Loading jobs":"Loading bookings"}/> : error ? <><Callout title="Couldn’t load bookings" message={error} tone="error"/><Button title="Try again" variant="outline" onPress={onRetry}/></> : !visible.length ? <Callout title={section==="pending" ? "No pending requests" : "Nothing here yet"} message={section==="pending" ? "New requests and replies will appear here." : "Bookings at this stage will appear here."}/> : visible.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title+", "+item.status} onPress={()=>onOpen(item.id)} style={styles.card}>
      <View style={styles.row}>{art?.(item) && <Image source={art(item)} style={provider?styles.avatar:styles.photo} contentFit="cover"/>}<View style={{flex:1,gap:4}}><AppText variant={provider?"body":"labelLarge"}>{provider?item.participant:item.title}</AppText>{!provider && <AppText variant="bodySmall" color={Colors.textSecondary}>{item.participant}</AppText>}</View>{provider && <Status item={item}/>}</View>
      {provider && item.description && <AppText variant="bodySupport" numberOfLines={1}>{item.description}</AppText>}
      <AppText variant="caption" color={Colors.textSecondary}>{item.date}</AppText>{provider && item.area && <View style={{flexDirection:"row",alignItems:"center",gap:4}}><View style={{width:16,height:16,alignItems:"center",justifyContent:"center"}}><BookingIcon name="location"/></View><AppText variant="bodySmall" color={Colors.textSecondary} style={{flex:1}}>{item.area}</AppText></View>}
      {!provider && <View style={{alignSelf:"flex-start"}}><Status item={item}/></View>}
      {item.legacy && <AppText variant="footnote" color={Colors.textSecondary}>Legacy booking · inspection details unavailable</AppText>}
    </Pressable>)}
  </ScrollView>;
}
function Status({item}:{item:BookingListItem}) {
  const tone=item.section==="cancelled"?"error":item.section==="completed"?"success":item.warning?"warning":"info";
  const color={error:Colors.error,success:Colors.success,warning:Colors.warning,info:Colors.primary}[tone];
  const background={error:Colors.errorSoft,success:Colors.successSoft,warning:Colors.warningSoft,info:Colors.primarySoft}[tone];
  return <View style={{backgroundColor:background,borderRadius:8,padding:6,flexShrink:1}}><AppText variant="captionEmphasis" color={color}>{item.status}</AppText></View>;
}
const styles=StyleSheet.create({content:{padding:24,gap:20},card:{padding:16,gap:12,borderWidth:1,borderColor:Colors.border,borderRadius:16},row:{flexDirection:"row",alignItems:"center",gap:12},photo:{width:56,height:56,borderRadius:12},avatar:{width:32,height:32,borderRadius:999}});

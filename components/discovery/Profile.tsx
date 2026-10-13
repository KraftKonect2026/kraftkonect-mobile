import { useRef, useState } from "react";
import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { SelectionChip } from "@/components/SelectionChip";
import { activeServices, dateLabel, Provider, Review, Service } from "@/lib/discovery/model";
import Colors from "@/constants/colors";
import { ds, Frame, Icon, IconButton, Photo, PriceAction, ProviderArt, Rating, ServiceCard, Sheet } from "./Parts";

function ReviewCard({ review,compact=false }: {review:Review;compact?:boolean}) {
  const [expanded,setExpanded]=useState(false);
  const long=(review.comment?.length ?? 0)>130;
  return <View style={[styles.review,compact && {width:241,minHeight:158}]}><AppText variant="label">{review.userName || "Customer"}</AppText><View style={[ds.row,{gap:8}]}><View accessible accessibilityLabel={(review.rating ?? 0)+" out of 5 stars"} style={[ds.row,{gap:1,width:56}]}>{Array.from({length:Math.max(0,Math.min(5,Math.floor(review.rating ?? 0)))},(_,star)=><Icon key={star} name={compact ? "reviewStar" : "fullReviewStar"}/>)}</View><AppText variant="captionRegular" color={Colors.textSecondary}>{dateLabel(review.date?.slice(0,10) ?? "") === "Add date" ? "" : dateLabel(review.date!.slice(0,10))}</AppText></View><AppText variant="captionRegular" color={Colors.textSecondary} numberOfLines={!expanded && long ? 3 : undefined}>{review.comment || "No written review."}</AppText>{long && <Pressable accessibilityRole="button" accessibilityLabel={(expanded?"Show less":"Show more")+" of "+(review.userName || "customer")+" review"} onPress={()=>setExpanded(v=>!v)} style={{minHeight:44,justifyContent:"center"}}><AppText variant="captionRegular" color={Colors.textSecondary} style={{textDecorationLine:"underline"}}>{expanded ? "Show less" : "Show more"}</AppText></Pressable>}</View>;
}
export function ReviewsSheet({ provider,onClose }: {provider:Provider;onClose:()=>void}) {
  const [rating,setRating]=useState(0); const [oldest,setOldest]=useState(true);
  const reviews=(provider.reviews ?? []).filter(r=>!rating || Math.round(r.rating ?? 0)===rating).slice().sort((a,b)=>((Date.parse(a.date || "")||0)-(Date.parse(b.date || "")||0))*(oldest?1:-1));
  return <Sheet title="All reviews" description="Ratings and feedback from completed jobs." onClose={onClose}><View style={[ds.row,{justifyContent:"space-between",flexWrap:"wrap"}]}><Rating provider={provider} heading/><Pressable accessibilityRole="button" accessibilityLabel="Change review order" onPress={()=>setOldest(v=>!v)} style={[ds.row,{minHeight:44}]}><Icon name="sort"/><AppText variant="body">{oldest ? "Oldest" : "Newest"}</AppText></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{[0,5,4,3,2,1].map(n=><SelectionChip compact key={n} label={n ? String(n) : "All"} selected={rating===n} onPress={()=>setRating(n)} style={{width:48}}/>)}</ScrollView><View style={ds.divider}/>{reviews.length ? reviews.map(r=><ReviewCard key={r.id} review={r}/>) : <AppText variant="body" color={Colors.textSecondary}>No reviews match this rating.</AppText>}</Sheet>;
}
export function PhotoViewer({ provider,art,start,onClose }: {provider:Provider;art?:ProviderArt;start:number;onClose:()=>void}) {
  const insets=useSafeAreaInsets(); const {width,height}=useWindowDimensions(); const stageWidth=Math.min(width,600)-48;
  const gallery=art?.fullGallery ?? provider.portfolio ?? []; const thumbnails=art?.thumbnails ?? gallery;
  const [index,setIndex]=useState(start); const rail=useRef<ScrollView>(null);
  const select=(next:number)=> {setIndex(next);rail.current?.scrollTo({x:next*(stageWidth+16),animated:false});};
  return <Modal animationType="none" onRequestClose={onClose}><View style={[ds.screen,{paddingTop:insets.top,paddingBottom:Math.max(40,insets.bottom+12)}]}>
    {!!art && <View style={{height:44,paddingHorizontal:12,justifyContent:"center",backgroundColor:Colors.background}}><AppText variant="footnote" color={Colors.textSecondary}>LOCAL PREVIEW · Sample work photos</AppText></View>}
    <View style={[ds.row,{paddingHorizontal:24,justifyContent:"space-between",marginTop:12,marginBottom:24}]}><View style={styles.counter}><AppText variant="labelSmall">{index+1} of {gallery.length}</AppText></View><IconButton name="close" label="Close photo viewer" onPress={onClose}/></View>
    <ScrollView ref={rail} horizontal snapToInterval={stageWidth+16} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentOffset={{x:start*(stageWidth+16),y:0}} onMomentumScrollEnd={e=>setIndex(Math.min(gallery.length-1,Math.max(0,Math.round(e.nativeEvent.contentOffset.x/(stageWidth+16)))))} contentContainerStyle={{paddingHorizontal:24,gap:16}} style={{maxHeight:Math.min(491,height-insets.top-insets.bottom-(art?324:280))}}>{gallery.map((photo,i)=><Photo key={i} source={photo} style={{width:stageWidth,height:Math.min(491,height-insets.top-insets.bottom-(art?324:280))}}/>)}</ScrollView>
    <View style={{paddingHorizontal:24,gap:24,paddingTop:24}}><AppText variant="h3">{provider.name}</AppText>
      {gallery.length>1 && <View style={[ds.row,{justifyContent:"center",gap:8}]}>{gallery.map((_,i)=><View key={i} style={{width:i===index?22:7,height:7,overflow:"hidden"}}><Image source={require("@/assets/discovery/322de.svg")} style={{width:82,height:7,position:"absolute",left:i===index?0:-30}} contentFit="contain"/></View>)}</View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{thumbnails.map((photo,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={"Show work photo "+(i+1)} accessibilityState={{selected:index===i}} onPress={()=>select(i)} style={[styles.thumbnail,{borderWidth:index===i?2:1}]}><Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover"/></Pressable>)}</ScrollView>
    </View>
  </View></Modal>;
}
export function ProfileScreen({ provider,art,saved,saving,onSave,onBack,onRequest,onReviews,onPhoto,selectedServiceId }: {provider:Provider;art?:ProviderArt;saved:boolean;saving?:boolean;onSave:()=>void;onBack:()=>void;onRequest:(s:Service)=>void;onReviews:()=>void;onPhoto:(i:number)=>void;selectedServiceId?:string}) {
  const services=activeServices(provider); const selected=services.find(s=>s.id===selectedServiceId) ?? services[0]; const gallery=art?.gallery ?? provider.portfolio ?? [];
  return <Frame contentStyle={{paddingTop:12,gap:12}} footer={<PriceAction service={selected} title="Get quote" disabled={!selected || provider.available===false} onPress={()=>selected && onRequest(selected)}/> }>
    <View style={{height:274}}><Photo source={art?.cover ?? provider.banner ?? selected?.photos?.[0]} approvedCrop={!!art}/><View style={{position:"absolute",left:12,top:4}}><IconButton compact name="back" label="Back" onPress={onBack}/></View><View style={ds.savePosition}><IconButton compact name={saved?"profileSaved":"heart"} label={(saved?"Unsave ":"Save ")+provider.name} selected={saved} disabled={saving} onPress={onSave}/></View>
      {(art?.avatar || provider.avatar) && <Image source={art?.avatar ?? provider.avatar} style={art?.avatar ? styles.approvedAvatar : styles.avatar} contentFit="cover"/>}
    </View><AppText variant="h1">{provider.name}</AppText>{!!provider.bio && <AppText variant="body" color={Colors.textSecondary}>{provider.bio}</AppText>}
    <Pressable accessibilityRole="button" accessibilityLabel={"Read "+provider.name+" reviews"} onPress={onReviews} style={{minHeight:44,justifyContent:"center"}}><Rating provider={provider}/></Pressable><View style={ds.divider}/>
    {services.length ? services.map(service=><ServiceCard key={service.id} service={service} photo={art?.cover} onPress={()=>onRequest(service)}/>) : <AppText variant="body">This provider has no active services.</AppText>}
    {provider.available===false && <AppText variant="body" color={Colors.textSecondary}>This provider is currently unavailable.</AppText>}
    <View style={ds.divider}/><View style={[ds.row,{justifyContent:"space-between"}]}><AppText variant="label">Work photos</AppText><AppText variant="caption" color={Colors.textSecondary}>{gallery.length} photos</AppText></View>
    {gallery.length ? <View style={styles.gallery}>{gallery.slice(0,4).map((photo,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={"View work photo "+(i+1)} onPress={()=>onPhoto(i)} style={styles.galleryPhoto}>{art?.galleryBases?.[i] && <Image source={art.galleryBases[i]} style={StyleSheet.absoluteFill} contentFit="cover"/>}<Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover"/></Pressable>)}</View> : <AppText variant="captionRegular" color={Colors.textSecondary}>No work photos shared yet.</AppText>}
    <View style={ds.divider}/><Rating provider={provider} heading/>
    {!!provider.reviews?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{provider.reviews.slice(0,4).map(review=><ReviewCard key={review.id} review={review} compact/>)}</ScrollView> : <AppText variant="body" color={Colors.textSecondary}>No reviews yet.</AppText>}
    <Button title="Show all reviews" variant="subtle" size="compact" onPress={onReviews}/>
  </Frame>;
}
const styles=StyleSheet.create({
  review:{borderWidth:1,borderColor:Colors.border,borderRadius:14,paddingHorizontal:14,paddingVertical:12,gap:8,minHeight:102},avatar:{width:92,height:92,borderRadius:46,borderWidth:2,borderColor:Colors.surface,position:"absolute",top:182,left:"50%",marginLeft:-46},approvedAvatar:{width:96,height:96,position:"absolute",top:181,left:"50%",marginLeft:-48},gallery:{flexDirection:"row",flexWrap:"wrap",gap:12},galleryPhoto:{width:"47.8%",height:104,borderRadius:14,overflow:"hidden"},counter:{paddingHorizontal:14,paddingVertical:8,borderWidth:1,borderColor:Colors.surface,borderRadius:14,backgroundColor:Colors.controlQuiet},thumbnail:{width:80,height:60,borderColor:Colors.surface,borderRadius:12,overflow:"hidden"},
});

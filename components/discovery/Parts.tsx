import { ReactNode, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Image, ImageSource } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { LogoLoader } from "@/components/LogoLoader";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import { Provider, Service, startingPrice } from "@/lib/discovery/model";
import type { TypographyVariant } from "@/constants/typography";

export type PhotoSource = ImageSource | string | number;
export type ProviderArt = { cover:PhotoSource; bookAgainCover?:PhotoSource; resultSubtitle?:string; avatar?:PhotoSource; gallery:PhotoSource[]; galleryBases?:PhotoSource[]; fullGallery?:PhotoSource[]; thumbnails?:PhotoSource[] };
const icons = {
  back: [require("@/assets/onboarding/542d7.svg"),24,24], close:[require("@/assets/discovery/8647c.svg"),24,24],
  next:[require("@/assets/discovery/17ce3.svg"),24,24], filter:[require("@/assets/discovery/24644.svg"),24,14.6667],
  heart:[require("@/assets/design/9bdc8.svg"),24,24], saved:[require("@/assets/discovery/de479.svg"),24,24],
  profileSaved:[require("@/assets/discovery/6b6b5.svg"),24,24],
  pin:[require("@/assets/discovery/d1e99.svg"),14.8918,18], search:[require("@/assets/discovery/d67f7.svg"),24,24],
  star:[require("@/assets/discovery/5fddf.svg"),7,7], rating:[require("@/assets/discovery/f35a5.svg"),14,14],
  ratingHeading:[require("@/assets/discovery/6f4cc.svg"),20,20], reviewStar:[require("@/assets/discovery/ec071.svg"),10,10],
  fullReviewStar:[require("@/assets/discovery/0cb8d.svg"),10,10], sort:[require("@/assets/discovery/58c10.svg"),26,26],
  selected:[require("@/assets/discovery/f9eaa.svg"),22,22], radio:[require("@/assets/onboarding/c2e9c.svg"),22,22],
  check:[require("@/assets/discovery/5636f.svg"),32,32],
} as const;
export function Icon({ name }: { name:keyof typeof icons }) {
  const [source,width,height]=icons[name]; return <Image source={source} style={{width,height}} contentFit="contain" accessible={false} aria-hidden />;
}
export function IconButton({ name, label, onPress, compact=false, quietSmall=false, disabled=false, selected=false }: { name:keyof typeof icons; label:string; onPress:()=>void; compact?:boolean; quietSmall?:boolean; disabled?:boolean; selected?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress} style={ds.iconButton}>
    <View style={[ds.iconSurface,compact && ds.compactSurface,quietSmall && {width:32,height:32}]}><Icon name={name}/></View>
  </Pressable>;
}
export function Frame({ children, header, subheader, topSpacing=10, footer, scroll=true, contentStyle, safeAreaTop=true, headerGap=8, headerHeight, footerBottomPadding=40,footerStyle }: { children:ReactNode; header?:ReactNode; subheader?:ReactNode; topSpacing?:number; footer?:ReactNode; scroll?:boolean; contentStyle?:StyleProp<ViewStyle>; safeAreaTop?:boolean; headerGap?:number; headerHeight?:number;footerBottomPadding?:number;footerStyle?:StyleProp<ViewStyle> }) {
  const insets=useSafeAreaInsets();
  return <KeyboardAvoidingView style={[ds.screen,{paddingTop:safeAreaTop ? insets.top : 0}]} behavior={Platform.OS==="ios" ? "padding" : undefined}>
    {header && <View style={[ds.topBar,{marginTop:topSpacing,gap:headerGap},headerHeight!==undefined&&{height:undefined,minHeight:headerHeight}]}>{header}</View>}
    {subheader && <View style={{paddingHorizontal:24,paddingTop:15,paddingBottom:8,borderBottomWidth:1,borderBottomColor:Colors.border}}>{subheader}</View>}
    {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[ds.content,contentStyle]}>{children}</ScrollView> : <View style={[ds.flex,contentStyle]}>{children}</View>}
    {footer && <View style={[ds.footer,footerStyle,{paddingBottom:Math.max(footerBottomPadding,insets.bottom+12)}]}>{footer}</View>}
  </KeyboardAvoidingView>;
}
export function TopBar({ onBack, onClose, children, onFilter }: { onBack?:()=>void; onClose?:()=>void; children?:ReactNode; onFilter?:()=>void }) {
  return <><View style={{width:44}}>{onBack && <IconButton name="back" label="Back" onPress={onBack}/>}</View><View style={ds.flex}>{children}</View>{onClose ? <IconButton name="close" label="Close" onPress={onClose}/> : onFilter ? <IconButton name="filter" label="Filters" onPress={onFilter}/> : <View style={{width:44}}/>}</>;
}
export function Sheet({ children, title, description, onClose, showClose=false, showHandle=true, minimumHeight, topPadding=28, bodyPadding=10, bodyGap=12, titleVariant="h2" }: { children:ReactNode;title:string;description?:string;onClose:()=>void;showClose?:boolean;showHandle?:boolean;minimumHeight?:number;topPadding?:number;bodyPadding?:number;bodyGap?:number;titleVariant?:TypographyVariant }) {
  const insets=useSafeAreaInsets();
  return <Modal transparent animationType="none" onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS==="ios" ? "padding" : undefined} style={ds.overlay}>
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss sheet" onPress={onClose} style={StyleSheet.absoluteFill}/>
    <View accessibilityViewIsModal style={[ds.sheet,{minHeight:minimumHeight,paddingTop:topPadding,paddingBottom:Math.max(40,insets.bottom+12)}]}>
      {showHandle && <View style={ds.handle}/>}<View style={ds.row}><AppText variant={titleVariant} style={ds.flex}>{title}</AppText>{showClose && <IconButton name="close" label={"Close "+title} onPress={onClose}/>}</View>
      {description && <AppText variant="body" color={Colors.textSecondary}>{description}</AppText>}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:bodyGap,paddingTop:bodyPadding}} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  </KeyboardAvoidingView></Modal>;
}
export function SummaryRow({ label,value,onPress }: { label:string;value:string;onPress:()=>void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label+": "+value} onPress={onPress} style={ds.summary}><AppText variant="bodyLarge" color={Colors.textSecondary}>{label}</AppText><AppText variant="label" style={[ds.flex,{textAlign:"right"}]}>{value}</AppText></Pressable>;
}
export function Photo({ source, style, approvedCrop=false }: { source?:PhotoSource;style?:StyleProp<ViewStyle>;approvedCrop?:boolean }) {
  const [width,setWidth]=useState(345);
  return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[ds.photo,style]}>{source ? <Image source={source} style={approvedCrop ? {width:width+18,height:272,left:-9,top:-22} : StyleSheet.absoluteFill} contentFit="cover"/> : <View style={[ds.flex,ds.center]}><AppText variant="captionRegular" color={Colors.textSecondary}>Photo unavailable</AppText></View>}</View>;
}
export function Rating({ provider, heading=false }: { provider:Provider;heading?:boolean }) {
  return <View style={[ds.row,{gap:8,flexWrap:"wrap"}]}>{provider.verified && <AppText variant={heading ? "h3" : "body"}>Verified</AppText>}
    {typeof provider.rating==="number" && Number.isFinite(provider.rating) && <View style={[ds.row,{gap:4}]}><Icon name={heading ? "ratingHeading" : "rating"}/><AppText variant={heading ? "h3" : "body"}>{provider.rating.toFixed(1)}</AppText></View>}
    {provider.reviewCount != null && <AppText variant={heading ? "h3" : "body"}>{provider.reviewCount} reviews</AppText>}
  </View>;
}
export function ServiceCard({ service,photo,onPress,showPrice=true,selected=false }: { service:Service;photo?:PhotoSource;onPress?:()=>void;showPrice?:boolean;selected?:boolean }) {
  const body=<><Photo source={photo ?? service.photos?.[0]} style={ds.servicePhoto}/><View style={[ds.flex,{gap:6}]}><AppText variant="label">{service.title}</AppText>{!!service.description && <AppText variant="captionRegular" color={Colors.textSecondary}>{service.description}</AppText>}{showPrice && <AppText variant="label">{startingPrice(service)}</AppText>}</View></>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={"Choose "+service.title} accessibilityState={{selected}} onPress={onPress} style={[ds.serviceCard,selected && {borderColor:Colors.primary}]}>{body}</Pressable> : <View style={ds.serviceCard}>{body}</View>;
}
export function ProviderCard({ provider,service,subtitle,photo,saved,saving,onSave,onOpen,availability,approvedCrop=false }: { provider:Provider;service?:Service;subtitle?:string;photo?:PhotoSource;saved:boolean;saving?:boolean;onSave:()=>void;onOpen:()=>void;availability?:string;approvedCrop?:boolean }) {
  return <View style={{gap:8}}><View style={ds.photo}>
    <Pressable accessibilityRole="button" accessibilityLabel={"View "+provider.name} onPress={onOpen} style={StyleSheet.absoluteFill}><Photo source={photo ?? provider.banner ?? service?.photos?.[0]} style={StyleSheet.absoluteFill} approvedCrop={approvedCrop}/></Pressable>
    <View style={ds.savePosition}><IconButton compact name={saved ? "saved" : "heart"} label={(saved ? "Unsave " : "Save ")+provider.name} selected={saved} disabled={saving} onPress={onSave}/></View>
    {!!availability && <View style={ds.badge}><AppText variant="badge">{availability}</AppText></View>}
  </View><Pressable accessibilityRole="button" accessibilityLabel={"Open "+provider.name+" profile"} onPress={onOpen}>
    <AppText variant="label">{provider.name}</AppText><AppText variant="captionRelaxed" color={Colors.textSecondary}>{subtitle ?? service?.title ?? provider.category}</AppText>
    <View style={[ds.row,{gap:4}]}>{provider.verified && <AppText variant="meta" color={Colors.textSecondary}>Verified</AppText>}{provider.rating != null && <><Icon name="star"/><AppText variant="meta" color={Colors.textSecondary}>{provider.rating.toFixed(1)}</AppText></>}</View><AppText variant="captionEmphasis">{startingPrice(service)}</AppText>
  </Pressable></View>;
}
export function Status({ loading,error,empty,onRetry }: { loading?:boolean;error?:boolean;empty:string;onRetry:()=>void }) {
  return <View style={{gap:16,paddingVertical:24}}>{loading ? <LogoLoader label="Loading providers"/> : error ? <><AppText variant="h3">Couldn’t load this information</AppText><AppText variant="body" color={Colors.textSecondary}>Please try again. Your selections are kept.</AppText><Button title="Try again" onPress={onRetry}/></> : <AppText variant="body" color={Colors.textSecondary}>{empty}</AppText>}</View>;
}
export function PriceAction({ service,title,onPress,disabled=false }: { service?:Service;title:string;onPress:()=>void;disabled?:boolean }) {
  return <View style={ds.priceAction}><AppText variant="label" style={ds.flex}>{startingPrice(service)}</AppText><Button title={title} onPress={onPress} disabled={disabled} style={{width:169,maxWidth:"53%"}}/></View>;
}
export const ds = StyleSheet.create({
  screen:{flex:1,backgroundColor:Colors.surface,width:"100%",maxWidth:600,alignSelf:"center"}, flex:{flex:1,minWidth:0}, center:{alignItems:"center",justifyContent:"center"}, row:{flexDirection:"row",alignItems:"center",gap:12},
  topBar:{marginTop:10,marginHorizontal:Space.page,height:48,flexDirection:"row",alignItems:"center",gap:Space.sm}, content:{padding:Space.page,paddingTop:Space.lg,gap:Space.md,flexGrow:1},footer:{paddingHorizontal:Space.page,paddingTop:Space.md,gap:Space.sm,backgroundColor:Colors.surface},
  iconButton:{width:44,height:44,alignItems:"center",justifyContent:"center"},iconSurface:{width:44,height:44,borderRadius:Corners.full,backgroundColor:Colors.controlQuiet,alignItems:"center",justifyContent:"center"},compactSurface:{width:32,height:32,backgroundColor:Colors.surface},
  panel:{borderWidth:1,borderColor:Colors.border,borderRadius:Corners.panel,paddingHorizontal:Space.xl,paddingVertical:18,gap:10},summary:{minHeight:62,paddingHorizontal:Space.lg,borderRadius:Corners.large,borderWidth:1,borderColor:Colors.border,flexDirection:"row",alignItems:"center",gap:Space.sm},
  overlay:{flex:1,backgroundColor:Colors.overlay,justifyContent:"flex-end"},sheet:{width:"100%",maxWidth:600,alignSelf:"center",maxHeight:"92%",borderTopLeftRadius:Corners.sheet,borderTopRightRadius:Corners.sheet,backgroundColor:Colors.surface,paddingHorizontal:Space.page,paddingTop:28,gap:Space.xs},handle:{width:42,height:4,backgroundColor:Colors.borderStrong,borderRadius:2,alignSelf:"center",position:"absolute",top:Space.md},
  photo:{height:228,backgroundColor:Colors.primarySoft,borderRadius:Corners.large,overflow:"hidden"},savePosition:{position:"absolute",top:Space.xs,right:Space.md},badge:{position:"absolute",bottom:10,right:10,backgroundColor:Colors.background,borderRadius:Corners.full,paddingHorizontal:Space.sm,height:26,justifyContent:"center"},
  serviceCard:{minHeight:112,padding:14,gap:Space.xl,borderWidth:1,borderColor:Colors.border,borderRadius:Corners.card,flexDirection:"row",alignItems:"center"},servicePhoto:{width:114,height:84,borderRadius:Corners.large,flexShrink:1},
  divider:{height:1,backgroundColor:Colors.border},priceAction:{minHeight:68,paddingLeft:14,paddingRight:Space.sm,paddingVertical:Space.sm,gap:Space.lg,borderRadius:Corners.large,backgroundColor:Colors.background,flexDirection:"row",alignItems:"center"},
});

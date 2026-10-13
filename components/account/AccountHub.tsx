import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { AccountIcon, SettingsRow } from "@/components/account/AccountParts";
import { AppMode } from "@/lib/appMode";
import Colors from "@/constants/colors";
export type AccountHubIdentity={firstName:string;lastName:string;profile:{avatar:boolean};avatarUrl?:string;verificationLabel?:string};
export function AccountHub({mode,account,onOpen}:{mode:AppMode;account:AccountHubIdentity;onOpen:(destination:string)=>void}){
 const provider=mode==="provider",narrow=useWindowDimensions().width<360;
 return <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:24,paddingTop:12,paddingBottom:16,gap:provider?0:12}}>
  <AppText variant="h2" style={provider?{marginBottom:4}:undefined}>Account</AppText>
  {!provider&&<><Pressable accessibilityRole="button" accessibilityLabel="Profile details" onPress={()=>onOpen("profile-details")} style={{padding:12,gap:16,flexDirection:"row",alignItems:"center",borderRadius:16,backgroundColor:Colors.background}}>
    {account.avatarUrl?<Image source={{uri:account.avatarUrl}} style={{width:48,height:48,borderRadius:999}} contentFit="cover"/>:account.profile.avatar?<Image source={require("@/assets/onboarding/29380.png")} style={{width:48,height:48,borderRadius:999}} contentFit="cover"/>:<View style={{width:48,height:48,borderRadius:999,backgroundColor:Colors.surfaceMuted,alignItems:"center",justifyContent:"center"}}><AppText variant="h3">{account.firstName.slice(0,1)}</AppText></View>}
    <AppText variant="h3" style={{flex:1,minWidth:0}}>{(account.firstName+" "+account.lastName).trim()||"Your account"}</AppText><AccountIcon name="forward"/>
  </Pressable><View style={{flexDirection:"row",gap:12}}><Button title="Saved" size="compact" variant="outline" style={{flex:1,paddingHorizontal:narrow?6:16}} icon={<Image source={require("@/assets/account/d1377.svg")} style={{width:20,height:20}}/>} onPress={()=>onOpen("saved")}/><Button title="Your reviews" size="compact" variant="outline" style={{flex:1,paddingHorizontal:narrow?6:16}} icon={<Image source={require("@/assets/account/fb33e.svg")} style={{width:20,height:20}}/>} onPress={()=>onOpen("reviews")}/></View></>}
  <View>
   {provider&&<SettingsRow title="Your provider profile" description="View and edit your provider profile" icon="profile" onPress={()=>onOpen("provider-profile")}/>}
   <SettingsRow title="Your account" description={provider?"Personal details and security":"Phone, recovery email and account controls"} icon="account" onPress={()=>onOpen("details")}/>
   {provider?<><SettingsRow title="My services" icon="services" minHeight={56} onPress={()=>onOpen("services")}/><SettingsRow title="Availability" icon="calendar" minHeight={56} onPress={()=>onOpen("availability")}/><SettingsRow title="Earnings & payouts" icon="wallet" minHeight={56} onPress={()=>onOpen("earnings")}/><SettingsRow title="Verification" description={account.verificationLabel??"Identity verified"} icon="verified" onPress={()=>onOpen("verification")}/></>:<SettingsRow title="Location & privacy" description="Your area and device permissions" icon="location" minHeight={68} onPress={()=>onOpen("privacy")}/>}
   <SettingsRow title="Notifications" description={provider?"Requests, messages and payout updates":"Choose the updates you receive"} icon="bell" minHeight={provider?72:68} forward="settingsForward" onPress={()=>onOpen("preferences")}/>
   {!provider&&<SettingsRow title="Payments" description="Saved cards and payment records" icon="payment" minHeight={68} forward="settingsForward" onPress={()=>onOpen("payments")}/>}
   <SettingsRow title="Help & support" description="Answers and support conversations" icon="help" minHeight={provider?72:68} forward="settingsForward" onPress={()=>onOpen("help")}/>
   <SettingsRow title="Legal" description="Terms of use and privacy policy" icon="shield" minHeight={provider?72:68} forward="settingsForward" onPress={()=>onOpen("legal")}/>
  </View>
  <Button title="Sign out" variant="outline" textStyle={provider?undefined:{color:Colors.errorText}} style={provider?{marginTop:16}:undefined} onPress={()=>onOpen("sign-out")}/>
 </ScrollView>;
}

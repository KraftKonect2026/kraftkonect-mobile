import { useEffect, useRef, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useApolloClient, useMutation } from "@apollo/client";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { ModeHeader } from "@/components/ModeHeader";
import { Sheet } from "@/components/discovery/Parts";
import { ConfirmDialog } from "@/components/bookings/Parts";
import { AccountHub } from "./AccountHub";
import { LiveAccountContent } from "./LiveAccountContent";
import { useAccountRead } from "@/lib/hooks/useAccountRead";
import { saveServiceArea } from "@/lib/hooks/useServiceArea";
import { liveAccountStep, LiveAccountStep, matchedAvatarUpdate, sameAccountSession } from "@/lib/account/liveAccount";
import { areaError } from "@/lib/account/model";
import { EDIT_PROFILE_MUTATION, UPDATE_MY_PROVIDER_PROFILE_MUTATION } from "@/lib/mutations";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { askDeletionCode, noticeDay, requestDeletion } from "@/lib/account/liveDeletion";
import { loadPrefs, PrefKey, Prefs, savePref } from "@/lib/account/livePrefs";
import { changeName, confirmCheck, confirmEmail, confirmNewPhone, sendEmailCode, sendNewPhoneCode, setProfilePaused, startCheck } from "@/lib/account/liveContact";
import { normalizedPhone } from "@/lib/onboarding/model";
import type { ContactActions } from "./LiveAccountContent";
import * as WebBrowser from "expo-web-browser";
import { LEGAL_LINKS } from "@/lib/support/liveHelp";
import { useToast } from "@/lib/toast";
import { useAppDispatch, useAppSelector, store } from "@/store";
import { selectActiveMode, setActiveMode, signOut, updateUser } from "@/store/authSlice";
import { AppMode } from "@/lib/appMode";
import Colors from "@/constants/colors";

const accountPath=(mode:AppMode)=>mode==="provider"?"/provider/(tabs)/profile" as const:"/(app)/(tabs)/profile" as const;
export function ConnectedAccountHub({mode}:{mode:AppMode}) {
 const router=useRouter(),dispatch=useAppDispatch(),client=useApolloClient(),data=useAccountRead();
 const [exit,setExit]=useState(false),[busy,setBusy]=useState(false),[unavailable,setUnavailable]=useState<string>();
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const switchMode=(next:AppMode)=>{if(!data.signedIn)return;dispatch(setActiveMode(next));router.replace(accountPath(next));};
 const open=(target:string)=>{
  if(target==="sign-out")setExit(true);
  else if(target==="saved")router.push("/(app)/(tabs)/favourites");
  else if(target==="verification")router.push("/provider/verification-status");
  else if(target==="services")router.push("/provider/services");
  else if(target==="availability")router.push("/provider/availability");
  else if(target==="earnings")router.push("/provider/earnings");
  else router.push({pathname:"/account-settings",params:{step:liveAccountStep(target)}});
 };
 const leave=async()=>{if(busy)return;setBusy(true);dispatch(signOut());try{await client.clearStore();}finally{if(alive.current){setBusy(false);setExit(false);}router.replace("/sign-in");}};
 if(!data.signedIn)return <Redirect href="/sign-in"/>;
 return <View style={{flex:1,backgroundColor:Colors.surface}}><ModeHeader mode={mode} onModeChange={switchMode} onNotifications={()=>router.push("/notifications")} showNotifications={mode==="customer"} showBorder={mode==="customer"}/>{data.error&&<View style={{paddingHorizontal:24,paddingVertical:12,gap:8}}><Callout tone="error" message={data.error}/><Button title="Refresh account" size="compact" variant="outline" disabled={data.loading} onPress={()=>void data.refresh()}/></View>}{data.snapshot&&<AccountHub mode={mode} account={{firstName:data.snapshot.firstName,lastName:data.snapshot.lastName,avatarUrl:data.snapshot.avatarUrl,profile:{avatar:false},verificationLabel:data.snapshot.verificationLabel}} onOpen={open}/>}
 {exit&&<ConfirmDialog provider title="Sign out of KraftKonect?" description="Your bookings and messages stay on your account. Sign in again with your phone number and a one-time code." onClose={()=>{if(!busy)setExit(false);}}><Button title="Sign out" loading={busy} style={{backgroundColor:Colors.error}} onPress={()=>void leave()}/><Button title="Stay signed in" variant="outline" disabled={busy} onPress={()=>setExit(false)}/></ConfirmDialog>}
 {unavailable&&<UnavailableSheet title={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}
function UnavailableSheet({title,onClose}:{title:string;onClose:()=>void}){return <Sheet title={title+" unavailable"} showClose onClose={onClose}><Callout message="This service could not be connected. Your saved account and activity are kept. Please try again later."/><Button title="Done" onPress={onClose}/></Sheet>;}

export function ConnectedAccountSettings(){
 const router=useRouter(),dispatch=useAppDispatch(),client=useApolloClient(),toast=useToast(),data=useAccountRead(),mode=useAppSelector(selectActiveMode),params=useLocalSearchParams<{step?:string}>(),step=liveAccountStep(params.step);
 const [editPhoto]=useMutation(EDIT_PROFILE_MUTATION),[editProvider]=useMutation(UPDATE_MY_PROVIDER_PROFILE_MUTATION);
 const [busy,setBusy]=useState(false),[error,setError]=useState<string>(),[unavailable,setUnavailable]=useState<string>(),[savedArea,setSavedArea]=useState<{id:string;label:string}>();
 const alive=useRef(true),lock=useRef(false);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setError(undefined);setUnavailable(undefined);setBusy(false);},[data.ownerId,step]);
 const stillOwn=(id:string)=>{const auth=store.getState().auth;return alive.current&&sameAccountSession(id,auth.user?.id,auth.isAuthenticated&&!!auth.accessToken);};
 const go=(next:LiveAccountStep)=>{if(!busy)router.setParams({step:next});};
 const saveArea=async(label:string)=>{if(!data.ownerId||lock.current||!stillOwn(data.ownerId))return;const id=data.ownerId,validation=areaError(label);if(validation){setError(validation);return;}lock.current=true;setBusy(true);setError(undefined);try{await saveServiceArea(id,{label:label.trim()});if(stillOwn(id)){setSavedArea({id,label:label.trim()});router.setParams({step:"privacy"});}}catch(e){if(stillOwn(id))setError(e instanceof Error?e.message:"Couldn’t save this area.");}finally{lock.current=false;if(stillOwn(id))setBusy(false);}};
 const photo=async(kind:"personal"|"avatar"|"banner")=>{
  const id=data.ownerId,providerId=data.snapshot?.providerId;if(!id||lock.current||!stillOwn(id))return;if(!data.accountLoaded){setUnavailable("Photo update");return;}if(kind!=="personal"&&!providerId){setUnavailable("Provider profile");return;}
  lock.current=true;setBusy(true);setError(undefined);
  try{
   const selection=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsEditing:true,aspect:kind==="banner"?[16,9]:[1,1],quality:0.8});
   if(selection.canceled||!stillOwn(id))return;const url=await uploadImageToCloudinary(selection.assets[0].uri,()=>stillOwn(id));if(!stillOwn(id))return;
   if(kind==="personal"){const result=await editPhoto({variables:{avatarUrl:url},context:{accountOwnerId:id}});if(!stillOwn(id))return;dispatch(updateUser(matchedAvatarUpdate(id,result.data?.editProfile,url)));}
   else{const result=await editProvider({variables:{input:{[kind]:url}},context:{accountOwnerId:id}});if(!stillOwn(id))return;if(result.data?.updateMyProviderProfile?.id!==providerId||result.data.updateMyProviderProfile[kind]!==url)throw new Error("The provider photo update was not confirmed.");}
   if(stillOwn(id))await data.refresh();
  }catch(e){if(stillOwn(id))setError(e instanceof Error?e.message:"Couldn’t save the public photo.");}
  finally{lock.current=false;if(stillOwn(id))setBusy(false);}
 };
 const saveBio=async(bio:string)=>{const id=data.ownerId,providerId=data.snapshot?.providerId;if(!id||!providerId||lock.current||!stillOwn(id))return;if(!data.accountLoaded){setUnavailable("Introduction update");return;}if(bio.trim().length<10||bio.length>2000){setError("Enter an introduction of 10 to 2,000 characters.");return;}lock.current=true;setBusy(true);setError(undefined);try{const result=await editProvider({variables:{input:{bio:bio.trim()}},context:{accountOwnerId:id}});if(!stillOwn(id))return;if(result.data?.updateMyProviderProfile?.id!==providerId||result.data.updateMyProviderProfile.bio!==bio.trim())throw new Error("The introduction update was not confirmed.");await data.refresh();}catch(e){if(stillOwn(id))setError(e instanceof Error?e.message:"Couldn’t save the introduction.");}finally{lock.current=false;if(stillOwn(id))setBusy(false);}};
 const pinId=useRef<string|undefined>(undefined);
 const [hasProof,setHasProof]=useState(false);
 const pin=useRef<string|undefined>(undefined),proof=useRef<string|undefined>(undefined),after=useRef<"phone-new"|"email">("phone-new"),newPhone=useRef<string|undefined>(undefined);
 // A confirmation only lasts for one change: starting fresh from the account page or the phone page drops it.
 useEffect(()=>{if(step==="details"||step==="phone"){pin.current=undefined;proof.current=undefined;setHasProof(false);}},[step]);
 const finish=async(message:string)=>{pin.current=undefined;proof.current=undefined;setHasProof(false);await data.refresh();toast.success(message);router.setParams({step:"details"});};
 const contact:ContactActions={
  hasProof,
  sendCheck:then=>deletionStep(async id=>{pin.current=await startCheck(client,id);after.current=then;}),
  confirmCheck:code=>deletionStep(async id=>{if(!pin.current)throw new Error("Ask for a code first.");proof.current=await confirmCheck(client,id,pin.current,code);setHasProof(true);router.setParams({step:after.current});}),
  sendPhone:value=>deletionStep(async id=>{
   const phone=normalizedPhone(value);if(!phone)throw new Error("Enter a valid Nigerian mobile number.");
   if(!proof.current)throw new Error("Confirm your current number first.");
   await sendNewPhoneCode(client,id,proof.current,phone);newPhone.current=phone;
  }),
  confirmPhone:code=>deletionStep(async id=>{
   if(!proof.current)throw new Error("Confirm your current number first.");
   await confirmNewPhone(client,id,proof.current,code);
   if(stillOwn(id)){if(newPhone.current)dispatch(updateUser({phone:newPhone.current}));await finish("Phone number updated.");}
  }),
  sendEmail:value=>deletionStep(async id=>{await sendEmailCode(client,id,value,proof.current);}),
  confirmEmail:code=>deletionStep(async id=>{await confirmEmail(client,id,code);if(stillOwn(id))await finish("Recovery email saved.");}),
  saveName:(first,last)=>deletionStep(async id=>{
   const result=await changeName(client,id,first,last);if(!stillOwn(id))return;
   if(result.applied){dispatch(updateUser({name:result.name}));await finish("Name updated.");}
   else{await finish("Sent for review.");toast.info("Your name stays the same until support checks it against your ID. Reference "+(result.reference??"")+".");}
  }),
  setPaused:paused=>deletionStep(async id=>{await setProfilePaused(client,id,paused);if(stillOwn(id))await finish(paused?"Provider profile paused.":"Provider profile is live again.");}),
 };
 const [prefs,setPrefs]=useState<Prefs>();
 // The settings screen shows what the server holds; each switch saves straight away and goes back if the save fails.
 useEffect(()=>{
  const id=data.ownerId;if(step!=="preferences"||!id)return;
  let live=true;setPrefs(undefined);
  loadPrefs(client,id).then(p=>{if(live&&stillOwn(id))setPrefs(p);}).catch(e=>{if(live&&stillOwn(id))setError(e instanceof Error?e.message:"Your notification settings could not be loaded.");});
  return()=>{live=false;};
 },[step,data.ownerId,client]);
 const changePref=(key:PrefKey,value:boolean)=>{
  const id=data.ownerId;if(!id||!prefs||lock.current||!stillOwn(id))return;
  const before=prefs;lock.current=true;setBusy(true);setError(undefined);setPrefs({...prefs,[key]:value});
  savePref(client,id,key,value).then(saved=>{if(stillOwn(id))setPrefs(saved);}).catch(e=>{if(stillOwn(id)){setPrefs(before);setError(e instanceof Error?e.message:"Couldn’t save that setting.");}}).finally(()=>{lock.current=false;if(stillOwn(id))setBusy(false);});
 };
 /** Run one deletion step: show the server's own sentence if it refuses, and keep the person on the screen. */
 const deletionStep=async(work:(id:string)=>Promise<void>)=>{
  const id=data.ownerId;if(!id||lock.current||!stillOwn(id))throw new Error("busy");
  lock.current=true;setBusy(true);setError(undefined);
  try{await work(id);}catch(e){if(stillOwn(id))setError(e instanceof Error?e.message:"Something went wrong. Please try again.");throw e;}
  finally{lock.current=false;if(stillOwn(id))setBusy(false);}
 };
 const askCode=()=>deletionStep(async id=>{pinId.current=await askDeletionCode(client,id);});
 const confirmDeletion=(code:string)=>deletionStep(async id=>{
  if(!pinId.current)throw new Error("Ask for a code first.");
  const result=await requestDeletion(client,id,pinId.current,code);
  // The server has locked the account: leave, as it would anyway.
  dispatch(signOut());try{await client.clearStore();}catch{/* signed out regardless */}
  toast.info("Deletion requested. Your account will be deleted on "+noticeDay(result.noticeEndsAt)+" unless you contact support first.");
  router.replace("/sign-in");
 });
 const open=(target:string)=>{
  if(target==="bookings")router.push(mode==="provider"?"/provider/(tabs)/jobs":"/(app)/(tabs)/bookings");
  else if(target==="support")router.push({pathname:"/support",params:{kind:"help"}});
  else if(target==="feedback")router.push({pathname:"/support",params:{kind:"feedback"}});
  else if(target==="terms")void WebBrowser.openBrowserAsync(LEGAL_LINKS.terms);
  else if(target==="privacy")void WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy);
 };
 if(!data.signedIn)return <Redirect href="/sign-in"/>;
 const snapshot=data.snapshot;if(!snapshot)return <View><AppText>Restoring account details…</AppText></View>;
 const shown=savedArea&&savedArea.id===snapshot.id?{...snapshot,area:savedArea.label}:snapshot;
 return <View style={{flex:1,width:"100%",maxWidth:600,alignSelf:"center",backgroundColor:Colors.surface}}><LiveAccountContent key={snapshot.id} step={step} mode={mode} account={shown} busy={busy} error={error??data.error} onBack={()=>router.replace(accountPath(mode))} onGo={go} onUnavailable={setUnavailable} onRecovery={()=>router.push("/recovery")} onSaveArea={saveArea} onPhoto={kind=>void photo(kind)} onSaveBio={saveBio} onOpen={open} onAskDeletionCode={askCode} onRequestDeletion={confirmDeletion} prefs={prefs} onPref={changePref} contact={contact}/>{unavailable&&<UnavailableSheet title={unavailable} onClose={()=>setUnavailable(undefined)}/>}</View>;
}

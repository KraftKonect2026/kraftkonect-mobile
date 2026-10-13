import { Space, Corners } from "@/constants/layout";
import { useCallback, useEffect, useState } from "react";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { ModeHeader } from "@/components/ModeHeader";
import { BottomNavigation, navigationItems } from "@/components/BottomNavigation";
import { CustomerHomeView } from "@/components/home/CustomerHomeView";
import { ProviderHomeView, ProviderSetupView } from "@/components/home/ProviderHomeView";

import { JobSection } from "@/components/home/JobsView";
import { DataStatus, homeStyles } from "@/components/home/HomeParts";
import { AppMode } from "@/lib/appMode";
import { previewProviders } from "@/lib/preview/homeFixtures";
import Colors from "@/constants/colors";
import { useToast } from "@/lib/toast";
import { discoveryKey } from "@/lib/discovery/model";
import { discoveryHistory, discoveryPreviewId } from "@/lib/preview/discoveryFixtures";
import { secureStorage } from "@/lib/storage";
import { useSampleCatalog } from "@/lib/preview/catalogStore";
import { availabilityLabel } from "@/lib/provider/catalog";
import { useSampleInspection } from "@/lib/preview/inspectionStore";
import { financeReport } from "@/lib/bookings/finance";
import { BookingRecord, exactAddress, money, sampleListItem, sectionFor } from "@/lib/bookings/model";
import { HomeJob } from "@/lib/homeData";
import { AccountHub } from "@/components/account/AccountHub";
import { ConfirmDialog } from "@/components/bookings/Parts";
import { useSampleAccount, commandSampleAccount } from "@/lib/preview/accountStore";
import { InboxView } from "@/components/messaging/MessagingParts";
import { ownedConversations } from "@/lib/messaging/model";
import { useAccountSupport } from "@/lib/preview/accountSupportStore";
import { accountSupportConversation, accountSupportId } from "@/lib/messaging/accountSupport";

const storageKey = "kk.step3-preview.mode";
const scenarios = ["Sample", "Verification", "Setup", "Changes required", "Empty", "Loading", "Error"] as const;
type Scenario = typeof scenarios[number];
function moneyToday(r:BookingRecord){const today=new Date().toDateString(),l=r.ledger;return l?money((l.materialsCreditedAt&&new Date(l.materialsCreditedAt).toDateString()===today?l.materialsReleased:0)+(l.labourCreditedAt&&new Date(l.labourCreditedAt).toDateString()===today?l.labourReleased:0)):undefined;}
export default function AppPreviewRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AppPreview />;
}
function AppPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; scenario?: string; setup?: string; tab?:string }>();
  const toast = useToast();
  const {record:catalog}=useSampleCatalog();const {record:sampleBooking}=useSampleInspection();
  const {record:account,error:accountError,refresh:refreshAccount}=useSampleAccount();
  const {record:accountSupport,error:supportError,refresh:refreshSupport}=useAccountSupport();
  const [signOutOpen,setSignOutOpen]=useState(false),[signingOut,setSigningOut]=useState(false);
  const [mode, setMode] = useState<AppMode>(params.mode === "provider" ? "provider" : "customer");
  const [tab, setTab] = useState(["home","work","messages","account"].includes(params.tab??"")?params.tab!:"home");
  const [scenario, setScenario] = useState<Scenario>(scenarios.includes(params.scenario as Scenario) ? params.scenario as Scenario : "Sample");
  const [query, setQuery] = useState("");
  const [messageQuery,setMessageQuery]=useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [destination, setDestination] = useState<string | null>(null);
  const [statesOpen, setStatesOpen] = useState(false);

  const available = true;
  const [section, setSection] = useState<JobSection>("requests");
  useFocusEffect(useCallback(()=> {
    let active=true;
    secureStorage.getItem(discoveryKey("preview/step5","saved")).then(raw=> {if(!active)return;try{const values=JSON.parse(raw ?? '["tobi","amara","kola"]');if(Array.isArray(values))setSaved(values.filter((id):id is string=>typeof id==="string"));}catch{}}).catch(()=>{});
    return ()=>{active=false;};
  },[]));
  useEffect(() => {
    if (params.mode === "customer" || params.mode === "provider") {
      setMode(params.mode); AsyncStorage.setItem(storageKey, params.mode).catch(() => {}); return;
    }
    AsyncStorage.getItem(storageKey).then(value => { if (value === "customer" || value === "provider") setMode(value); }).catch(() => {});
  }, [params.mode]);
  useEffect(() => {
    if (scenarios.includes(params.scenario as Scenario)) setScenario(params.scenario as Scenario);
  }, [params.scenario]);
  useEffect(()=>{if(params.tab)setTab(["home","work","messages","account"].includes(params.tab)?params.tab:"home");},[params.tab]);
  const switchMode = (next: AppMode) => {
    setMode(next); setTab(value=>value==="account"?"account":"home"); setDestination(null);
    router.setParams({mode:next,tab:tab==="account"?"account":"home"});
    AsyncStorage.setItem(storageKey, next).catch(() => {});
  };
  const navigate = (key: string) => { if(key==="work"){router.push({pathname:"/booking-preview",params:{mode}});return;}setTab(key);router.setParams({tab:key});setDestination(null); };
  const showWork = (next: JobSection) => { setSection(next);router.push({pathname:"/booking-preview",params:{mode,section:next==="requests"?"pending":next}}); };
  const open = (label: string) => { if (label === "Earnings") router.push("/finance-preview"); else if (label === "Services" || label === "Availability") router.push({pathname:"/provider-preview",params:{step:label==="Services"?"services":"availability"}}); else setDestination(label); };
  const openAccount=(destination:string)=>{
    if(destination==="sign-out")setSignOutOpen(true);
    else if(destination==="services"||destination==="availability")open(destination==="services"?"Services":"Availability");
    else if(destination==="earnings")open("Earnings");
    else if(destination==="saved")router.push({pathname:"/discovery-preview",params:{step:"saved"}});
    else router.push({pathname:"/account-preview",params:{mode,step:destination}});
  };
  const signOut=async()=>{if(!account||signingOut)return;setSigningOut(true);try{await commandSampleAccount(account.revision,"sample-sign-out-"+Date.now(),{type:"sign_out"});setSignOutOpen(false);}catch(e){toast.error(e instanceof Error?e.message:"Couldn’t sign out.");}finally{setSigningOut(false);}};
  const sample = scenario === "Sample";
  const sampleSection=sampleBooking?sectionFor(sampleBooking):undefined;
  const currentWork:HomeJob[]=sampleBooking?[{id:sampleBooking.id,title:sampleBooking.serviceTitle,customer:sampleBooking.customerName,date:sampleListItem(sampleBooking,"provider").date,address:sampleSection==="pending"?sampleBooking.area:exactAddress(sampleBooking,"provider"),description:sampleBooking.description,image:require("@/assets/design/1b9df.png")}]:[];
  const previewJobs=sampleSection==="active"?currentWork:[],previewRequests=sampleSection==="pending"?currentWork:[];
  const error = scenario === "Error";
  const loading = scenario === "Loading";
  const notifications = () => router.push({pathname:"/notifications-preview",params:{mode}});
  const provider = mode === "provider";
  const showHeader = tab === "home" || tab === "account";
  if(tab==="work")return <Redirect href={{pathname:"/booking-preview",params:{mode,section:section==="requests"?"pending":section}}}/>;
  return <View style={homeStyles.screen}>
    <View style={styles.previewBar}>
      <AppText variant="footnote" color={Colors.textSecondary}>LOCAL PREVIEW · Sample data · {scenario}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Preview states" onPress={() => setStatesOpen(true)} style={styles.statesButton}>
        <AppText variant="caption" color={Colors.primary}>States</AppText>
      </Pressable>
    </View>
    {showHeader && account?.signedIn && !account.deletion && <ModeHeader mode={mode} onModeChange={switchMode} onNotifications={notifications} showNotifications={!(tab==="account"&&provider)} showBorder={!(tab==="account"&&provider)} />}
    {account?.deletion?<ScrollView style={homeStyles.scroll} contentContainerStyle={styles.content}><Callout title="Deletion notice started" message="This sample account is signed out. Open activity and required records are retained."/><Button title="View deletion request" onPress={()=>router.push({pathname:"/account-preview",params:{mode,step:"delete-requested"}})}/></ScrollView>:account&&!account.signedIn?<ScrollView style={homeStyles.scroll} contentContainerStyle={styles.content}><Callout title="Sample account signed out" message="Your saved local account, bookings and messages are kept. This does not change real authentication."/><Button title="Resume local sample" onPress={()=>{void commandSampleAccount(account.revision,"sample-sign-in-"+Date.now(),{type:"sample_sign_in"}).catch(e=>toast.error(e.message));}}/><Button title="Test phone sign in" variant="outline" onPress={()=>router.push("/sign-in")}/></ScrollView>:destination ? <ScrollView style={homeStyles.scroll} contentContainerStyle={styles.content}>
      <Button title="Back" variant="subtle" size="compact" onPress={() => setDestination(null)} />
      <AppText variant="h2">{destination}</AppText>
      <Callout title="Navigation preview" message="This shows where the action leads. The destination’s full design and live data will be connected in its implementation step." />
    </ScrollView> : tab === "home" ? provider ? scenario === "Verification" || scenario === "Setup" || scenario === "Changes required"
      ? <ProviderSetupView stage={scenario === "Verification" ? "pending" : scenario === "Changes required" ? "changes" : "setup"}
        hasProfile={scenario !== "Setup" || params.setup === "profile" || params.setup === "service"} hasService={scenario !== "Setup" || params.setup === "service"}
        onSetup={() => router.replace({ pathname: "/auth-preview", params: { step: "work" } })}
        onVerification={() => router.replace({ pathname: "/auth-preview", params: { step: scenario === "Verification" ? "verification-pending" : "verification-intro" } })}
        onServices={() => open("Services")} />
      : <ProviderHomeView available={catalog?.providerEnabled===false||account?.providerStatus!=="active"?false:catalog?.availability.available??available} availabilityLabel={account?.providerStatus&&account.providerStatus!=="active"?account.providerStatus==="review"?"Reactivation under review":"Provider profile inactive":catalog?availabilityLabel(catalog.availability):(available ? "Available · every day" : "Unavailable")}
        earningsNote={sampleBooking&&financeReport(sampleBooking,"Week").undatedReleases?"Some release dates are unavailable. View your all-time earnings.":undefined} netToday={sample&&sampleBooking&&!financeReport(sampleBooking,"Week").undatedReleases?moneyToday(sampleBooking):undefined} netWeek={sample&&sampleBooking&&!financeReport(sampleBooking,"Week").undatedReleases?money(financeReport(sampleBooking,"Week").netReleased):undefined}
        jobs={sample ? previewJobs : []} requests={sample ? previewRequests : []} jobsError={error} jobsLoading={loading}
        onManage={() => open("Availability")} onEarnings={() => open("Earnings")}
        onJob={() => router.push({pathname:"/booking-preview",params:{mode:"provider",step:"detail"}})} onRequest={() => router.push({pathname:"/booking-preview",params:{mode:"provider",step:"detail"}})}
        onAllJobs={() => showWork("active")} onAllRequests={() => showWork("requests")}
        onRefresh={() => toast.info("Preview: no backend request is made here.")} />
      : <CustomerHomeView query={query} onQueryChange={setQuery} onSearch={() => router.push({pathname:"/discovery-preview",params:{problem:query}})}
        onSearchFocus={() => router.push({pathname:"/discovery-preview",params:{problem:query}})}
        onCategory={(category, problem) => router.push({pathname:"/discovery-preview",params:{category,problem}})} onProvider={providerId => router.push({pathname:"/discovery-preview",params:{step:"profile",providerId}})}
        onPreviousProvider={providerId => router.push({pathname:"/discovery-preview",params:{step:"profile",providerId,serviceId:discoveryHistory.find(b=>b.provider?.id===discoveryPreviewId(providerId))?.listing?.id}})}
        previous={sample ? previewProviders.slice(0, 3) : []} recommended={sample ? [previewProviders[2], previewProviders[3], previewProviders[0]] : []}
        previousLoading={loading} recommendedLoading={loading} previousError={error} recommendedError={error}
        recommendationNote="Based on services you’ve booked and similar needs."
        savedIds={previewProviders.filter(p=>saved.includes(discoveryPreviewId(p.id))).map(p=>p.id)} onSave={id => {
          const target=discoveryPreviewId(id); const previous=saved; const next=saved.includes(target) ? saved.filter(value=>value!==target) : [...saved,target];setSaved(next);
          secureStorage.setItem(discoveryKey("preview/step5","saved"),JSON.stringify(next)).catch(()=>{setSaved(previous);toast.error("Couldn’t save preview favourites on this device.");});
        }} onBookAgain={() => router.push({pathname:"/discovery-preview",params:{step:"again"}})}
        onRefresh={() => toast.info("Preview: no backend request is made here.")} />
      : tab === "account" ? account?<AccountHub key={mode} mode={mode} account={account} onOpen={openAccount}/>:<View style={styles.content}><DataStatus loading={!accountError} error={!!accountError} onRetry={()=>void refreshAccount()}/></View>
      : tab === "messages" ? loading||error||!sampleBooking||!accountSupport||supportError?<View style={styles.content}><DataStatus loading={loading||!sampleBooking||!accountSupport} error={error||!!supportError} onRetry={()=>{setScenario("Sample");void refreshSupport();}}/></View>:<InboxView rows={sample?[...ownedConversations(sampleBooking,mode),...(account&&accountSupport.messages.length?[accountSupportConversation(accountSupport,account.id,mode)]:[])]:[]} query={messageQuery} onQuery={setMessageQuery} provider={provider} onOpen={conversationId=>router.push({pathname:conversationId===accountSupportId?"/support-preview":"/messages-preview",params:{mode,conversationId}})} onExplore={()=>provider?showWork("requests"):router.push("/discovery-preview")}/>
      : <ScrollView style={homeStyles.scroll} contentContainerStyle={styles.content}>
        <AppText variant="h2">{tab === "messages" ? "Messages" : "Bookings"}</AppText>
        <DataStatus loading={loading} error={error} empty={tab === "messages" ? "Conversations will appear here." : "Your bookings will appear here."}
          onRetry={() => toast.info("Preview: no backend request is made here.")} />
      </ScrollView>}
    {account?.signedIn&&!account.deletion&&<BottomNavigation items={navigationItems(mode)} activeKey={tab} onPress={navigate} />}
    {signOutOpen&&<ConfirmDialog provider title="Sign out of KraftKonect?" description="Your bookings and messages stay on your account. Sign in again with your phone number and a one-time code." onClose={()=>{if(!signingOut)setSignOutOpen(false);}}><Button title="Sign out" loading={signingOut} style={{backgroundColor:Colors.error}} onPress={()=>void signOut()}/><Button title="Stay signed in" variant="outline" disabled={signingOut} onPress={()=>setSignOutOpen(false)}/></ConfirmDialog>}
    <Modal visible={statesOpen} transparent onRequestClose={() => setStatesOpen(false)}>
      <View style={styles.overlay}><View style={styles.statesPanel}>
        <AppText variant="h3">Preview states</AppText>
        <Callout message="These states use sample data only. Your real account and backend are unchanged." />
        <View style={styles.scenarios}>{scenarios.map(item => <SelectionChip key={item} label={item} selected={scenario === item}
          onPress={() => { setScenario(item); setStatesOpen(false); setTab("home"); setDestination(null); }} />)}</View>
        <Button title="Close states" variant="subtle" onPress={() => setStatesOpen(false)} />
      </View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  previewBar: { minHeight: 32, paddingLeft: Space.md, paddingRight: Space.xs, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.background },
  statesButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: Space.sm },
  content: { padding: Space.page, gap: Space.xl },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "center", padding: Space.page },
  statesPanel: { padding: Space.xl, backgroundColor: Colors.surface, borderRadius: Corners.panel, gap: Space.lg },
  scenarios: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
});

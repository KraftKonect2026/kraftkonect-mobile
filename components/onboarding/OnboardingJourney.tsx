import { useEffect, useRef, useState } from "react";
import { AppState, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { PublicPhotoKind } from "@/components/onboarding/MediaFields";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { LogoLoader } from "@/components/LogoLoader";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { useOnboardingDraft } from "@/lib/hooks/useOnboardingDraft";
import { saveServiceArea } from "@/lib/hooks/useServiceArea";
import { useProviderVerification } from "@/lib/hooks/useProviderVerification";
import { useAppDispatch, useAppSelector, store } from "@/store";
import { setActiveMode, setIsAuthenticated, setTokens, setUser, updateUser } from "@/store/authSlice";
import { homeForMode, resolveAppMode } from "@/lib/appMode";
import { normalizedPhone, OnboardingStep, stepAllowed, steps } from "@/lib/onboarding/model";
import { authFailure, confirmedPhoneSession, failureMessage } from "@/lib/onboarding/phoneAuth";
import { EDIT_PROFILE_MUTATION, REQUEST_PHONE_OTP_MUTATION, VERIFY_PHONE_OTP_MUTATION } from "@/lib/mutations";
import { MY_PROVIDER_PROFILE_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { useToast } from "@/lib/toast";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import type { ProviderProfile } from "@/lib/homeData";
import { checkTestLoginCode, createTestLoginChallenge, isTestLoginPhone, TestLoginChallenge, testLoginCode } from "@/lib/onboarding/testLogin";

type PreviewScenario = "Normal" | "Account not found" | "Network error" | "Expired code" | "Invalid code";
const scenarioNames: PreviewScenario[] = ["Normal", "Account not found", "Network error", "Expired code", "Invalid code"];
const previewStepLabels: Partial<Record<OnboardingStep, string>> = {
  "sign-in": "Sign in", role: "Choose mode", phone: "Registration phone", name: "Your name",
  location: "Customer location", work: "Provider work", "service-area": "Provider area",
  profile: "Provider profile", gallery: "Work gallery", "first-service": "First service",
  complete: "Setup complete", "verification-intro": "Verification intro", "verification-documents": "Identity documents",
  "verification-pending": "Verification pending", recovery: "Recovery",
};
export function OnboardingJourney({ initialStep = "role", preview = false }: { initialStep?: OnboardingStep; preview?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(s => s.auth);
  const signedIn = !!auth.user && !!auth.accessToken && auth.isAuthenticated;
  const effectivePreview = preview && __DEV__;
  const draftState = useOnboardingDraft(effectivePreview ? "preview/step4" : auth.user?.id ? "account/" + auth.user.id : "registration");
  const { draft, update, ready } = draftState;
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [otpError, setOtpError] = useState<string>();
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ phone: string; pinId: string; testLogin?: TestLoginChallenge } | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [scenario, setScenario] = useState<PreviewScenario>("Normal");
  const [statesOpen, setStatesOpen] = useState(false);
  const [idReady, setIdReady] = useState(false);
  const [selfieReady, setSelfieReady] = useState(false);
  const [serviceConfirmed, setServiceConfirmed] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "identity">("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryName, setRecoveryName] = useState("");
  const initialized = useRef(false);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const identityCompleted = useRef(false);
  const history = useRef<OnboardingStep[]>([]);
  const [sendCode] = useMutation(REQUEST_PHONE_OTP_MUTATION, { errorPolicy: "none" });
  const [verifyCode] = useMutation(VERIFY_PHONE_OTP_MUTATION, { errorPolicy: "none" });
  const [editProfile] = useMutation(EDIT_PROFILE_MUTATION, { errorPolicy: "none" });
  const profile = useQuery<{ myProviderProfile: ProviderProfile | null }>(MY_PROVIDER_PROFILE_QUERY, { skip: effectivePreview || !signedIn || draft.mode !== "provider",fetchPolicy:"no-cache",context:{accountOwnerId:auth.user?.id,queryDeduplication:false} });
  const verification = useProviderVerification(profile.data?.myProviderProfile?.id, async () => {
    if (!alive.current || store.getState().auth.user?.id !== auth.user?.id) return undefined;
    const result = await profile.refetch();
    if (!alive.current || store.getState().auth.user?.id !== auth.user?.id) return undefined;
    const status = result.data?.myProviderProfile?.kycStatus ?? undefined;
    if (["submitted","in_review","approved"].includes(status ?? "") || (status === "pending" && identityCompleted.current)) {
      setReviewConfirmed(true);
      if (status === "approved") router.replace("/provider/verification-status");
      else setStep("verification-pending");
    }
    return status;
  }, () => {
    if (alive.current && store.getState().auth.user?.id === auth.user?.id) identityCompleted.current = true;
  });
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    if (initialStep === "role" && ["phone","name","location","manual-location","work","service-area","profile","gallery","first-service","verification-intro","verification-documents"].includes(draft.resumeStep)) setStep(stepAllowed(draft.resumeStep, signedIn, effectivePreview));
    else if (["work","service-area","profile","gallery","first-service","complete","verification-intro","verification-documents","verification-pending"].includes(initialStep)) {
      update({ mode: "provider" });
      if (initialStep === "work" && ["work","service-area","profile","gallery","first-service","verification-intro","verification-documents"].includes(draft.resumeStep)) setStep(stepAllowed(draft.resumeStep, signedIn, effectivePreview));
    }
    if (effectivePreview && initialStep === "complete") setServiceConfirmed(true);
    if (effectivePreview && initialStep === "verification-pending") setReviewConfirmed(true);
    if (initialStep === "sign-in" && !effectivePreview && auth.lastPhone && !draft.phone) update({ phone: auth.lastPhone.startsWith("+234") ? auth.lastPhone.slice(4) : auth.lastPhone });
  }, [ready, initialStep, draft.resumeStep, draft.phone, signedIn, effectivePreview, auth.lastPhone, update]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= retryAt) clearInterval(timer);
    }, 1000);
    const subscription = AppState.addEventListener("change", state => { if (state === "active") setNow(Date.now()); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [retryAt]);
  useEffect(() => {
    const allowed = stepAllowed(step, signedIn, effectivePreview);
    if (step !== allowed) setStep(allowed);
  }, [step, signedIn, effectivePreview]);
  const resendSeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const go = (next: OnboardingStep) => {
    if(next.startsWith("recovery")){router.push(effectivePreview?{pathname:"/recovery-preview",params:{entry:"start"}}:"/recovery");return;}
    history.current.push(step);
    setError(undefined); setOtpError(undefined);
    setStep(next);
    update({ resumeStep: next });
  };
  const advanceAfterVerification = (next: OnboardingStep) => {
    // A used code is never part of the next screen's back stack or saved draft.
    setCode(""); setChallenge(null); setRetryAt(0); history.current = [];
    setStep(next); update({ resumeStep: next });
  };
  const back = () => {
    if (inFlight.current || busy || verification.busy) return;
    setError(undefined); setOtpError(undefined);
    if (step === "sign-in-code" || step === "phone-code") { setCode(""); setChallenge(null); setRetryAt(0); }
    const previous = history.current.pop();
    if (previous) { setStep(previous); update({ resumeStep: previous }); }
    else if (effectivePreview) router.replace("/app-preview");
    else if (signedIn) router.replace(homeForMode(resolveAppMode(store.getState().auth)));
    else router.replace("/get-started");
  };
  const unavailable = (message = "We couldn’t finish this online. Your setup is saved on this device. Please try again later.") => {
    setError(message); toast.error(message);
  };
  const send = async (resend = false) => {
    const accountAtStart = store.getState().auth.user?.id;
    const phone = normalizedPhone(draft.phone);
    if (!phone || inFlight.current || (resend && resendSeconds > 0)) return;
    inFlight.current = true; setBusy(true); setError(undefined); setOtpError(undefined);
    try {
      if (effectivePreview) {
        if (scenario === "Network error") throw new Error("Preview network failure");
        if (scenario === "Account not found" && (step === "sign-in" || step === "sign-in-code")) { go("account-missing"); return; }
        setChallenge({ phone, pinId: "preview-only" });
      } else if (__DEV__ && (step === "sign-in" || step === "sign-in-code") && isTestLoginPhone(phone, __DEV__)) {
        setChallenge({ phone, pinId: "local-test-only", testLogin: createTestLoginChallenge(phone, __DEV__, Date.now()) });
      } else {
        const result = await sendCode({ variables: { phone } });
        if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
        const pinId = result.data?.requestPhoneOTP?.pinId;
        if (typeof pinId !== "string" || !pinId.trim()) throw new Error("No code request was confirmed.");
        setChallenge({ phone, pinId });
      }
      setCode(""); setNow(Date.now()); setRetryAt(Date.now() + 60_000);
      if (!resend) go(step === "sign-in" ? "sign-in-code" : "phone-code");
      toast.info(effectivePreview || (__DEV__ && isTestLoginPhone(phone, __DEV__) && (step === "sign-in" || step === "sign-in-code")) ? "Local test: use " + testLoginCode + ". No text message was sent." : "Code requested. Check your phone.");
    } catch (e) {
      if (!alive.current) return;
      if (authFailure(e) === "account-missing" && (step === "sign-in" || step === "sign-in-code")) go("account-missing");
      else unavailable("We couldn’t send a code right now. Please try again.");
    } finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  const confirm = async () => {
    const accountAtStart = store.getState().auth.user?.id;
    if (code.length !== 6 || !challenge || normalizedPhone(draft.phone) !== challenge.phone || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(undefined); setOtpError(undefined);
    try {
      if (challenge.testLogin) {
        const result = checkTestLoginCode(challenge.testLogin, draft.phone, code, __DEV__, Date.now());
        if (result !== "valid") {
          setOtpError(result === "expired" ? "Your test code has expired. Request a new code." : "That code doesn’t match. Please try again.");
          setCode(""); if (result === "expired") setRetryAt(0); return;
        }
        // Sample storage only: never create tokens, dispatch real auth, or call the API.
        const { readSampleAccount, commandSampleAccount } = await import("@/lib/preview/accountStore");
        if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
        const sample = await readSampleAccount();
        if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
        if (sample.deletion || (sample.recovery && sample.recovery.step !== "recovered")) {
          throw new Error("This sample account is locked by a recovery or deletion test. Reset it in Account preview states, then try again.");
        }
        if (!sample.signedIn) await commandSampleAccount(sample.revision, "sample-test-sign-in-" + Date.now(), { type: "sample_sign_in" });
        if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
        setCode(""); setChallenge(null); setRetryAt(0); history.current = [];
        toast.info("Local test account opened. All data is fictional.");
        router.replace({ pathname: "/app-preview", params: { mode: "customer", tab: "home", scenario: "Sample" } });
        return;
      }
      if (effectivePreview) {
        if (scenario === "Network error") throw new Error("Preview network failure");
        if (scenario === "Expired code") { setOtpError("Your code has expired. Request a new code."); setCode(""); setRetryAt(0); return; }
        if (scenario === "Invalid code" || code !== "123456") { setOtpError("That code doesn’t match. Please try again."); setCode(""); return; }
        if (step === "sign-in-code") { toast.info("Preview sign-in complete. Your real account is unchanged."); home(); }
        else advanceAfterVerification("name");
        return;
      }
      const result = await verifyCode({ variables: { phone: challenge.phone, pin: code, pinId: challenge.pinId } });
      if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
      const session = confirmedPhoneSession(result.data?.verifyPhoneOTP, challenge.phone);
      // Sign-in restores the account's own draft; it must not replace it with the phone-entry form.
      const bound = step === "phone-code" ? await draftState.bindToAccount(session.user.id, !!session.user.name?.trim()) : undefined;
      if (!alive.current || store.getState().auth.user?.id !== accountAtStart) return;
      dispatch(setUser(session.user));
      dispatch(setTokens({ accessToken: session.accessToken!, refreshToken: session.refreshToken! }));
      dispatch(setIsAuthenticated(true));
      if (step === "phone-code") dispatch(setActiveMode(draft.mode));
      // Refresh complete profile fields using the established authenticated query.
      void import("@/lib/apolloClient").then(({ default: client }) => client.query({ query: USER_PROFILE_QUERY, fetchPolicy: "network-only" })).then(result => {
        if (result.data?.me?.id === store.getState().auth.user?.id) dispatch(updateUser(result.data.me));
      }).catch(() => {});
      if (step === "sign-in-code") router.replace(homeForMode(resolveAppMode(store.getState().auth)));
      else advanceAfterVerification(bound!.resumeStep);
    } catch (e) {
      if (!alive.current) return;
      if (challenge.testLogin) { unavailable(e instanceof Error ? e.message : "We couldn’t open the local test account. Please try again."); return; }
      const kind = authFailure(e);
      if (kind === "account-missing") go("account-missing");
      else if (kind === "invalid" || kind === "expired") {
        setOtpError(failureMessage(kind)); setCode(""); if (kind === "expired") setRetryAt(0);
      } else unavailable("We couldn’t verify this code right now. Please try again.");
    } finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  const home = () => {
    if (effectivePreview) {
      const scenario = draft.mode === "provider" && step !== "sign-in-code" ? reviewConfirmed ? "Verification" : "Setup" : "Sample";
      const setup = serviceConfirmed ? "service" : draft.avatar && draft.businessName && draft.introduction ? "profile" : undefined;
      router.replace({ pathname: "/app-preview", params: { mode: draft.mode, scenario, ...(setup ? { setup } : {}) } }); return;
    }
    if (!signedIn) { go("sign-in"); return; }
    dispatch(setActiveMode(draft.mode));
    router.replace(homeForMode(draft.mode));
  };
  const finishArea = async (area: { label: string; latitude?: number; longitude?: number }) => {
    if (effectivePreview) { update({ customerArea: area.label }); home(); return; }
    const userId = auth.user?.id;
    if (!userId) { go("phone"); return; }
    await saveServiceArea(userId, area);
    if (!alive.current || store.getState().auth.user?.id !== userId) return;
    update({ customerArea: area.label }); dispatch(setActiveMode("customer"));
    router.replace(homeForMode("customer"));
  };
  const locate = async () => {
    if (inFlight.current) return;
    if (effectivePreview) {
      if (scenario === "Network error") { unavailable("We couldn’t get your location. You can enter an area manually."); return; }
      update({ customerArea: "Ikeja, Lagos" }); toast.info("Preview: sample area selected; device location wasn’t requested."); home(); return;
    }
    inFlight.current = true; setBusy(true); setError(undefined);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") { unavailable("Location access wasn’t allowed. You can enter your area manually."); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const addresses = await Location.reverseGeocodeAsync(location.coords);
      const found = addresses[0];
      const label = [found?.district, found?.city, found?.region].filter(Boolean).filter((value, i, list) => list.indexOf(value) === i).join(", ") || "Current area";
      await finishArea({ label, latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch { if (alive.current) unavailable("We couldn’t get your location. You can enter an area manually."); }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  const photo = async (kind: PublicPhotoKind) => {
    if (inFlight.current) return;
    if (effectivePreview) {
      if (scenario === "Network error") { unavailable("Preview: photo selection failed. Try again."); return; }
      const value = kind === "avatar" ? "sample-avatar" : "sample-" + kind + (kind === "gallery" ? "-" + draft.gallery.length : "");
      update(kind === "gallery" ? { gallery: [...draft.gallery, value] } : { [kind]: value });
      toast.info("Preview: sample photo selected. No file was uploaded."); return;
    }
    inFlight.current = true; setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: kind === "avatar" ? [1,1] : [4,3], quality: 0.8 });
      if (!result.canceled && alive.current) {
        const value = result.assets[0]?.uri;
        if (value) update(kind === "gallery" ? { gallery: [...draft.gallery, value] } : { [kind]: value });
      }
    } catch { if (alive.current) unavailable("Couldn’t select that photo. Please try again."); }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  const identity = () => {
    if (profile.loading || profile.error) {
      unavailable("We couldn’t load your verification status. Please try again."); return;
    }
    if (!profile.data?.myProviderProfile?.id) {
      unavailable("Finish saving your provider profile before starting identity verification."); return;
    }
    identityCompleted.current = false;
    void verification.start();
  };
  const next = async () => {
    if (step === "sign-in" || step === "phone") { await send(); return; }
    if (step === "sign-in-code" || step === "phone-code") { await confirm(); return; }
    if (inFlight.current) return;
    setError(undefined);
    switch (step) {
      case "name": {
        if (!effectivePreview) {
          if (auth.user?.name?.trim()) { go(draft.mode === "provider" ? "work" : "location"); return; }
          const id = auth.user?.id;
          if (!id) { go("phone"); return; }
          inFlight.current = true; setBusy(true);
          try {
            const result = await editProfile({ variables: { name: draft.firstName.trim() + " " + draft.lastName.trim() } });
            if (result.data?.editProfile?.id !== id || store.getState().auth.user?.id !== id) throw new Error("Profile was not saved.");
            if (!alive.current) return;
            dispatch(updateUser({ name: result.data.editProfile.name }));
          } catch { if (alive.current) unavailable("We couldn’t save your name. Please try again."); return; }
          finally { inFlight.current = false; if (alive.current) setBusy(false); }
        }
        go(draft.mode === "provider" ? "work" : "location"); break;
      }
      case "manual-location":
        setBusy(true);
        try { await finishArea({ label: draft.customerArea.trim() }); }
        catch { unavailable("We couldn’t save your area on this device. Please try again."); }
        finally { if (alive.current) setBusy(false); } break;
      case "work": go("service-area"); break;
      case "service-area": update({ remote: false }); go("profile"); break;
      case "profile": go("gallery"); break;
      case "gallery": go("first-service"); break;
      case "first-service":
        if (effectivePreview) {
          if (scenario === "Network error") { unavailable("Preview: setup couldn’t be saved. Your draft is still here."); return; }
          setServiceConfirmed(true); go("complete");
        } else {
          // The legacy API cannot safely store working days/area/remote work
          // or create an unpublished first service. Do not drop those fields or publish.
          try { await draftState.saveNow(); unavailable(); }
          catch { unavailable("We couldn’t save your setup on this device. Keep this screen open and try again."); }
        }
        break;
      case "verification-documents":
        if (effectivePreview) {
          if (!idReady || !selfieReady) { unavailable("Select the sample ID and selfie to continue."); return; }
          if (scenario === "Network error") { unavailable("Preview: verification couldn’t be submitted. Please try again."); return; }
          setReviewConfirmed(true); go("verification-pending");
        } else identity();
        break;
      case "recovery-email":
      case "recovery-identity":
        unavailable("Account recovery is temporarily unavailable. Your phone number hasn’t been changed. Please try again later.");
        break;
    }
  };
  const allowedStep = stepAllowed(step, signedIn, effectivePreview);
  const safeStep = !effectivePreview && allowedStep === "complete" && !serviceConfirmed ? "first-service"
    : !effectivePreview && allowedStep === "verification-pending" && !reviewConfirmed ? "verification-intro" : allowedStep;
  const previewBar = effectivePreview ? <View style={styles.previewBar}>
    <AppText variant="footnote" color={Colors.textSecondary} style={{ flex: 1 }}>LOCAL PREVIEW · No real sign-in · Code 123456</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel="Onboarding preview states" onPress={() => setStatesOpen(true)} style={styles.statesButton}><AppText variant="caption" color={Colors.primary}>States</AppText></Pressable>
  </View> : undefined;
  if (safeStep.startsWith("recovery")) return <Redirect href={effectivePreview?{pathname:"/recovery-preview",params:{entry:"start"}}:"/recovery"}/>;
  if (!ready) return <OnboardingFrame title="Your setup" onBack={back} previewBar={previewBar}><LogoLoader label="Restoring your progress" /></OnboardingFrame>;
  return <View style={styles.screen}>
    <OnboardingScreen step={safeStep} draft={draft} update={update} onBack={back} onNext={() => { void next(); }}
      testLoginAvailable={__DEV__ && !effectivePreview && initialStep === "sign-in"}
      localTest={__DEV__ && !effectivePreview && (step === "sign-in" ? isTestLoginPhone(draft.phone, __DEV__) : !!challenge?.testLogin)}
      onGo={go} onRole={mode => { update({ mode }); go("phone"); }} onHome={home} onLocation={() => { void locate(); }}
      onPhoto={kind => { void photo(kind); }} code={code} onCode={value => { setCode(value); setOtpError(undefined); }}
      onResend={() => { void send(true); }} resendSeconds={resendSeconds} busy={busy || verification.busy} error={error ?? (draftState.storageError ? "We couldn’t save your progress on this device." : undefined)}
      otpError={otpError} previewBar={previewBar} recoveryMethod={recoveryMethod} setRecoveryMethod={setRecoveryMethod}
      recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} recoveryName={recoveryName} setRecoveryName={setRecoveryName}
      idReady={idReady} selfieReady={selfieReady} onIdentity={kind => {
        if (effectivePreview) { if (kind === "id") setIdReady(true); else setSelfieReady(true); toast.info("Preview: sample document selected. No identity file was collected."); }
        else identity();
      }} />
    {effectivePreview ? <Modal visible={statesOpen} transparent onRequestClose={() => setStatesOpen(false)}>
      <View style={styles.overlay}><ScrollView style={styles.panel} contentContainerStyle={{ gap: Space.lg, padding: Space.xl }}>
        <AppText variant="h3">Onboarding preview states</AppText>
        <Callout message="Everything here uses local sample data. This preview cannot sign in, create an account, publish a service, send SMS, or upload identity documents." />
        <AppText variant="label">Response scenario</AppText>
        <View style={styles.choices}>{scenarioNames.map(item => <SelectionChip key={item} label={item} selected={scenario === item} onPress={() => { setScenario(item); setStatesOpen(false); }} />)}</View>
        <AppText variant="label">Open a screen</AppText>
        <View style={styles.choices}>{steps.filter(item => previewStepLabels[item]).map(item => <SelectionChip key={item} label={previewStepLabels[item]!} selected={step === item} onPress={() => {
          setStep(item); setError(undefined); setOtpError(undefined); history.current = [];
          if (["work","service-area","profile","gallery","first-service","complete","verification-intro","verification-documents","verification-pending"].includes(item)) update({ mode: "provider" });
          if (item === "complete") setServiceConfirmed(true);
          if (item === "verification-pending") setReviewConfirmed(true);
          setStatesOpen(false);
        }} />)}</View>
        <Button title="Reset preview draft" variant="outline" onPress={() => { draftState.reset(); setStep("role"); setCode(""); setChallenge(null); setRetryAt(0); setIdReady(false); setSelfieReady(false); setServiceConfirmed(false); setReviewConfirmed(false); history.current = []; setStatesOpen(false); }} />
        <Button title="Close states" variant="subtle" onPress={() => setStatesOpen(false)} />
      </ScrollView></View>
    </Modal> : null}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  previewBar: { minHeight: 44, paddingLeft: Space.md, paddingRight: Space.xs, flexDirection: "row", alignItems: "center", backgroundColor: Colors.background },
  statesButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: Space.sm },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "center", padding: Space.page },
  panel: { flexGrow: 0, maxHeight: "90%", borderRadius: Corners.panel, backgroundColor: Colors.surface },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
});

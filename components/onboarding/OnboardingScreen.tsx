import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Callout } from "@/components/Callout";
import { SelectionChip } from "@/components/SelectionChip";
import { VerificationCode } from "@/components/VerificationCode";
import { OnboardingFrame, TextAction, onboardingStyles as ui } from "@/components/onboarding/OnboardingFrame";
import { DayChips, RecoveryChoice, RoleCard } from "@/components/onboarding/ChoiceCards";
import { ProfilePhotos, PublicPhotoKind, ServicePhoto, WorkPhotos } from "@/components/onboarding/MediaFields";
import { categories } from "@/constants/categories";
import Colors from "@/constants/colors";
import { Corners, Space } from "@/constants/layout";
import { maskedPhone, normalizedPhone, OnboardingDraft, OnboardingStep, priceCents, validName } from "@/lib/onboarding/model";
import type { AppMode } from "@/lib/appMode";
import { testLoginCode, testLoginFieldPhone } from "@/lib/onboarding/testLogin";

export type OnboardingScreenProps = {
  step: OnboardingStep; draft: OnboardingDraft; update: (patch: Partial<OnboardingDraft>) => void;
  onBack: () => void; onNext: () => void; onGo: (step: OnboardingStep) => void;
  onRole: (mode: AppMode) => void; onHome: () => void; onLocation: () => void;
  code: string; onCode: (value: string) => void; onResend: () => void; resendSeconds: number;
  onPhoto: (kind: PublicPhotoKind) => void; busy: boolean; error?: string; otpError?: string; previewBar?: ReactNode;
  recoveryMethod: "email" | "identity"; setRecoveryMethod: (method: "email" | "identity") => void;
  recoveryEmail: string; setRecoveryEmail: (value: string) => void; recoveryName: string; setRecoveryName: (value: string) => void;
  idReady: boolean; selfieReady: boolean; onIdentity: (kind: "id" | "selfie") => void;
  testLoginAvailable?: boolean; localTest?: boolean;
  /** Offered on the phone sign-in: sign in with an email and password instead. */
  onEmailSignIn?: () => void;
};
export function OnboardingScreen(p: OnboardingScreenProps) {
  const { step, draft: d, busy } = p;
  const field = (key: "firstName" | "lastName" | "customerArea" | "area" | "businessName" | "introduction" | "serviceName" | "serviceDescription" | "startingPrice", label: string, placeholder: string, multiline = false) =>
    <Input key={key} label={label} placeholder={placeholder} value={d[key]} onChangeText={value => p.update({ [key]: value })}
      multiline={multiline} editable={!busy} maxLength={multiline ? 1000 : key === "startingPrice" ? 20 : key === "firstName" || key === "lastName" ? 60 : 120}
      neutralBorderColor={key === "introduction" ? Colors.borderControl : undefined}
      inputMode={key === "startingPrice" ? "decimal" : "text"} keyboardType={key === "startingPrice" ? "decimal-pad" : "default"} />;
  const phone = <Input label={step === "recovery-identity" ? "Old phone number" : "Phone number"} prefix="+234" placeholder="801 234 5678"
    value={d.phone} onChangeText={phone => p.update({ phone })} keyboardType="phone-pad" inputMode="tel" autoComplete="tel-national" textContentType="telephoneNumber" editable={!busy} maxLength={24} />;
  let title = "", description = "";
  let body: ReactNode, actions: ReactNode;
  const next = (label: string, enabled = true) => <Button title={label} onPress={p.onNext} disabled={!enabled || busy} loading={busy} />;
  switch (step) {
    case "role":
      title = "How do you want to use KraftKonect?"; description = "Choose what you want to do first. You can switch roles later from your account.";
      body = <><View style={{ gap: Space.md }}><RoleCard mode="customer" onPress={() => p.onRole("customer")} /><RoleCard mode="provider" onPress={() => p.onRole("provider")} /></View>
        <AppText variant="captionMedium" color={Colors.textSecondary} style={ui.centered}>One account. Both sides of KraftKonect.</AppText></>;
      actions = <AppText variant="footnote" color={Colors.textSecondary} style={ui.centered}>By continuing, you agree to our Terms and Privacy Policy.</AppText>; break;
    case "sign-in":
    case "phone":
      title = step === "sign-in" ? "Welcome back" : "What's your phone number?";
      description = step === "sign-in" ? "Enter the phone number linked to your KraftKonect account." : "We use your number to create and secure your KraftKonect account.";
      body = <>{phone}{step === "sign-in" ? <><View style={styles.phoneInfo}><AppText variant="captionRelaxed" color={Colors.textSecondary}>{p.localTest ? "Use the local test code. No SMS will be sent." : "We’ll text you a one-time sign-in code."}</AppText></View>
        <TextAction title="No longer have access to this number?" onPress={() => p.onGo("recovery")} /></> :
        <View style={styles.sms}><AppText variant="footnote" style={{ width: 38, textAlign: "center" }}>SMS</AppText><AppText variant="captionRelaxed" color={Colors.textSecondary} style={{ flex: 1 }}>We’ll send a 6-digit verification code.</AppText></View>}
        {__DEV__ && p.testLoginAvailable ? <Callout title="Local test account" message={"Enter " + testLoginFieldPhone + " and use code " + testLoginCode + ". Opens sample data in development only. No SMS is sent."} /> : null}</>;
      actions = <>{next(step === "sign-in" ? "Send code" : "Continue", !!normalizedPhone(d.phone))}
        {step === "sign-in" && p.onEmailSignIn ? <TextAction title="Use email and password instead" onPress={p.onEmailSignIn} disabled={busy} /> : null}
        {step === "sign-in" ? <TextAction title="New to KraftKonect? Get started" onPress={() => p.onGo("role")} /> : null}</>; break;
    case "sign-in-code":
    case "phone-code":
      title = step === "sign-in-code" ? "Enter your sign-in code" : "Enter the code";
      description = p.localTest ? "Local test code for " + maskedPhone(normalizedPhone(d.phone) ?? d.phone) + ". Use " + testLoginCode + "; no SMS was sent." : "We sent a 6-digit code to " + maskedPhone(normalizedPhone(d.phone) ?? d.phone) + ".";
      body = <><VerificationCode value={p.code} onChange={p.onCode} error={p.otpError} disabled={busy} />
        <View style={{ gap: Space.xs }}><AppText variant="bodySmall" color={Colors.textSecondary} style={ui.centered}>Didn’t get the code?</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={p.resendSeconds ? "Resend code in " + p.resendSeconds + " seconds" : "Resend code"}
            disabled={busy || p.resendSeconds > 0} accessibilityState={{ disabled: busy || p.resendSeconds > 0 }} onPress={p.onResend} hitSlop={10} style={styles.resend}>
            <AppText variant="labelSmall" color={p.resendSeconds ? Colors.disabled : Colors.primary}>
              {p.resendSeconds ? "Resend in " + String(Math.floor(p.resendSeconds / 60)).padStart(2, "0") + ":" + String(p.resendSeconds % 60).padStart(2, "0") : "Resend code"}
            </AppText>
          </Pressable></View></>;
      actions = next(step === "sign-in-code" ? "Sign in" : "Verify number", p.code.length === 6); break;
    case "name":
      title = "What should we call you?"; description = "Use the name you want customers and providers to see.";
      body = <>{field("firstName","First name","e.g. Peter")}{field("lastName","Last name","e.g. Pan")}
        <AppText variant="captionRelaxed" color={Colors.textSecondary}>You can update this later in Account.</AppText></>;
      actions = next("Continue", validName(d.firstName) && validName(d.lastName)); break;
    case "location":
      title = "Find trusted pros near you"; description = "Your location helps KraftKonect show providers who actually serve your area.";
      body = <View style={styles.location}>
        <Image source={require("@/assets/onboarding/3e0a0.svg")} style={{ width: 48, height: 48 }} />
        <AppText variant="titleSmall" style={ui.centered}>Use your current location</AppText>
        <AppText variant="bodySmall" color={Colors.textSecondary} style={ui.centered}>We only use it to match you with nearby services.</AppText>
      </View>;
      actions = <><Button title="Use my location" onPress={p.onLocation} loading={busy} /><TextAction title="Enter area manually" onPress={() => p.onGo("manual-location")} disabled={busy} /></>; break;
    case "manual-location":
      title = "Manual location"; description = "Your location helps KraftKonect show providers who actually serve your area.";
      body = field("customerArea","Location","e.g. Ikeja");
      actions = <>{next("Use this location", d.customerArea.trim().length >= 2)}<TextAction title="Use my location instead" onPress={() => p.onGo("location")} /></>; break;
    case "work":
      title = "What kind of work do you do?"; description = "Choose the service area that best describes your main work. You can add more services later.";
      body = <><Input label="Search your work" placeholder="e.g. plumber, electrician, Chef" value={d.workType} editable={!busy}
        onChangeText={workType => p.update({ workType, category: "" })} maxLength={100} />
        {d.workType.trim() && !d.category ? <View style={styles.suggestions}>{categories.filter(c => c.name.toLowerCase().includes(d.workType.toLowerCase()) || c.id.includes(d.workType.toLowerCase())).slice(0, 5).map(c =>
          <SelectionChip key={c.id} label={c.name} onPress={() => p.update({ workType: c.name, category: c.id })} />)}</View> : null}
        <View style={{ gap: 10 }}><AppText variant="labelSmall">General availability</AppText><DayChips days={d.workingDays} onChange={workingDays => p.update({ workingDays })} /></View></>;
      actions = next("Continue", !!d.workType.trim() && d.workingDays.length > 0); break;
    case "service-area":
      title = "Where do you provide services?"; description = "Set the area you’re willing to travel to for jobs.";
      body = field("area","Primary area","e.g. Lekki, Lagos");
      actions = <>{next("Continue", d.area.trim().length >= 2)}<TextAction title="I work remotely" onPress={() => { p.update({ remote: true }); p.onGo("profile"); }} /></>; break;
    case "profile":
      title = "Build your provider profile"; description = "A clear photo and short introduction help customers feel confident booking you.";
      body = <><ProfilePhotos banner={d.banner} avatar={d.avatar} onPhoto={p.onPhoto} /><View style={{ gap: Space.sm }}>
        {field("businessName","Business name","Golden star Plumbing")}{field("introduction","Short introduction","Tell customers about your experience",true)}</View></>;
      actions = next("Continue", !!d.businessName.trim() && !!d.introduction.trim() && !!d.avatar); break;
    case "gallery":
      title = "Build your profile gallery."; description = "Show customers examples of your work.";
      body = <WorkPhotos photos={d.gallery} onAdd={() => p.onPhoto("gallery")} onRemove={i => p.update({ gallery: d.gallery.filter((_, index) => i !== index) })} />;
      actions = next("Continue"); break;
    case "first-service":
      title = "Add your first service"; description = "Give customers enough information to understand what they’re booking.";
      body = <><ServicePhoto photo={d.servicePhoto} onPress={() => p.onPhoto("servicePhoto")} />
        {field("serviceName","Service name","e.g. Solar panel installation")}{field("serviceDescription","Short description","What is included in this service?",true)}
        {field("startingPrice","Starting price","₦ e.g. 15,000")}</>;
      actions = next("Continue", !!d.servicePhoto && !!d.serviceName.trim() && !!d.serviceDescription.trim() && priceCents(d.startingPrice) != null); break;
    case "complete":
      title = "You’re ready for provider mode"; description = "Your first service is set up. It will become visible to customers as soon as verification is approved.";
      body = <><Callout title="Service created" message="You can edit pricing, photos and availability anytime from Provider Home." tone="success" />
        <Callout title="To get booked faster" titleVariant="labelSmall" message="Keep your availability current and Reply quickly to requests." /></>;
      actions = <><Button title="Get verified" onPress={() => p.onGo("verification-intro")} /><TextAction title="Go to provider home" onPress={p.onHome} /></>; break;
    case "verification-intro":
      title = "Get verified to be listed"; description = "Verification is required before customers can discover or book your services.";
      body = <><Callout title="Why verification matters" message="It helps customers know that providers on KraftKonect are real and accountable." />
        <View style={{ gap: 10 }}><AppText variant="labelSmall">You’ll need</AppText>
          <View style={ui.tight}><AppText variant="labelSupport">Government-issued ID</AppText><AppText variant="captionRelaxed" color={Colors.textSecondary}>National ID, passport or driver’s licence</AppText></View>
          <View style={ui.tight}><AppText variant="labelSupport">A clear selfie</AppText><AppText variant="captionRelaxed" color={Colors.textSecondary}>Used only to confirm your identity</AppText></View>
        </View></>;
      actions = <><Button title="Start verification" onPress={() => p.onGo("verification-documents")} /><TextAction title="Skip for now" onPress={p.onHome} /></>; break;
    case "verification-documents":
      title = "Verify your identity"; description = "Upload clear images. Your details are kept private and are not shown to customers.";
      body = <View style={{ gap: Space.md }}>{(["id","selfie"] as const).map(kind => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={kind === "id" ? "Government-issued ID" : "Selfie"}
        onPress={() => p.onIdentity(kind)} disabled={busy} style={styles.upload}>
        <AppText variant="labelSupport">{kind === "id" ? "Government-issued ID" : "Selfie"}</AppText>
        <AppText variant="bodySmall" color={Colors.primary}>{kind === "id" ? p.idReady ? "Sample ID selected" : "Tap to upload front image" : p.selfieReady ? "Sample selfie selected" : "Tap to take or upload a photo"}</AppText>
      </Pressable>)}</View>;
      actions = next("Submit for review"); break;
    case "verification-pending":
      title = "Verification submitted"; description = "We’re reviewing your information. You can set up your first service while you wait.";
      body = <><Callout title="Review in progress" message="You won’t appear in customer search until verification is approved." tone="warning" />
        <Callout title="What you can do now" titleVariant="labelSupport" message="Create your first service if you have not done that or go to provider home and return anytime" style={{ borderRadius: 0, padding: 14 }} /></>;
      actions = <Button title="Go to provider home" onPress={p.onHome} />; break;
    case "account-missing":
      title = "We couldn't find that account"; description = "Check the phone number or choose what you want to do next.";
      body = <Callout title="No account is linked to this number" message="Try another number, create a new account, or recover an account tied to an old number." tone="warning" />;
      actions = <><Button title="Recover existing account" onPress={() => p.onGo("recovery")} /><Button title="Create new account" variant="outline" onPress={() => p.onGo("role")} /></>; break;
    case "recovery":
      title = "Recover your account"; description = "Choose the safest recovery option you can still access.";
      body = <><View style={styles.phoneInfo}><AppText variant="captionRelaxed" color={Colors.textSecondary}>No recovery email on file? Choose Verify your identity instead.</AppText></View>
        <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="Recovery method">
          <RecoveryChoice title="Use recovery email" description="Get a code at the recovery email saved on your account." selected={p.recoveryMethod === "email"} onPress={() => p.setRecoveryMethod("email")} />
          <RecoveryChoice title="Verify your identity" description="Use your old phone number, account name and verification history." selected={p.recoveryMethod === "identity"} onPress={() => p.setRecoveryMethod("identity")} />
        </View></>;
      actions = <Button title={p.recoveryMethod === "email" ? "Continue with recovery email" : "Continue with identity verification"} onPress={() => p.onGo(p.recoveryMethod === "email" ? "recovery-email" : "recovery-identity")} />; break;
    case "recovery-email":
      title = "Enter your recovery email"; description = "Use the recovery email previously saved on your account.";
      body = <><Input label="Recovery email" placeholder="Enter your recovery email" value={p.recoveryEmail} onChangeText={p.setRecoveryEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Full name" placeholder="Enter the name on your account" value={p.recoveryName} onChangeText={p.setRecoveryName} />
        <View style={styles.phoneInfo}><AppText variant="captionRelaxed" color={Colors.textSecondary}>If the email matches, we’ll send a 6-digit verification code.</AppText></View></>;
      actions = next("Send email code", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.recoveryEmail) && validName(p.recoveryName)); break;
    case "recovery-identity":
      title = "Find your old account"; description = "Enter the old sign-in number and the full name on the account.";
      body = <>{phone}<Input label="Full name" placeholder="Enter the name on your account" value={p.recoveryName} onChangeText={p.setRecoveryName} />
        <View style={styles.phoneInfo}><AppText variant="captionRelaxed" color={Colors.textSecondary}>Both details must match before identity verification continues.</AppText></View></>;
      actions = next("Continue", !!normalizedPhone(d.phone) && validName(p.recoveryName)); break;
  }
  return <OnboardingFrame title={title} description={description} actions={actions} onBack={p.onBack} previewBar={p.previewBar}>
    {body}{p.error ? <Callout title="Please try again" message={p.error} tone="warning" /> : null}
  </OnboardingFrame>;
}
const styles = StyleSheet.create({
  phoneInfo: { borderRadius: Corners.control, backgroundColor: Colors.background, padding: Space.md, minHeight: 54, justifyContent: "center" },
  sms: { flexDirection: "row", gap: 10, alignItems: "center", minHeight: 44, borderRadius: Corners.control, backgroundColor: Colors.primarySoft, paddingHorizontal: Space.md },
  location: { borderRadius: Corners.large, backgroundColor: Colors.background, paddingHorizontal: Space.xl, paddingVertical: Space.page, gap: 18, alignItems: "center" },
  resend: { minHeight: 24, alignItems: "center", justifyContent: "center" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
  upload: { padding: Space.lg, borderRadius: Corners.card, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.borderControl, gap: Space.sm },
});

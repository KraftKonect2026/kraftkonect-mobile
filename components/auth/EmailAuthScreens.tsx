// Sign in, sign up, confirm the email, and forgotten password: the email-and-password way in, for people who would rather
// not use a phone number. Built from the same frame, fields and buttons as the phone sign-in.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Input } from "@/components/Input";
import { VerificationCode } from "@/components/VerificationCode";
import { OnboardingFrame, TextAction, onboardingStyles as ui } from "@/components/onboarding/OnboardingFrame";
import Colors from "@/constants/colors";
import { homeForMode, resolveAppMode } from "@/lib/appMode";
import { askPasswordReset, cleanEmail, EmailSession, emailError, nameError, passwordError, resendEmailCode, resetPassword, signInWithEmail, signUpWithEmail, verifyEmailCode } from "@/lib/account/liveEmailAuth";
import { store, useAppDispatch, useAppSelector } from "@/store";
import { setActiveMode, setIsAuthenticated, setTokens, setUser } from "@/store/authSlice";
import { useToast } from "@/lib/toast";
import type { User } from "@/types";

/** One place that runs an action, shows the server's own sentence if it is refused, and ignores a second tap. */
function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>();
  const lock = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = async (work: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(undefined);
    try { await work(); } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return { busy, error, run, setError };
}

/** Keep the tokens and the person. Once the email is confirmed the app opens; until then they confirm it first. */
function useStartSession() {
  const router = useRouter(), dispatch = useAppDispatch();
  return (session: EmailSession, opts: { confirmed: boolean }) => {
    dispatch(setUser(session.user as unknown as User));
    dispatch(setTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken }));
    if (opts.confirmed) {
      // Turn the signed-in state on first so the app's screens exist, then go to the home screen.
      dispatch(setIsAuthenticated(true));
      router.replace(homeForMode(resolveAppMode(store.getState().auth)));
    } else router.replace("/email-verify" as never);
  };
}

export function EmailSignInScreen() {
  const router = useRouter(), client = useApolloClient(), start = useStartSession(), { showToast } = useToast();
  const lastEmail = useAppSelector(s => s.auth.lastEmail);
  const [email, setEmail] = useState(lastEmail ?? ""), [password, setPassword] = useState("");
  const { busy, error, run } = useAction();
  const ready = !emailError(email) && password.length > 0;
  const submit = () => run(async () => {
    const accountAtStart = store.getState().auth.user?.id;
    const session = await signInWithEmail(client, email, password);
    if (accountAtStart !== store.getState().auth.user?.id) return;
    showToast("success", "Signed in");
    start(session, { confirmed: session.emailVerified });
  });
  return <OnboardingFrame title="Sign in with email" description="Use the email and password for your KraftKonect account." onBack={() => (router.canGoBack() ? router.back() : router.replace("/sign-in" as never))}
    actions={<>
      <Button title="Sign in" onPress={() => void submit()} loading={busy} disabled={!ready || busy} />
      <TextAction title="Use my phone number instead" onPress={() => router.replace("/sign-in" as never)} disabled={busy} />
      <TextAction title="New to KraftKonect? Create an account" onPress={() => router.push("/email-sign-up" as never)} disabled={busy} />
    </>}>
    <Fields>
      <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" autoComplete="email" textContentType="emailAddress" editable={!busy} maxLength={254}
        error={email && emailError(email) ? emailError(email) : undefined} />
      <Input label="Password" placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" editable={!busy} maxLength={72} onSubmitEditing={() => ready && void submit()} returnKeyType="go" />
      <TextAction title="Forgot your password?" onPress={() => router.push("/forgot-password" as never)} disabled={busy} />
    </Fields>
    {error ? <Callout tone="error" message={error} /> : null}
  </OnboardingFrame>;
}

export function EmailSignUpScreen() {
  const router = useRouter(), client = useApolloClient(), start = useStartSession();
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [again, setAgain] = useState("");
  const { busy, error, run } = useAction();
  const mismatch = again.length > 0 && again !== password;
  const ready = !nameError(name) && !emailError(email) && !passwordError(password) && again === password;
  const submit = () => run(async () => {
    const accountAtStart = store.getState().auth.user?.id;
    const session = await signUpWithEmail(client, { name, email, password });
    if (accountAtStart !== store.getState().auth.user?.id) return;
    start(session, { confirmed: false });
  });
  return <OnboardingFrame title="Create your account" description="This creates a customer account. To offer your services, sign up with your phone number instead." onBack={() => (router.canGoBack() ? router.back() : router.replace("/email-sign-in" as never))}
    actions={<>
      <Button title="Create account" onPress={() => void submit()} loading={busy} disabled={!ready || busy} />
      <TextAction title="I already have an account" onPress={() => router.replace("/email-sign-in" as never)} disabled={busy} />
      <AppText variant="footnote" color={Colors.textSecondary} style={ui.centered}>By continuing, you agree to our Terms and Privacy Policy.</AppText>
    </>}>
    <Fields>
      <Input label="Full name" placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" editable={!busy} maxLength={80} />
      <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" autoComplete="email" textContentType="emailAddress" editable={!busy} maxLength={254}
        error={email && emailError(email) ? emailError(email) : undefined} />
      <Input label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" editable={!busy} maxLength={72}
        error={password && passwordError(password) ? passwordError(password) : undefined} />
      <Input label="Confirm password" placeholder="Type it again" value={again} onChangeText={setAgain} secureTextEntry autoComplete="new-password" textContentType="newPassword" editable={!busy} maxLength={72}
        error={mismatch ? "The passwords don’t match." : undefined} />
    </Fields>
    {error ? <Callout tone="error" message={error} /> : null}
  </OnboardingFrame>;
}

/** Confirm the email with the 6-digit code. A code is sent as soon as this screen opens. */
export function EmailVerifyScreen() {
  const router = useRouter(), client = useApolloClient(), start = useStartSession(), { showToast } = useToast(), dispatch = useAppDispatch();
  // Set when the person signed up inside onboarding: after the code they carry on with setup instead of landing on home.
  const params = useLocalSearchParams<{ continue?: string }>();
  const email = useAppSelector(s => s.auth.user?.email) ?? "";
  const [code, setCode] = useState(""), [wait, setWait] = useState(0);
  const { busy, error, run, setError } = useAction();
  const sent = useRef(false);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  const send = (quiet = false) => run(async () => { await resendEmailCode(client, email); setWait(60); if (!quiet) showToast("success", "A new code is on its way."); });
  useEffect(() => { if (sent.current || !email) return; sent.current = true; void send(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [email]);
  const confirm = (value = code) => run(async () => {
    const session = await verifyEmailCode(client, email, value);
    if (params.continue !== "onboarding") { start(session, { confirmed: true }); return; }
    const mode = (session.user as { role?: string }).role === "provider" ? "provider" : "customer";
    dispatch(setUser(session.user as unknown as User));
    dispatch(setTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken }));
    dispatch(setIsAuthenticated(true));
    dispatch(setActiveMode(mode));
    router.replace({ pathname: "/onboarding", params: { step: mode === "provider" ? "work" : "location" } } as never);
  });
  const back = () => { setError(undefined); router.replace("/email-sign-in" as never); };
  return <OnboardingFrame title="Check your email" description={email ? `Enter the 6-digit code we sent to ${cleanEmail(email)}.` : "Sign in again to get a new code."} onBack={back}
    actions={<>
      <Button title="Confirm email" onPress={() => void confirm()} loading={busy} disabled={code.length !== 6 || busy || !email} />
      <TextAction title={wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"} onPress={() => void send()} disabled={busy || wait > 0 || !email} />
    </>}>
    <VerificationCode value={code} onChange={setCode} onComplete={v => void confirm(v)} disabled={busy} />
    {error ? <Callout tone="error" message={error} /> : null}
  </OnboardingFrame>;
}

/** Forgot your password: your email first, then the code we send and a new password. */
export function ForgotPasswordScreen() {
  const router = useRouter(), client = useApolloClient(), { showToast } = useToast();
  const lastEmail = useAppSelector(s => s.auth.lastEmail);
  const [step, setStep] = useState<"email" | "code">("email"), [email, setEmail] = useState(lastEmail ?? ""), [code, setCode] = useState(""), [password, setPassword] = useState("");
  const { busy, error, run, setError } = useAction();
  const send = () => run(async () => { await askPasswordReset(client, email); setStep("code"); showToast("success", "If that email has an account, a code is on its way."); });
  const save = () => run(async () => { await resetPassword(client, email, code, password); showToast("success", "Password changed. Sign in with your new password."); router.replace("/email-sign-in" as never); });
  const back = () => { setError(undefined); if (step === "code") setStep("email"); else if (router.canGoBack()) router.back(); else router.replace("/email-sign-in" as never); };
  return <OnboardingFrame title={step === "email" ? "Forgot your password?" : "Choose a new password"}
    description={step === "email" ? "Enter the email on your account. We’ll send you a 6-digit code." : `Enter the code we sent to ${cleanEmail(email)}, then choose a new password.`} onBack={back}
    actions={step === "email" ? <>
      <Button title="Send code" onPress={() => void send()} loading={busy} disabled={!!emailError(email) || busy} />
    </> : <>
      <Button title="Change password" onPress={() => void save()} loading={busy} disabled={code.length !== 6 || !!passwordError(password) || busy} />
      <TextAction title="Send a new code" onPress={() => void send()} disabled={busy} />
    </>}>
    {step === "email" ? (
      <Fields><Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" autoComplete="email" textContentType="emailAddress" editable={!busy} maxLength={254}
        error={email && emailError(email) ? emailError(email) : undefined} /></Fields>
    ) : (
      <Fields>
        <VerificationCode value={code} onChange={setCode} disabled={busy} />
        <Input label="New password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" editable={!busy} maxLength={72}
          error={password && passwordError(password) ? passwordError(password) : undefined} />
      </Fields>
    )}
    {error ? <Callout tone="error" message={error} /> : null}
  </OnboardingFrame>;
}

function Fields({ children }: { children: ReactNode }) { return <View style={ui.fields}>{children}</View>; }

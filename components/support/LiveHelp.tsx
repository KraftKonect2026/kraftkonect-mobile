import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Input } from "@/components/Input";
import { LogoLoader } from "@/components/LogoLoader";
import { Frame, IconButton } from "@/components/discovery/Parts";
import { helpKind, HelpThread, loadThread, markHelpRead, sendHelp } from "@/lib/support/liveHelp";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { store, useAppSelector } from "@/store";
import Colors from "@/constants/colors";

/** A conversation with KraftKonect support about help or feedback. */
export function LiveHelp() {
  const params = useLocalSearchParams<{ kind?: string }>(), kind = helpKind(params.kind), router = useRouter(), client = useApolloClient();
  const ownerId = useAppSelector(s => s.auth.user?.id), signedIn = useAppSelector(s => s.auth.isAuthenticated && !!s.auth.accessToken);
  const [thread, setThread] = useState<HelpThread | null>(), [loaded, setLoaded] = useState(false), [text, setText] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState<string>();
  const alive = useRef(true), lock = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const still = useCallback(() => { const a = store.getState().auth; return alive.current && !!ownerId && sameAccountSession(ownerId, a.user?.id, a.isAuthenticated && !!a.accessToken); }, [ownerId]);

  const refresh = useCallback(async (quiet = false) => {
    if (!ownerId) return;
    try { const t = await loadThread(client, ownerId, kind); if (!still()) return; setThread(t); setLoaded(true); if (t?.unread) void markHelpRead(client, ownerId, t.id).catch(() => undefined); }
    catch (e) { if (still() && !quiet) { setError(e instanceof Error ? e.message : "Your conversation could not be loaded."); setLoaded(true); } }
  }, [client, ownerId, kind, still]);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(true), 10000); return () => clearInterval(timer); }, [refresh]);

  const send = async () => {
    if (lock.current || !ownerId || !text.trim()) return;
    lock.current = true; setBusy(true); setError(undefined);
    try { const t = await sendHelp(client, ownerId, kind, text); if (!still()) return; setThread(t); setText(""); }
    catch (e) { if (still()) setError(e instanceof Error ? e.message : "The message could not be sent."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace("/(app)/(tabs)/profile"); };

  if (!signedIn) return <Redirect href="/sign-in" />;
  const open = !thread || thread.status !== "resolved";
  const title = kind === "feedback" ? "Give us feedback" : "Message support";
  const header = <><IconButton name="back" label="Back" onPress={back} /><View style={{ flex: 1, minWidth: 0, gap: 2 }}><AppText variant="labelSupport">{title}</AppText>{thread && <AppText variant="bodySmall" color={Colors.textSecondary}>Reference {thread.reference}</AppText>}</View></>;
  const footer = loaded ? <View style={{ gap: 8 }}>
    {error && <Callout tone="error" message={error} />}
    {!open && <Callout title="This conversation is closed" message={thread?.outcome ?? "Start a new one below if you still need help."} />}
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      <Input placeholder={kind === "feedback" ? "What would you like us to know?" : "How can we help?"} value={text} editable={!busy} onChangeText={setText} maxLength={1000} onSubmitEditing={() => void send()} containerStyle={{ flex: 1, width: undefined }} />
      <Button title="Send" size="compact" loading={busy} disabled={!text.trim()} onPress={() => void send()} />
    </View>
  </View> : undefined;
  return <View style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", backgroundColor: Colors.surface }}>
    <Frame header={header} headerGap={12} headerHeight={56} contentStyle={{ paddingTop: 12, gap: 12 }} footer={footer} footerStyle={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
      {!loaded ? <LogoLoader label="Loading" /> : <>
        {!thread?.messages.length && <View style={{ gap: 8, paddingVertical: 8 }}>
          <AppText variant="h3">{kind === "feedback" ? "We’d love to hear from you" : "We’re here to help"}</AppText>
          <AppText variant="body" color={Colors.textSecondary}>{kind === "feedback" ? "Tell us what is working and what is not." : "Tell us what is going on and our team will reply here. For a problem with one booking, open that booking and choose Report a problem."}</AppText>
        </View>}
        {thread?.messages.map(m => <View key={m.id} style={{ alignSelf: m.sender === "you" ? "flex-end" : "flex-start", backgroundColor: m.sender === "you" ? Colors.primary : Colors.background, padding: 12, borderRadius: 16, maxWidth: "86%", gap: 6 }}>
          {m.sender === "support" && <AppText variant="captionEmphasis" color={Colors.textSecondary}>KraftKonect support</AppText>}
          <AppText variant="body" color={m.sender === "you" ? Colors.textOnPrimary : Colors.textPrimary}>{m.text}</AppText>
          {m.at && <AppText variant="captionRegular" color={m.sender === "you" ? Colors.textOnPrimary : Colors.textSecondary} style={{ textAlign: "right" }}>{new Date(m.at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}</AppText>}
        </View>)}
      </>}
    </Frame>
  </View>;
}

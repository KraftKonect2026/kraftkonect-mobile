import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { DesignIcon } from "@/components/DesignIcon";
import { LogoLoader } from "@/components/LogoLoader";
import { Frame, TopBar } from "@/components/discovery/Parts";
import { Heading } from "@/components/bookings/Parts";
import { dayGroup, InboxItem, InboxLink, loadInbox, markInboxRead, whenLabel } from "@/lib/notifications/liveInbox";
import { sameAccountSession } from "@/lib/account/liveAccount";
import { store, useAppSelector } from "@/store";
import { selectActiveMode } from "@/store/authSlice";
import Colors from "@/constants/colors";

export function LiveNotifications() {
  const router = useRouter(), client = useApolloClient(), mode = useAppSelector(selectActiveMode);
  const ownerId = useAppSelector(s => s.auth.user?.id), signedIn = useAppSelector(s => s.auth.isAuthenticated && !!s.auth.accessToken);
  const [items, setItems] = useState<InboxItem[]>(), [unread, setUnread] = useState(0), [error, setError] = useState<string>(), [busy, setBusy] = useState(false), [more, setMore] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const still = useCallback(() => { const a = store.getState().auth; return alive.current && !!ownerId && sameAccountSession(ownerId, a.user?.id, a.isAuthenticated && !!a.accessToken); }, [ownerId]);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setError(undefined);
    try { const page = await loadInbox(client, ownerId); if (!still()) return; setItems(page.items); setUnread(page.unread); setMore(page.items.length >= 30); }
    catch (e) { if (still()) setError(e instanceof Error ? e.message : "Your notifications could not be loaded."); }
  }, [client, ownerId, still]);
  useEffect(() => { void load(); }, [load]);

  const older = async () => {
    if (!ownerId || !items?.length || busy) return;
    setBusy(true);
    try { const page = await loadInbox(client, ownerId, items[items.length - 1].at); if (!still()) return; setItems([...items, ...page.items.filter(n => !items.some(m => m.id === n.id))]); setMore(page.items.length >= 30); }
    catch (e) { if (still()) setError(e instanceof Error ? e.message : "Could not load older notifications."); }
    finally { if (alive.current) setBusy(false); }
  };
  const open = async (n: InboxItem) => {
    if (ownerId && !n.read) {
      setItems(current => current?.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
      void markInboxRead(client, ownerId, [n.id]).catch(() => undefined);
    }
    go(n.link);
  };
  const go = (link?: InboxLink) => {
    if (!link) return;
    if (link.type === "booking") router.push({ pathname: "/request/[id]", params: { id: link.id } });
    else if (link.type === "conversation") router.push({ pathname: "/chat/[providerId]", params: { providerId: link.id } });
    else if (link.type === "support") router.push({ pathname: "/support", params: { kind: "help" } });
    else router.push({ pathname: "/provider/earnings", params: { step: "payout", payoutId: link.id } });
  };
  const readAll = async () => {
    if (!ownerId || busy || !unread) return;
    setBusy(true);
    try { await markInboxRead(client, ownerId, "all"); if (!still()) return; setItems(current => current?.map(x => ({ ...x, read: true }))); setUnread(0); }
    catch (e) { if (still()) setError(e instanceof Error ? e.message : "Could not mark them read."); }
    finally { if (alive.current) setBusy(false); }
  };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace(mode === "provider" ? "/provider/(tabs)/today" : "/(app)/(tabs)"); };

  if (!signedIn) return <Redirect href="/sign-in" />;
  const groups = (["Today", "Earlier"] as const).map(g => ({ g, rows: (items ?? []).filter(n => dayGroup(n.at) === g) })).filter(x => x.rows.length);
  return <View style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", backgroundColor: Colors.surface }}>
    <Frame header={<TopBar onBack={back} />} contentStyle={{ paddingTop: 12, gap: 20 }}>
      <Heading title="Notifications" subtitle={mode === "provider" ? "Updates on requests, jobs and payments." : "Updates about your requests, bookings and payments."} />
      {error && <Callout tone="error" message={error} />}
      {!items && !error ? <LogoLoader label="Loading notifications" /> : !items ? <Button title="Try again" onPress={() => void load()} /> : !items.length ? (
        <View style={{ padding: 24, gap: 16, alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" }}><DesignIcon name="bell" /></View>
          <AppText variant="h3" style={{ textAlign: "center" }}>No notifications yet</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={{ textAlign: "center" }}>Your quote, booking and payment updates will appear here.</AppText>
        </View>
      ) : <>
        {unread > 0 && <Button title={"Mark all " + unread + " as read"} variant="subtle" size="compact" loading={busy} onPress={() => void readAll()} />}
        {groups.map(({ g, rows }) => <View key={g} style={{ gap: 4 }}>
          <AppText variant="labelSmall" color={Colors.textSecondary}>{g}</AppText>
          {rows.map(n => <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={n.title + ". " + n.body + (n.read ? "" : ". Unread")} onPress={() => void open(n)}
            style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: "flex-start" }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: n.read ? "transparent" : Colors.primary }} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant={n.read ? "body" : "labelSupport"}>{n.title}</AppText>
              <AppText variant="bodySmall" color={Colors.textSecondary}>{n.body}</AppText>
            </View>
            <AppText variant="captionRegular" color={Colors.textSecondary}>{whenLabel(n.at)}</AppText>
          </Pressable>)}
        </View>)}
        {more && <Button title="Show older" variant="outline" loading={busy} onPress={() => void older()} />}
      </>}
    </Frame>
  </View>;
}

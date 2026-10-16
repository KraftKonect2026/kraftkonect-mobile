import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useApolloClient } from "@apollo/client";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { InspectionJourney } from "@/components/bookings/InspectionJourney";
import { QuoteJourney } from "@/components/bookings/QuoteJourney";
import { WorkJourney } from "@/components/bookings/WorkJourney";
import type { WorkStep } from "@/components/bookings/WorkScreens";
import Colors from "@/constants/colors";
import { balanceVerified, BookingRecord, BookingRole } from "@/lib/bookings/model";
import { FLOW_BOOKING_QUERY, FlowBookingPayload, flowToRecord, friendlyError, runFlowCommand } from "@/lib/bookings/liveFlow";
import { useOpenChat } from "@/lib/useOpenChat";
import { useToast } from "@/lib/toast";
import { store, useAppSelector } from "@/store";

/** A real request / inspection / quote, loaded from and changed through the server. */
export function LiveRequest({ id }: { id: string }) {
  const owner = useAppSelector(s => s.auth.user?.id);
  if (!owner) return <Redirect href="/sign-in" />;
  return <LiveRequestOwned key={owner + ":" + id} owner={owner} id={id} />;
}

function LiveRequestOwned({ owner, id }: { owner: string; id: string }) {
  const client = useApolloClient(), router = useRouter(), toast = useToast(), insets = useSafeAreaInsets(), openChat = useOpenChat();
  const [payload, setPayload] = useState<FlowBookingPayload>();
  const [error, setError] = useState<string>();
  const [quoteFlow, setQuoteFlow] = useState(false);
  const [workFlow, setWorkFlow] = useState(false);
  const [workEntry, setWorkEntry] = useState<WorkStep>();
  const [generation, setGeneration] = useState(0);
  const latest = useRef<FlowBookingPayload | undefined>(undefined);
  const alive = useRef(true);
  const firstFocus = useRef(true);
  const current = useCallback(() => { const a = store.getState().auth; return alive.current && a.user?.id === owner && a.isAuthenticated && !!a.accessToken; }, [owner]);

  const load = useCallback(async () => {
    setError(undefined);
    try {
      const result = await client.query({ query: FLOW_BOOKING_QUERY, variables: { id }, fetchPolicy: "no-cache", context: { accountOwnerId: owner, queryDeduplication: false } });
      if (!current()) return;
      const next = (result.data as { flowBooking?: FlowBookingPayload | null } | undefined)?.flowBooking;
      if (!next) throw new Error("This request could not be found.");
      latest.current = next;
      setPayload(next);
    } catch (e) {
      if (current()) setError(friendlyError(e).message);
    }
  }, [client, current, id, owner]);

  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);
  // Coming back from the chat shows anything that changed meanwhile.
  useFocusEffect(useCallback(() => { if (firstFocus.current) { firstFocus.current = false; return; } void load(); }, [load]));

  const role: BookingRole | undefined = payload ? (payload.customerId === owner ? "customer" : payload.providerUserId === owner ? "provider" : undefined) : undefined;
  const record = useMemo<BookingRecord | undefined>(() => (payload ? flowToRecord(payload) : undefined), [payload]);

  const onCommand = async (_key: string, command: { type: string; [k: string]: unknown }) => {
    const cur = latest.current;
    if (!cur || !role) throw new Error("The request has not loaded yet.");
    try {
      const next = await runFlowCommand(client, owner, role, cur, command);
      if (current()) { latest.current = next; setPayload(next); }
      return flowToRecord(next);
    } catch (e) {
      // The other person changed it first: show the newest version, then report the problem.
      if (e instanceof Error && /changed/i.test(e.message)) void load();
      throw e;
    }
  };

  const toList = () => router.replace(role === "provider" ? "/provider/(tabs)/jobs" : "/(app)/(tabs)/bookings");
  const message = () => {
    if (!payload || !role) return;
    if (payload.conversationId) router.push({ pathname: "/chat/[providerId]", params: { providerId: payload.conversationId } });
    else void openChat(role === "customer" ? (payload.providerUserId ?? "") : payload.customerId);
  };
  const soon = (text: string) => toast.info(text);
  const work = (entry: WorkStep) => { setWorkEntry(entry); setWorkFlow(true); setQuoteFlow(false); setGeneration(v => v + 1); };

  let body;
  if (error) {
    body = <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: "center" }}>
      <Callout message={error} tone="error" />
      <Button title="Try again" onPress={() => void load()} />
      <Button title="Back to bookings" variant="outline" onPress={() => (router.canGoBack() ? router.back() : toList())} />
    </View>;
  } else if (!payload || !record) {
    body = <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><LogoLoader label="Loading your request" /></View>;
  } else if (!role) {
    body = <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: "center" }}>
      <AppText variant="h2">No access</AppText>
      <Callout message="This request belongs to other people, so it can’t be shown here." tone="error" />
      <Button title="Back to bookings" onPress={toList} />
    </View>;
  } else if (workFlow || balanceVerified(record)) {
    body = <WorkJourney key={role + ":" + generation + ":work"} record={record} role={role} entry={workEntry} onBookings={toList} onMessage={message} onCommand={onCommand}
      onBookAgain={() => router.push("/book-again")} onEarnings={() => router.push("/provider/earnings")}
      onSupportChat={conversationId => router.push({ pathname: "/chat/[providerId]", params: { providerId: conversationId } })} />;
  } else if (quoteFlow || record.quote) {
    body = <QuoteJourney key={role + ":" + generation + ":quote"} record={record} role={role} onBookings={toList} onMessage={message} onCommand={onCommand}
      onProgress={() => soon("Job progress will be available once your repair is booked.")}
      onCancel={() => soon("To cancel a paid booking, contact support so any refund can be reviewed.")}
      onReport={() => soon("Reporting a problem is coming in the next update. Contact support in the meantime.")} />;
  } else {
    body = <InspectionJourney key={role + ":" + generation} record={record} role={role} onBookings={toList} onMessage={message} onCommand={onCommand}
      onQuote={() => { setQuoteFlow(true); setWorkFlow(false); }}
      onPaidCancel={() => soon("To cancel a paid inspection, contact support so any refund can be reviewed.")}
      onReschedule={() => work("booking")} onProposal={() => work("proposal")}
      onContext={() => { setWorkFlow(false); setQuoteFlow(false); setGeneration(v => v + 1); }} />;
  }
  // The shared journey frames draw no top inset of their own, so this screen supplies it.
  return <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>{body}</View>;
}

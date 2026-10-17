import { useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { useRouter } from "expo-router";
import { Notifications } from "@/lib/push/native";
import { useAppSelector } from "@/store";
import { useToast } from "@/lib/toast";
import { configurePush, registerForPush } from "@/lib/push/push";
import { routeForPush } from "@/lib/push/pushRoute";

/** Mount once inside the providers (ready = the navigator exists): sets push up, registers this phone after sign-in, shows pushes that arrive while the app is open, and opens the right screen when one is tapped. */
export function usePushNotifications(ready: boolean) {
  const client = useApolloClient();
  const router = useRouter();
  const toast = useToast();
  const userId = useAppSelector((s) => (s.auth.isAuthenticated && s.auth.accessToken ? s.auth.user?.id : undefined));
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => { configurePush(); }, []);

  // Register this phone for whoever is signed in (and again if a different person signs in on it).
  useEffect(() => {
    if (userId) void registerForPush(client);
  }, [userId, client]);

  // A push arriving while the app is open: show it as the in-app toast.
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const { title, body } = n.request.content;
      if (title || body) toast.info(title ?? "KraftKonect", body ?? undefined);
    });
    return () => sub.remove();
  }, [toast]);

  // A tap, from the background or from a closed app (the hook also returns the one that launched the app).
  // Whether the native module exists is fixed for a given install, so this hook is always or never called.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const last = Notifications ? Notifications.useLastNotificationResponse() : undefined;
  useEffect(() => {
    if (!ready || !userId || !last) return;
    const id = last.notification.request.identifier + ":" + last.actionIdentifier;
    if (handled.current === id) return;
    handled.current = id;
    const route = routeForPush(last.notification.request.content.data);
    if (route) router.push(route as never);
  }, [ready, userId, last, router]);
}

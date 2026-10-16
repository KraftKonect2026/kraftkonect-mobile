// Notification settings: which kinds of push and email the person wants. The server keeps them and applies them.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const MY_NOTIFICATION_PREFERENCES = gql`query MyNotificationPreferences { myNotificationPreferences { bookingUpdates newMessages promotions emailNotifications pushNotifications } }`;
export const UPDATE_NOTIFICATION_PREFERENCES = gql`mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) { updateNotificationPreferences(input: $input) { bookingUpdates newMessages promotions emailNotifications pushNotifications } }`;

export type PrefKey = "pushNotifications" | "bookingUpdates" | "newMessages" | "promotions" | "emailNotifications";
export type Prefs = Record<PrefKey, boolean>;
/** What each switch means, in the order shown. Push comes first because it overrides the kinds below it. */
export const PREF_ROWS: { key: PrefKey; label: string; description: string }[] = [
  { key: "pushNotifications", label: "Push notifications", description: "Turn all alerts on your phone on or off" },
  { key: "bookingUpdates", label: "Booking and payment updates", description: "Requests, quotes, dates, payments and refunds" },
  { key: "newMessages", label: "Messages", description: "New messages from customers, providers and support" },
  { key: "emailNotifications", label: "Email updates", description: "Receipts and account notices by email" },
  { key: "promotions", label: "Offers and product news", description: "Tips and KraftKonect announcements" },
];
const KEYS = PREF_ROWS.map(r => r.key);

export function parsePrefs(value: unknown): Prefs {
  const r = value as Record<string, unknown> | null;
  if (!r || typeof r !== "object" || KEYS.some(k => typeof r[k] !== "boolean")) throw new Error("Your notification settings could not be loaded.");
  return Object.fromEntries(KEYS.map(k => [k, r[k] as boolean])) as Prefs;
}

type Client = Pick<ApolloClient<unknown>, "query" | "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

export async function loadPrefs(client: Client, ownerId: string): Promise<Prefs> {
  try { return parsePrefs(((await client.query({ query: MY_NOTIFICATION_PREFERENCES as never, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { myNotificationPreferences?: unknown } | null)?.myNotificationPreferences); }
  catch (e) { throw friendlyError(e); }
}
export async function savePref(client: Client, ownerId: string, key: PrefKey, value: boolean): Promise<Prefs> {
  if (!KEYS.includes(key)) throw new Error("Unknown setting.");
  try { return parsePrefs(((await client.mutate({ mutation: UPDATE_NOTIFICATION_PREFERENCES as never, variables: { input: { [key]: value } }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never)).data as { updateNotificationPreferences?: unknown } | null)?.updateNotificationPreferences); }
  catch (e) { throw friendlyError(e); }
}

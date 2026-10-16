// The notification list from the server: what happened, and where tapping it goes.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const MY_INBOX_QUERY = gql`
  query MyInbox($limit: Int, $before: DateTime) {
    myInbox(limit: $limit, before: $before) { unreadCount items { id title body linkType linkId createdAt read } }
  }
`;
export const MARK_INBOX_READ = gql`mutation MarkInboxRead($ids: [ID!], $all: Boolean) { markInboxRead(ids: $ids, all: $all) }`;

export type InboxLink = { type: "booking" | "conversation" | "payout" | "support"; id: string };
export type InboxItem = { id: string; title: string; body: string; at: string; read: boolean; link?: InboxLink };
export type InboxPage = { items: InboxItem[]; unread: number };

const LINKS = ["booking", "conversation", "payout", "support"] as const;
export function parseInbox(value: unknown): InboxPage {
  const r = value as { unreadCount?: unknown; items?: unknown } | null;
  if (!r || typeof r !== "object" || !Array.isArray(r.items) || !Number.isSafeInteger(r.unreadCount) || (r.unreadCount as number) < 0) throw new Error("Your notifications could not be loaded.");
  const seen = new Set<string>();
  const items = r.items.map((v): InboxItem => {
    const n = v as Record<string, unknown>;
    if (typeof n.id !== "string" || !n.id || seen.has(n.id) || typeof n.title !== "string" || typeof n.body !== "string" || typeof n.createdAt !== "string" || !Number.isFinite(Date.parse(n.createdAt))) throw new Error("A notification could not be confirmed.");
    seen.add(n.id);
    const link = typeof n.linkId === "string" && n.linkId && (LINKS as readonly unknown[]).includes(n.linkType) ? { type: n.linkType as InboxLink["type"], id: n.linkId } : undefined;
    return { id: n.id, title: n.title, body: n.body, at: n.createdAt, read: n.read === true, ...(link ? { link } : {}) };
  });
  return { items, unread: r.unreadCount as number };
}

type Client = Pick<ApolloClient<unknown>, "query" | "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

export async function loadInbox(client: Client, ownerId: string, before?: string): Promise<InboxPage> {
  try {
    const res = await client.query({ query: MY_INBOX_QUERY as never, variables: { limit: 30, before: before ?? null }, fetchPolicy: "no-cache", context: scoped(ownerId) } as never);
    return parseInbox((res.data as { myInbox?: unknown } | null)?.myInbox);
  } catch (e) { throw friendlyError(e); }
}
export async function markInboxRead(client: Client, ownerId: string, ids: string[] | "all"): Promise<void> {
  try { await client.mutate({ mutation: MARK_INBOX_READ as never, variables: ids === "all" ? { all: true } : { ids }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
}

export const dayGroup = (iso: string, now = new Date()) => (new Date(iso).toDateString() === now.toDateString() ? "Today" : "Earlier");
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
}

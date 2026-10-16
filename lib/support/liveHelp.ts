// Talking to KraftKonect support about something that is not one booking: help, or feedback.
// The server keeps one open conversation per kind; the app shows it and adds to it.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

const FIELDS = `id reference status outcome unread createdAt messages { id sender text at }`;
export const MY_HELP_THREAD = gql`query MyHelpThread($kind: String!) { myHelpThread(kind: $kind) { ${FIELDS} } }`;
export const SEND_HELP_MESSAGE = gql`mutation SendHelpMessage($kind: String!, $text: String!, $idempotencyKey: String!) { sendHelpMessage(kind: $kind, text: $text, idempotencyKey: $idempotencyKey) { ${FIELDS} } }`;
export const MARK_CASE_READ_FOR_HELP = gql`mutation MarkHelpRead($caseId: ID!) { markCaseRead(caseId: $caseId) { id } }`;

export type HelpKind = "help" | "feedback";
export type HelpMessage = { id: string; sender: "you" | "support"; text: string; at?: string };
export type HelpThread = { id: string; reference: string; status: "received" | "under_review" | "resolved"; outcome?: string; unread: boolean; messages: HelpMessage[] };

export const helpKind = (value: unknown): HelpKind => (value === "feedback" ? "feedback" : "help");

export function parseThread(value: unknown): HelpThread | null {
  if (value === null || value === undefined) return null;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== "string" || !t.id || typeof t.reference !== "string" || !Array.isArray(t.messages) || !["received", "under_review", "resolved"].includes(t.status as string)) throw new Error("Your conversation with support could not be loaded.");
  const seen = new Set<string>();
  const messages = t.messages.map((v): HelpMessage => {
    const m = v as Record<string, unknown>;
    if (typeof m.id !== "string" || seen.has(m.id) || typeof m.text !== "string" || (m.sender !== "reporter" && m.sender !== "support")) throw new Error("A message could not be confirmed.");
    seen.add(m.id);
    return { id: m.id, sender: m.sender === "support" ? "support" : "you", text: m.text, ...(typeof m.at === "string" && Number.isFinite(Date.parse(m.at)) ? { at: m.at } : {}) };
  });
  return { id: t.id, reference: t.reference, status: t.status as HelpThread["status"], unread: t.unread === true, messages, ...(typeof t.outcome === "string" && t.outcome ? { outcome: t.outcome } : {}) };
}

type Client = Pick<ApolloClient<unknown>, "query" | "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

export async function loadThread(client: Client, ownerId: string, kind: HelpKind): Promise<HelpThread | null> {
  try { return parseThread(((await client.query({ query: MY_HELP_THREAD as never, variables: { kind }, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { myHelpThread?: unknown } | null)?.myHelpThread); }
  catch (e) { throw friendlyError(e); }
}

/** One tap = one key, kept until the send settles, so a retry after a dropped connection is saved once. */
const keys = new Map<string, string>();
const newKey = () => "help-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
export async function sendHelp(client: Client, ownerId: string, kind: HelpKind, text: string): Promise<HelpThread> {
  const body = text.trim();
  if (!body) throw new Error("Write a message first.");
  if (body.length > 1000) throw new Error("Keep the message within 1,000 characters.");
  const signature = JSON.stringify([ownerId, kind, body]);
  const key = keys.get(signature) ?? newKey();
  keys.set(signature, key);
  try {
    const out = parseThread(((await client.mutate({ mutation: SEND_HELP_MESSAGE as never, variables: { kind, text: body, idempotencyKey: key }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never)).data as { sendHelpMessage?: unknown } | null)?.sendHelpMessage);
    if (!out) throw new Error("The server did not confirm that the message was sent.");
    keys.delete(signature);
    return out;
  } catch (e) {
    const error = friendlyError(e);
    if (!/network|timeout|failed to fetch|offline/i.test(error.message)) keys.delete(signature);
    throw error;
  }
}
export async function markHelpRead(client: Client, ownerId: string, caseId: string): Promise<void> {
  try { await client.mutate({ mutation: MARK_CASE_READ_FOR_HELP as never, variables: { caseId }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
}
export const LEGAL_LINKS = { terms: "https://kraftkonect.com/terms", privacy: "https://kraftkonect.com/privacy" } as const;

// The two lists on the Account page: payments and refunds, and the reviews the person has left. The server owns both.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const MY_PAYMENT_HISTORY = gql`query MyPaymentHistory($limit: Int) { myPaymentHistory(limit: $limit) { id kind title amountMinor status at bookingId reference } }`;
export const MY_REVIEWS = gql`query MyReviews($limit: Int) { myReviews(limit: $limit) { id bookingId providerName serviceTitle rating text createdAt } }`;

export type PaymentItem = { id: string; kind: "deposit" | "balance" | "refund"; title: string; amountMinor: number; status: string; at: string; bookingId: string; reference?: string };
export type MyReview = { id: string; bookingId: string; providerName?: string; serviceTitle?: string; rating: number; text: string; createdAt?: string };
type Client = Pick<ApolloClient<unknown>, "query">;

const STATUS_LABEL: Record<string, string> = { paid: "Paid", pending: "Awaiting confirmation", failed: "Unsuccessful", refunded: "Refunded", refund_pending: "Refund on its way", refund_failed: "Refund needs attention" };
export const paymentStatusLabel = (s: string) => STATUS_LABEL[s] ?? "Unknown";

export function parsePayments(value: unknown): PaymentItem[] {
  if (!Array.isArray(value)) throw new Error("Your payment history could not be read.");
  return value.map(raw => {
    const p = raw as Record<string, unknown> | null;
    if (!p || typeof p.id !== "string" || !["deposit", "balance", "refund"].includes(String(p.kind)) || typeof p.title !== "string" || typeof p.amountMinor !== "number" || !Number.isFinite(p.amountMinor) || p.amountMinor < 0 || typeof p.status !== "string" || typeof p.at !== "string" || Number.isNaN(Date.parse(p.at)) || typeof p.bookingId !== "string") throw new Error("Your payment history could not be read.");
    return { id: p.id, kind: p.kind as PaymentItem["kind"], title: p.title.slice(0, 120), amountMinor: Math.round(p.amountMinor), status: p.status, at: p.at, bookingId: p.bookingId, ...(typeof p.reference === "string" ? { reference: p.reference } : {}) };
  });
}
export function parseReviews(value: unknown): MyReview[] {
  if (!Array.isArray(value)) throw new Error("Your reviews could not be read.");
  return value.map(raw => {
    const r = raw as Record<string, unknown> | null;
    if (!r || typeof r.id !== "string" || typeof r.bookingId !== "string" || !Number.isInteger(r.rating) || (r.rating as number) < 1 || (r.rating as number) > 5 || typeof r.text !== "string") throw new Error("Your reviews could not be read.");
    return { id: r.id, bookingId: r.bookingId, rating: r.rating as number, text: r.text, ...(typeof r.providerName === "string" ? { providerName: r.providerName } : {}), ...(typeof r.serviceTitle === "string" ? { serviceTitle: r.serviceTitle } : {}), ...(typeof r.createdAt === "string" ? { createdAt: r.createdAt } : {}) };
  });
}
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });
export async function loadPayments(client: Client, ownerId: string): Promise<PaymentItem[]> {
  try { return parsePayments(((await client.query({ query: MY_PAYMENT_HISTORY as never, variables: { limit: 50 }, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { myPaymentHistory?: unknown } | null)?.myPaymentHistory); }
  catch (e) { throw friendlyError(e); }
}
export async function loadReviews(client: Client, ownerId: string): Promise<MyReview[]> {
  try { return parseReviews(((await client.query({ query: MY_REVIEWS as never, variables: { limit: 50 }, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { myReviews?: unknown } | null)?.myReviews); }
  catch (e) { throw friendlyError(e); }
}

// Saved cards: list, add (a small charge in the secure checkout that is refunded straight away) and remove.
// The app only ever sees the brand, last four digits and expiry. The server keeps the reusable token.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const MY_SAVED_CARDS = gql`query MySavedCards { mySavedCards { id brand last4 expMonth expYear bank expired } }`;
export const START_ADD_CARD = gql`mutation StartAddCard { startAddCard { reference authorizationUrl } }`;
export const VERIFY_CARD_SETUP = gql`mutation VerifyCardSetup($reference: String!) { verifyCardSetup(reference: $reference) { saved status cards { id brand last4 expMonth expYear bank expired } } }`;
export const REMOVE_SAVED_CARD = gql`mutation RemoveSavedCard($id: ID!) { removeSavedCard(id: $id) { id brand last4 expMonth expYear bank expired } }`;

export type SavedCard = { id: string; brand: string | null; last4: string; expMonth: string | null; expYear: string | null; bank: string | null; expired: boolean };
type Client = Pick<ApolloClient<unknown>, "query" | "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

export function parseCards(value: unknown): SavedCard[] {
  if (!Array.isArray(value)) throw new Error("Your saved cards could not be read.");
  return value.map(raw => {
    const c = raw as Partial<SavedCard> | null;
    if (!c || typeof c.id !== "string" || !c.id || typeof c.last4 !== "string" || !/^\d{4}$/.test(c.last4)) throw new Error("Your saved cards could not be read.");
    const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : null);
    return { id: c.id, brand: text(c.brand), last4: c.last4, expMonth: text(c.expMonth), expYear: text(c.expYear), bank: text(c.bank), expired: c.expired === true };
  });
}
/** "Visa •••• 4081 · 12/27" (the expiry only when the server gave one). */
export function cardLabel(c: SavedCard): string {
  const brand = c.brand ? c.brand[0].toUpperCase() + c.brand.slice(1) : "Card";
  const exp = c.expMonth && c.expYear ? " · " + c.expMonth.padStart(2, "0") + "/" + c.expYear.slice(-2) : "";
  return brand + " •••• " + c.last4 + exp;
}

export async function loadCards(client: Client, ownerId: string): Promise<SavedCard[]> {
  try { return parseCards(((await client.query({ query: MY_SAVED_CARDS as never, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { mySavedCards?: unknown } | null)?.mySavedCards); }
  catch (e) { throw friendlyError(e); }
}
export async function startAddCard(client: Client, ownerId: string): Promise<{ reference: string; url: string }> {
  let res;
  try { res = await client.mutate({ mutation: START_ADD_CARD as never, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (res.data as { startAddCard?: { reference?: unknown; authorizationUrl?: unknown } | null } | null)?.startAddCard;
  if (!out || typeof out.reference !== "string" || typeof out.authorizationUrl !== "string" || !/^https:\/\//.test(out.authorizationUrl)) throw new Error("We couldn’t open the secure card page. Please try again.");
  return { reference: out.reference, url: out.authorizationUrl };
}
export type CardSetupResult = { saved: boolean; status: "done" | "pending" | "failed"; cards: SavedCard[] };
export async function verifyCardSetup(client: Client, ownerId: string, reference: string): Promise<CardSetupResult> {
  let res;
  try { res = await client.mutate({ mutation: VERIFY_CARD_SETUP as never, variables: { reference }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (res.data as { verifyCardSetup?: { saved?: unknown; status?: unknown; cards?: unknown } | null } | null)?.verifyCardSetup;
  if (!out || !["done", "pending", "failed"].includes(String(out.status))) throw new Error("The server did not confirm the card.");
  return { saved: out.saved === true, status: out.status as CardSetupResult["status"], cards: parseCards(out.cards) };
}
export async function removeCard(client: Client, ownerId: string, id: string): Promise<SavedCard[]> {
  let res;
  try { res = await client.mutate({ mutation: REMOVE_SAVED_CARD as never, variables: { id }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  return parseCards((res.data as { removeSavedCard?: unknown } | null)?.removeSavedCard);
}

/** What the person picked for the payment they are about to make. Read when the payment starts, then cleared. */
let choice: { cardId: string | null; saveCard: boolean } = { cardId: null, saveCard: false };
export const paymentChoice = {
  get: () => choice,
  set: (next: { cardId: string | null; saveCard: boolean }) => { choice = { cardId: next.cardId, saveCard: next.cardId ? false : next.saveCard }; },
  reset: () => { choice = { cardId: null, saveCard: false }; },
};

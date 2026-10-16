// A provider managing their own services, weekly availability and work photos. The server checks and keeps all of it;
// the app asks, shows the server's answer and refreshes what is on screen.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";
import { priceCents } from "@/lib/onboarding/model";
import type { Availability, ServiceDraft } from "./catalog";

export const SAVE_MY_SERVICE = gql`mutation SaveMyService($id: ID, $input: SaveServiceInput!) { saveMyService(id: $id, input: $input) { id title active } }`;
export const REMOVE_MY_SERVICE = gql`mutation RemoveMyService($id: ID!) { removeMyService(id: $id) }`;
export const SET_MY_AVAILABILITY = gql`mutation SetMyAvailability($available: Boolean!, $days: [Int!]!) { setMyAvailability(available: $available, days: $days) { available days } }`;
export const SAVE_MY_WORK_PHOTOS = gql`mutation SaveMyWorkPhotos($photos: [String!]!) { saveMyWorkPhotos(photos: $photos) }`;
export const MY_AVAILABILITY_QUERY = gql`query MyAvailability { myProviderProfile { id available requestDays } }`;

type Client = Pick<ApolloClient<unknown>, "query" | "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });
async function mutate<T>(client: Client, ownerId: string, mutation: unknown, variables: Record<string, unknown>, field: string): Promise<T> {
  let result;
  try { result = await client.mutate({ mutation: mutation as never, variables, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (result.data as Record<string, T | null | undefined> | null | undefined)?.[field];
  if (out === null || out === undefined) throw new Error("The server did not confirm that change.");
  return out;
}

/** Create a service (no id) or change one. Returns the saved service's id. */
export async function saveService(client: Client, ownerId: string, id: string | undefined, draft: ServiceDraft): Promise<string> {
  const price = priceCents(draft.price);
  if (price === null) throw new Error("Enter a valid starting price greater than ₦0.");
  const out = await mutate<{ id: string; active: boolean }>(client, ownerId, SAVE_MY_SERVICE, { id: id ?? null, input: { title: draft.title.trim(), description: draft.description.trim(), priceCents: price, photos: draft.photos.filter(p => /^https:\/\//.test(p)) } }, "saveMyService");
  if (typeof out.id !== "string" || !out.id || out.active !== true) throw new Error("The server did not confirm the service.");
  return out.id;
}
export async function removeService(client: Client, ownerId: string, id: string): Promise<void> {
  const ok = await mutate<boolean>(client, ownerId, REMOVE_MY_SERVICE, { id }, "removeMyService");
  if (ok !== true) throw new Error("The server did not confirm the removal.");
}
export function parseAvailability(profile: unknown): Availability {
  const p = profile as { available?: unknown; requestDays?: unknown } | null;
  if (!p || typeof p.available !== "boolean") throw new Error("Your availability could not be loaded.");
  const days = Array.isArray(p.requestDays) ? p.requestDays : [];
  if (days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error("Your availability could not be loaded.");
  // No days saved means every day (the server's rule), shown as all seven when the provider is open.
  return { available: p.available, days: p.available && !days.length ? [0, 1, 2, 3, 4, 5, 6] : [...new Set(days as number[])].sort((a, b) => a - b) };
}
export async function loadAvailability(client: Client, ownerId: string): Promise<Availability> {
  try { return parseAvailability(((await client.query({ query: MY_AVAILABILITY_QUERY as never, fetchPolicy: "no-cache", context: scoped(ownerId) } as never)).data as { myProviderProfile?: unknown } | null)?.myProviderProfile); }
  catch (e) { throw friendlyError(e); }
}
export async function saveAvailability(client: Client, ownerId: string, value: Availability): Promise<Availability> {
  const saved = await mutate<{ available: boolean; days: number[] }>(client, ownerId, SET_MY_AVAILABILITY, { available: value.available, days: value.days }, "setMyAvailability");
  if (typeof saved.available !== "boolean" || !Array.isArray(saved.days)) throw new Error("The server did not confirm your availability.");
  return { available: saved.available, days: saved.days };
}
export async function saveWorkPhotos(client: Client, ownerId: string, photos: string[]): Promise<string[]> {
  const saved = await mutate<string[]>(client, ownerId, SAVE_MY_WORK_PHOTOS, { photos }, "saveMyWorkPhotos");
  if (!Array.isArray(saved)) throw new Error("The server did not confirm your photos.");
  return saved;
}

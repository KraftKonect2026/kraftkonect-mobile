// Deleting an account: the app's side. The server checks the code, ends open jobs, locks the account and starts the
// 30 day notice. Nothing here decides that an account is deleted; the app only asks and signs the person out.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const REQUEST_DELETION_CODE = gql`mutation RequestAccountDeletionCode { requestAccountDeletionCode { pinId expiresAt } }`;
export const REQUEST_ACCOUNT_DELETION = gql`mutation RequestAccountDeletion($pinId: String!, $code: String!, $confirmed: Boolean!) { requestAccountDeletion(pinId: $pinId, code: $code, confirmed: $confirmed) { requestedAt noticeEndsAt } }`;

type Client = Pick<ApolloClient<unknown>, "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

async function call<T>(client: Client, ownerId: string, mutation: unknown, variables: Record<string, unknown>, field: string): Promise<T> {
  let result;
  try { result = await client.mutate({ mutation: mutation as never, variables, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (result.data as Record<string, T | null> | null | undefined)?.[field];
  if (!out) throw new Error("The server did not confirm that step.");
  return out;
}

/** Sends a code to the account's current number. Returns the id to send back with the code. */
export async function askDeletionCode(client: Client, ownerId: string): Promise<string> {
  const r = await call<{ pinId: string }>(client, ownerId, REQUEST_DELETION_CODE, {}, "requestAccountDeletionCode");
  if (typeof r.pinId !== "string" || !r.pinId) throw new Error("The server did not send a code.");
  return r.pinId;
}
/** Starts the notice. Returns the day the account will be deleted unless support is contacted first. */
export async function requestDeletion(client: Client, ownerId: string, pinId: string, code: string): Promise<{ noticeEndsAt: string }> {
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code.");
  const r = await call<{ noticeEndsAt: string }>(client, ownerId, REQUEST_ACCOUNT_DELETION, { pinId, code, confirmed: true }, "requestAccountDeletion");
  if (typeof r.noticeEndsAt !== "string" || !Number.isFinite(Date.parse(r.noticeEndsAt))) throw new Error("The server did not confirm the deletion.");
  return { noticeEndsAt: r.noticeEndsAt };
}
export const noticeDay = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

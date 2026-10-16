// Changing your phone number, recovery email and name, and pausing a provider profile.
// The server checks every code and decides what changes; the app only asks, shows the server's answer and moves on.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const START_SECURITY_CHECK = gql`mutation StartSecurityCheck { startSecurityCheck { pinId expiresAt } }`;
export const CONFIRM_SECURITY_CHECK = gql`mutation ConfirmSecurityCheck($pinId: String!, $code: String!) { confirmSecurityCheck(pinId: $pinId, code: $code) { proofId expiresAt } }`;
export const REQUEST_PHONE_CHANGE_CODE = gql`mutation RequestPhoneChangeCode($proofId: ID!, $newPhone: String!) { requestPhoneChangeCode(proofId: $proofId, newPhone: $newPhone) { expiresAt } }`;
export const CONFIRM_PHONE_CHANGE = gql`mutation ConfirmPhoneChange($proofId: ID!, $code: String!) { confirmPhoneChange(proofId: $proofId, code: $code) }`;
export const REQUEST_RECOVERY_EMAIL_CODE = gql`mutation RequestRecoveryEmailCode($email: String!, $proofId: ID) { requestRecoveryEmailCode(email: $email, proofId: $proofId) { expiresAt } }`;
export const CONFIRM_RECOVERY_EMAIL = gql`mutation ConfirmRecoveryEmail($code: String!) { confirmRecoveryEmail(code: $code) }`;
export const CHANGE_MY_NAME = gql`mutation ChangeMyName($name: String!) { changeMyName(name: $name) { applied name reference } }`;
export const PAUSE_PROVIDER_PROFILE = gql`mutation PauseProviderProfile { pauseProviderProfile { state } }`;
export const RESUME_PROVIDER_PROFILE = gql`mutation ResumeProviderProfile { resumeProviderProfile { state } }`;

type Client = Pick<ApolloClient<unknown>, "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

async function call<T>(client: Client, ownerId: string, mutation: unknown, variables: Record<string, unknown>, field: string): Promise<T> {
  let result;
  try { result = await client.mutate({ mutation: mutation as never, variables, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (result.data as Record<string, T | null | undefined> | null | undefined)?.[field];
  if (out === null || out === undefined) throw new Error("The server did not confirm that step.");
  return out;
}
const sixDigits = (code: string) => { if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code."); };

/** Text a code to the number on the account, to confirm it is really the owner. Returns the id to send back with the code. */
export async function startCheck(client: Client, ownerId: string): Promise<string> {
  const r = await call<{ pinId: string }>(client, ownerId, START_SECURITY_CHECK, {}, "startSecurityCheck");
  if (typeof r.pinId !== "string" || !r.pinId) throw new Error("The server did not send a code.");
  return r.pinId;
}
/** Returns the confirmation to use for the change that follows. */
export async function confirmCheck(client: Client, ownerId: string, pinId: string, code: string): Promise<string> {
  sixDigits(code);
  const r = await call<{ proofId: string }>(client, ownerId, CONFIRM_SECURITY_CHECK, { pinId, code }, "confirmSecurityCheck");
  if (typeof r.proofId !== "string" || !r.proofId) throw new Error("The server did not confirm the code.");
  return r.proofId;
}
export async function sendNewPhoneCode(client: Client, ownerId: string, proofId: string, newPhone: string): Promise<void> {
  await call(client, ownerId, REQUEST_PHONE_CHANGE_CODE, { proofId, newPhone }, "requestPhoneChangeCode");
}
export async function confirmNewPhone(client: Client, ownerId: string, proofId: string, code: string): Promise<void> {
  sixDigits(code);
  const ok = await call<boolean>(client, ownerId, CONFIRM_PHONE_CHANGE, { proofId, code }, "confirmPhoneChange");
  if (ok !== true) throw new Error("The server did not confirm the new number.");
}
export async function sendEmailCode(client: Client, ownerId: string, email: string, proofId?: string): Promise<void> {
  await call(client, ownerId, REQUEST_RECOVERY_EMAIL_CODE, { email: email.trim(), proofId: proofId ?? null }, "requestRecoveryEmailCode");
}
export async function confirmEmail(client: Client, ownerId: string, code: string): Promise<void> {
  sixDigits(code);
  const ok = await call<boolean>(client, ownerId, CONFIRM_RECOVERY_EMAIL, { code }, "confirmRecoveryEmail");
  if (ok !== true) throw new Error("The server did not confirm the email.");
}
/** applied: the new name is in use. Otherwise support has to check it against the person's ID and `reference` identifies the request. */
export async function changeName(client: Client, ownerId: string, first: string, last: string): Promise<{ applied: boolean; name: string; reference?: string }> {
  const name = (first.trim() + " " + last.trim()).trim();
  const r = await call<{ applied: boolean; name: string; reference: string | null }>(client, ownerId, CHANGE_MY_NAME, { name }, "changeMyName");
  if (typeof r.applied !== "boolean" || typeof r.name !== "string") throw new Error("The server did not confirm the name.");
  return { applied: r.applied, name: r.name, ...(r.reference ? { reference: r.reference } : {}) };
}
export async function setProfilePaused(client: Client, ownerId: string, paused: boolean): Promise<"paused" | "active"> {
  const r = await call<{ state: string }>(client, ownerId, paused ? PAUSE_PROVIDER_PROFILE : RESUME_PROVIDER_PROFILE, {}, paused ? "pauseProviderProfile" : "resumeProviderProfile");
  if (r.state !== "paused" && r.state !== "active") throw new Error("The server did not confirm the change.");
  return r.state;
}
export const maskedEmail = (email: string) => { const [name, domain] = email.split("@"); return name && domain ? name.slice(0, 1) + "•••@" + domain : email; };

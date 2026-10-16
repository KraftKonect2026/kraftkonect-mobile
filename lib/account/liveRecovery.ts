// Getting back into an account after losing the phone number: the app's side of the server's recovery steps.
// The server decides whether the person is who they say (email code, or questions about the account's history)
// and swaps the number once the new one is proven. Nothing here decides ownership.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";
import type { RecoveryStep } from "./recovery";

export const START_EMAIL_RECOVERY = gql`mutation StartEmailRecovery($email: String!, $name: String!) { startEmailRecovery(email: $email, name: $name) { sessionId expiresAt } }`;
export const VERIFY_RECOVERY_EMAIL = gql`mutation VerifyRecoveryEmailCode($sessionId: ID!, $code: String!) { verifyRecoveryEmailCode(sessionId: $sessionId, code: $code) { sessionId step } }`;
export const START_ACTIVITY_RECOVERY = gql`mutation StartActivityRecovery($oldPhone: String!, $name: String!) { startActivityRecovery(oldPhone: $oldPhone, name: $name) { sessionId historyAvailable expiresAt questions { id label options { id label } } } }`;
export const ANSWER_RECOVERY_ACTIVITY = gql`mutation AnswerRecoveryActivity($sessionId: ID!, $answers: [RecoveryAnswerInput!]!) { answerRecoveryActivity(sessionId: $sessionId, answers: $answers) { sessionId step } }`;
export const START_IDENTITY_RECOVERY = gql`mutation StartIdentityRecovery($oldPhone: String!, $name: String!) { startIdentityRecovery(oldPhone: $oldPhone, name: $name) { available sessionId inquiryId clientToken inquiryUrl expiresAt } }`;
export const CHECK_IDENTITY_RECOVERY = gql`mutation CheckIdentityRecovery($sessionId: ID!) { checkIdentityRecovery(sessionId: $sessionId) { sessionId step reference } }`;
export const REQUEST_RECOVERY_PHONE_CODE = gql`mutation RequestRecoveryPhoneCode($sessionId: ID!, $newPhone: String!) { requestRecoveryPhoneCode(sessionId: $sessionId, newPhone: $newPhone) { expiresAt } }`;
export const COMPLETE_RECOVERY_PHONE = gql`mutation CompleteRecoveryPhone($sessionId: ID!, $code: String!) { completeRecoveryPhone(sessionId: $sessionId, code: $code) { recovered newPhone role } }`;
export const REQUEST_RECOVERY_SUPPORT = gql`mutation RequestRecoverySupport($name: String!, $contact: String!, $details: String!) { requestRecoverySupport(name: $name, contact: $contact, details: $details) { reference } }`;

type Client = Pick<ApolloClient<unknown>, "mutate">;
export type Question = { id: string; label: string; options: { id: string; label: string }[] };

async function call<T>(client: Client, mutation: unknown, variables: Record<string, unknown>, field: string): Promise<T> {
  let result;
  try { result = await client.mutate({ mutation: mutation as never, variables, fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const out = (result.data as Record<string, T | null> | null | undefined)?.[field];
  if (!out) throw new Error("The server did not confirm that step.");
  return out;
}
const sessionOf = (v: { sessionId?: unknown }) => {
  if (typeof v.sessionId !== "string" || !v.sessionId) throw new Error("The server did not start a recovery session.");
  return v.sessionId;
};

export async function startEmailRecovery(client: Client, email: string, name: string) {
  return sessionOf(await call<{ sessionId: string }>(client, START_EMAIL_RECOVERY, { email: email.trim(), name: name.trim() }, "startEmailRecovery"));
}
export async function verifyEmailCode(client: Client, sessionId: string, code: string): Promise<"phone"> {
  const r = await call<{ step: string }>(client, VERIFY_RECOVERY_EMAIL, { sessionId, code }, "verifyRecoveryEmailCode");
  if (r.step !== "phone") throw new Error("The server did not confirm the email code.");
  return "phone";
}
/** Questions to answer, or none when the account has too little history (the person is then pointed to support). */
export async function startActivity(client: Client, oldPhone: string, name: string): Promise<{ sessionId: string; questions: Question[] } | null> {
  const r = await call<{ sessionId: string | null; historyAvailable: boolean; questions: Question[] }>(client, START_ACTIVITY_RECOVERY, { oldPhone, name: name.trim() }, "startActivityRecovery");
  if (!r.historyAvailable) return null;
  if (!Array.isArray(r.questions) || r.questions.length !== 4 || r.questions.some(q => !q.id || !q.label || !Array.isArray(q.options) || q.options.length < 2)) throw new Error("The recovery questions could not be loaded.");
  return { sessionId: sessionOf(r), questions: r.questions };
}
export type IdentityCheck = { sessionId: string; inquiryId: string; clientToken: string | null; inquiryUrl: string };
/** A new identity check to match against the one done at sign-up, or null when this account has none (use another method). */
export async function startIdentity(client: Client, oldPhone: string, name: string): Promise<IdentityCheck | null> {
  const r = await call<{ available: boolean; sessionId: string | null; inquiryId: string | null; clientToken: string | null; inquiryUrl: string | null }>(client, START_IDENTITY_RECOVERY, { oldPhone, name: name.trim() }, "startIdentityRecovery");
  if (!r.available) return null;
  if (!r.inquiryId || !r.inquiryUrl || !/^https:\/\//.test(r.inquiryUrl)) throw new Error("The identity check could not be started.");
  return { sessionId: sessionOf(r), inquiryId: r.inquiryId, clientToken: r.clientToken ?? null, inquiryUrl: r.inquiryUrl };
}
/** Ask the server how the check went. Only the server's answer ever moves recovery forward. */
export async function checkIdentity(client: Client, sessionId: string): Promise<{ step: "phone" | "pending" | "failed"; reference?: string }> {
  const r = await call<{ step: string; reference: string | null }>(client, CHECK_IDENTITY_RECOVERY, { sessionId }, "checkIdentityRecovery");
  if (r.step !== "phone" && r.step !== "pending" && r.step !== "failed") throw new Error("The server did not return a result.");
  return { step: r.step, ...(r.reference ? { reference: r.reference } : {}) };
}
export async function answerActivity(client: Client, sessionId: string, answers: Record<string, string>): Promise<"phone" | "failed"> {
  const list = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
  const r = await call<{ step: string }>(client, ANSWER_RECOVERY_ACTIVITY, { sessionId, answers: list }, "answerRecoveryActivity");
  if (r.step !== "phone" && r.step !== "failed") throw new Error("The server did not return a result.");
  return r.step;
}
export async function requestNewPhoneCode(client: Client, sessionId: string, newPhone: string): Promise<void> {
  await call(client, REQUEST_RECOVERY_PHONE_CODE, { sessionId, newPhone }, "requestRecoveryPhoneCode");
}
export async function completeRecovery(client: Client, sessionId: string, code: string): Promise<{ newPhone: string; role: "customer" | "provider" }> {
  const r = await call<{ recovered: boolean; newPhone: string; role: string }>(client, COMPLETE_RECOVERY_PHONE, { sessionId, code }, "completeRecoveryPhone");
  if (!r.recovered || typeof r.newPhone !== "string") throw new Error("The server did not confirm the new number.");
  return { newPhone: r.newPhone, role: r.role === "provider" ? "provider" : "customer" };
}
export async function askSupport(client: Client, name: string, contact: string, details: string): Promise<string> {
  return (await call<{ reference: string }>(client, REQUEST_RECOVERY_SUPPORT, { name: name.trim(), contact: contact.trim(), details }, "requestRecoverySupport")).reference;
}

/** Where "back" goes. Steps that wait on a server result, or end the flow, have no way back. */
export function backStep(step: RecoveryStep): RecoveryStep | null {
  const parent: Partial<Record<RecoveryStep, RecoveryStep>> = { email: "choose", identity: "choose", "email-code": "email", options: "identity", activity: "options", phone: "choose", "phone-code": "phone", support: "choose", failed: "choose", pending: "choose" };
  return parent[step] ?? null;
}

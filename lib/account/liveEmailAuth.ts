// Signing in with an email and password: sign in, create an account, confirm the email with a code, and recover a
// forgotten password. The server decides everything; the app checks the obvious mistakes before sending.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";
import { RESEND_OTP_MUTATION, SIGN_IN_MUTATION, SIGN_UP_MUTATION, VERIFY_EMAIL_MUTATION } from "@/lib/mutations";

export const REQUEST_PASSWORD_RESET = gql`mutation RequestPasswordReset($email: String!) { requestPasswordReset(email: $email) }`;
export const RESET_PASSWORD = gql`mutation ResetPassword($email: String!, $code: String!, $newPassword: String!) { resetPassword(email: $email, code: $code, newPassword: $newPassword) }`;

export const PASSWORD_MIN = 8, PASSWORD_MAX = 72;
type Client = Pick<ApolloClient<unknown>, "mutate">;

export const cleanEmail = (value: string) => value.trim().toLowerCase();
export const emailError = (value: string): string | undefined => { const v = cleanEmail(value); return v && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : "Enter a valid email address."; };
export const passwordError = (value: string): string | undefined => {
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (value.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  return undefined;
};
export const nameError = (value: string): string | undefined => { const v = value.trim(); return v.length >= 2 && v.length <= 80 ? undefined : "Enter your name (at least 2 letters)."; };

export type EmailSession = { accessToken: string; refreshToken: string; user: Record<string, unknown> & { id: string; email: string }; emailVerified: boolean };

/** Accept a sign-in answer only if it has both tokens and a user. Unverified until the server says otherwise. */
export function parseSession(payload: unknown): EmailSession {
  const p = payload as { accessToken?: unknown; refreshToken?: unknown; user?: Record<string, unknown> | null } | null;
  const u = p?.user;
  if (!p || typeof p.accessToken !== "string" || !p.accessToken || typeof p.refreshToken !== "string" || !p.refreshToken || !u || typeof u.id !== "string" || !u.id || typeof u.email !== "string") throw new Error("The server did not confirm your sign-in. Please try again.");
  const meta = (u.metadata ?? {}) as { email_verified?: unknown };
  return { accessToken: p.accessToken, refreshToken: p.refreshToken, user: u as EmailSession["user"], emailVerified: u.emailVerified === true || (u.emailVerified === undefined && meta.email_verified === true) };
}

async function call(client: Client, mutation: unknown, variables: Record<string, unknown>): Promise<Record<string, unknown>> {
  try { return ((await client.mutate({ mutation: mutation as never, variables, fetchPolicy: "no-cache" } as never)).data ?? {}) as Record<string, unknown>; }
  catch (e) { throw friendlyError(e); }
}

export async function signInWithEmail(client: Client, email: string, password: string): Promise<EmailSession> {
  const bad = emailError(email); if (bad) throw new Error(bad);
  if (!password) throw new Error("Enter your password.");
  return parseSession((await call(client, SIGN_IN_MUTATION, { email: cleanEmail(email), password })).signIn);
}
export async function signUpWithEmail(client: Client, input: { name: string; email: string; password: string; role?: "customer" | "provider" }): Promise<EmailSession> {
  const bad = nameError(input.name) ?? emailError(input.email) ?? passwordError(input.password); if (bad) throw new Error(bad);
  return parseSession((await call(client, SIGN_UP_MUTATION, { name: input.name.trim(), email: cleanEmail(input.email), password: input.password, ...(input.role ? { role: input.role } : {}) })).signUp);
}
export async function verifyEmailCode(client: Client, email: string, code: string): Promise<EmailSession> {
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
  const session = parseSession((await call(client, VERIFY_EMAIL_MUTATION, { email: cleanEmail(email), otp: code })).verifyEmail);
  // Only the server's word makes an email "verified"; a missing flag after a code check is treated as verified.
  return { ...session, emailVerified: true };
}
export async function resendEmailCode(client: Client, email: string): Promise<void> {
  const out = (await call(client, RESEND_OTP_MUTATION, { email: cleanEmail(email) })).resendOtp as { success?: unknown } | null;
  if (!out || out.success !== true) throw new Error("We couldn’t send a new code. Please try again in a moment.");
}

export async function askPasswordReset(client: Client, email: string): Promise<void> {
  const bad = emailError(email); if (bad) throw new Error(bad);
  await call(client, REQUEST_PASSWORD_RESET, { email: cleanEmail(email) });
}
export async function resetPassword(client: Client, email: string, code: string, newPassword: string): Promise<void> {
  const bad = emailError(email) ?? (/^\d{6}$/.test(code) ? undefined : "Enter the 6-digit code from your email.") ?? passwordError(newPassword);
  if (bad) throw new Error(bad);
  if ((await call(client, RESET_PASSWORD, { email: cleanEmail(email), code, newPassword })).resetPassword !== true) throw new Error("The server did not confirm the new password.");
}

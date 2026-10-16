import type { AuthPayload, User } from "@/types";
import { normalizedPhone } from "@/lib/onboarding/model";

type PhoneResponse = { accessToken?: string | null; refreshToken?: string | null; user?: Partial<User> | null };
export function confirmedPhoneSession(response: PhoneResponse | null | undefined, phone: string): AuthPayload {
  const user = response?.user;
  if (typeof response?.accessToken !== "string" || !response.accessToken.trim() ||
      typeof response.refreshToken !== "string" || !response.refreshToken.trim() ||
      typeof user?.id !== "string" || !user.id.trim() ||
      !["customer", "provider", "admin"].includes(user.role ?? "")) {
    throw new Error("The server did not return a complete sign-in session.");
  }
  if (user.phone && normalizedPhone(user.phone) !== normalizedPhone(phone)) {
    throw new Error("The verified account phone did not match this code request.");
  }
  return {
    accessToken: response.accessToken, refreshToken: response.refreshToken,
    user: {
      id: user.id, role: user.role!, phone: user.phone ?? phone,
      name: user.name ?? null, email: user.email ?? null, avatarUrl: user.avatarUrl ?? null,
      metadata: user.metadata ?? {}, emailVerified: user.emailVerified ?? false,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      phoneVerified: user.phoneVerified ?? true, phoneVerifiedAt: user.phoneVerifiedAt ?? null,
    },
  };
}
export type AuthFailure = "account-missing" | "expired" | "invalid" | "rate-limited" | "blocked" | "unavailable";
type ServerErrors = { message?: string; extensions?: { code?: unknown } }[];
/** The server answers with real HTTP statuses, so Apollo may put its errors in the response body rather than graphQLErrors. */
function serverErrors(error: unknown): ServerErrors {
  const typed = error as { graphQLErrors?: ServerErrors; networkError?: { result?: { errors?: ServerErrors } } } | null;
  return [...(typed?.graphQLErrors ?? []), ...(typed?.networkError?.result?.errors ?? [])];
}
/** The server's own sentence, for the failures where it says something specific (wait a minute, account suspended). */
export function authMessage(error: unknown): string | undefined {
  const found = serverErrors(error).find(e => e.extensions?.code === "RATE_LIMITED" || e.extensions?.code === "FORBIDDEN");
  return typeof found?.message === "string" && found.message.trim() ? found.message : undefined;
}
export function authFailure(error: unknown): AuthFailure {
  const codes = serverErrors(error).map(e => e.extensions?.code);
  if (codes.includes("RATE_LIMITED")) return "rate-limited";
  if (codes.includes("FORBIDDEN")) return "blocked";
  if (codes.includes("ACCOUNT_NOT_FOUND")) return "account-missing";
  if (codes.includes("OTP_EXPIRED") || codes.includes("EXPIRED_OTP")) return "expired";
  if (codes.includes("OTP_INVALID") || codes.includes("INVALID_OTP")) return "invalid";
  return "unavailable";
}
export function failureMessage(kind: AuthFailure) {
  return kind === "expired" ? "Your code has expired. Request a new code."
    : kind === "invalid" ? "That code doesn’t match. Please try again."
    : "We couldn’t complete this right now. Please try again.";
}

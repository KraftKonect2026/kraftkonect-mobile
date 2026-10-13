import { normalizedPhone } from "@/lib/onboarding/model";

// Fictional development credentials. They never establish a backend session.
export const testLoginPhone = "+2348000000000";
export const testLoginFieldPhone = "8000000000";
export const testLoginCode = "123456";
const lifetimeMs = 10 * 60_000;

export type TestLoginChallenge = { phone: string; expiresAt: number };

export function isTestLoginPhone(value: string, development: boolean): boolean {
  return development && normalizedPhone(value) === testLoginPhone;
}

export function createTestLoginChallenge(value: string, development: boolean, now: number): TestLoginChallenge {
  if (!isTestLoginPhone(value, development) || !Number.isFinite(now)) {
    throw new Error("Local test sign-in is unavailable.");
  }
  return { phone: testLoginPhone, expiresAt: now + lifetimeMs };
}

export function checkTestLoginCode(challenge: TestLoginChallenge, phone: string, code: string, development: boolean, now: number): "valid" | "invalid" | "expired" {
  if (!development || !isTestLoginPhone(phone, development) || challenge.phone !== testLoginPhone) return "invalid";
  if (!Number.isFinite(now) || !Number.isFinite(challenge.expiresAt) || now >= challenge.expiresAt) return "expired";
  return code === testLoginCode ? "valid" : "invalid";
}

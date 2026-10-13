import type { AppMode } from "@/lib/appMode";

export type OnboardingStep = "sign-in" | "sign-in-code" | "role" | "phone" | "phone-code" | "name" | "location" | "manual-location" | "work" | "service-area" | "profile" | "gallery" | "first-service" | "complete" | "verification-intro" | "verification-documents" | "verification-pending" | "account-missing" | "recovery" | "recovery-email" | "recovery-identity";
export const steps: OnboardingStep[] = ["sign-in", "sign-in-code", "role", "phone", "phone-code", "name", "location", "manual-location", "work", "service-area", "profile", "gallery", "first-service", "complete", "verification-intro", "verification-documents", "verification-pending", "account-missing", "recovery", "recovery-email", "recovery-identity"];
export type ServiceArea = { label: string; latitude?: number; longitude?: number };
export type OnboardingDraft = {
  version: 1; mode: AppMode; resumeStep: OnboardingStep; phone: string;
  firstName: string; lastName: string; customerArea: string; area: string; workType: string; category: string;
  workingDays: number[]; remote: boolean; businessName: string; introduction: string;
  banner: string; avatar: string; gallery: string[]; servicePhoto: string;
  serviceName: string; serviceDescription: string; startingPrice: string;
};
export function emptyDraft(): OnboardingDraft {
  return { version: 1, mode: "customer", resumeStep: "role", phone: "", firstName: "", lastName: "",
    customerArea: "", area: "", workType: "", category: "", workingDays: [1,2,3,4,5,6,0], remote: false,
    businessName: "", introduction: "", banner: "", avatar: "", gallery: [], servicePhoto: "",
    serviceName: "", serviceDescription: "", startingPrice: "" };
}
export function normalizedPhone(value: string): string | null {
  let digits = value.replace(/[\s()-]/g, "");
  if (digits.startsWith("+234")) digits = digits.slice(4);
  else if (/^234\d{10}$/.test(digits)) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[789]\d{9}$/.test(digits) ? "+234" + digits : null;
}
export function phoneForField(value: string): string { return value.startsWith("+234") ? value.slice(4) : value; }
export function maskedPhone(value: string): string { return "+234 ••• ••• " + value.replace(/\D/g, "").slice(-4); }
export function validName(value: string): boolean { return !!value.trim() && value.trim().length <= 60 && !/[\u0000-\u001f\u007f]/.test(value); }
export function priceCents(value: string): number | null {
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const plain = value.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(plain)) return null;
  const [whole, fraction = ""] = plain.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 2147483647 ? cents : null;
}
// Whitelist public setup fields. OTPs, tokens and identity documents never enter a draft.
export function safeDraft(input: unknown): OnboardingDraft {
  const draft = emptyDraft();
  if (!input || typeof input !== "object") return draft;
  const values = input as Record<string, unknown>;
  for (const key of ["phone", "firstName", "lastName", "customerArea", "area", "workType", "category", "businessName", "introduction", "banner", "avatar", "servicePhoto", "serviceName", "serviceDescription", "startingPrice"] as const) {
    if (typeof values[key] === "string") draft[key] = values[key].slice(0, 4000);
  }
  draft.mode = values.mode === "provider" ? "provider" : "customer";
  draft.remote = values.remote === true;
  if (Array.isArray(values.workingDays)) draft.workingDays = [...new Set(values.workingDays.filter((day): day is number => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6))];
  if (Array.isArray(values.gallery)) draft.gallery = values.gallery.filter((photo): photo is string => typeof photo === "string").slice(0, 8);
  if (typeof values.resumeStep === "string" && steps.includes(values.resumeStep as OnboardingStep)) draft.resumeStep = values.resumeStep as OnboardingStep;
  if (draft.resumeStep === "phone-code") draft.resumeStep = "phone";
  if (draft.resumeStep === "sign-in-code" || draft.resumeStep === "account-missing") draft.resumeStep = "sign-in";
  // Success/review states require a fresh server response, never a restored client flag.
  if (["complete", "verification-pending"].includes(draft.resumeStep)) draft.resumeStep = "first-service";
  return draft;
}
export function draftForAccount(registration: OnboardingDraft, existing: unknown): OnboardingDraft {
  const stored = existing as { version?: unknown } | null;
  const draft = stored?.version === 1 ? safeDraft(existing) : safeDraft(registration);
  // A fresh sign-up choice changes the starting mode, never another account's saved work.
  return { ...draft, mode: registration.mode, phone: registration.phone };
}
export function nextAfterPhone(draft: OnboardingDraft, hasName: boolean): OnboardingStep {
  if (!hasName) return "name";
  if (draft.mode === "customer") return draft.resumeStep === "manual-location" ? "manual-location" : "location";
  return ["work","service-area","profile","gallery","first-service","verification-intro","verification-documents"].includes(draft.resumeStep) ? draft.resumeStep : "work";
}
function storageOwner(owner: string) { return Array.from(owner).map(character => character.codePointAt(0)!.toString(16)).join("_"); }
export function draftKey(owner: string) { return "kk-onboarding-v1-" + storageOwner(owner); }
export function areaKey(accountId: string) { return "kk-service-area-v1-" + storageOwner(accountId); }
export function stepAllowed(step: OnboardingStep, signedIn: boolean, preview: boolean) {
  if (preview || signedIn) return step;
  return ["name","location","manual-location","work","service-area","profile","gallery","first-service","complete","verification-intro","verification-documents","verification-pending"].includes(step) ? "phone" as const : step;
}

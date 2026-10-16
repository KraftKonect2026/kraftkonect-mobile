// Real payouts for providers: the wallet, the saved bank account and money sent to it.
// The server decides what can be paid out and where the money goes; the app only asks and shows.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

const WALLET_PAYOUT_FIELDS = `id reference amountMinor status bankName accountLast4 accountName failureReason createdAt paidAt`;
export const PAYOUT_OVERVIEW_QUERY = gql`
  query MyPayoutOverview {
    myPayoutOverview {
      availableMinor pendingMinor reservedMinor repaymentOwedMinor spendableMinor minimumPayoutMinor
      bank { bankName bankCode accountLast4 accountName review }
      payouts { ${WALLET_PAYOUT_FIELDS} }
      repayments { bookingId bookingRef dueMinor recoveredMinor outstandingMinor status deadline }
    }
  }
`;
export const SAVE_BANK_ACCOUNT_MUTATION = gql`
  mutation SaveBankAccount($bankCode: String!, $accountNumber: String!) {
    saveBankAccount(bankCode: $bankCode, accountNumber: $accountNumber) { bankName bankCode accountLast4 accountName review }
  }
`;
export const REQUEST_WALLET_PAYOUT_MUTATION = gql`
  mutation RequestWalletPayout($amountMinor: Float!, $idempotencyKey: String!) {
    requestWalletPayout(amountMinor: $amountMinor, idempotencyKey: $idempotencyKey) { ${WALLET_PAYOUT_FIELDS} }
  }
`;

export type PayoutBank = { bankName: string; bankCode: string; accountLast4: string; accountName: string; review: "verified" | "needs_review" | "approved" };
export type WalletPayout = { id: string; reference: string; amount: number; status: "pending" | "processing" | "paid" | "failed"; bankName: string; accountLast4: string; accountName: string; failureReason?: string; at?: string; paidAt?: string };
export type PayoutRepayment = { bookingId: string; bookingRef?: string; due: number; recovered: number; outstanding: number; status: string; deadline?: string };
export type PayoutOverview = {
  available: number; pending: number; reserved: number; repaymentOwed: number; spendable: number; minimumPayout: number;
  bank: PayoutBank | null; payouts: WalletPayout[]; repayments: PayoutRepayment[];
};

function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Your payout records could not be loaded.");
  return value as Record<string, unknown>;
}
function kobo(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("A payout amount could not be confirmed.");
  return value;
}
const str = (value: unknown, max = 200) => (typeof value === "string" && value.trim() && value.length <= max ? value.trim() : undefined);
const STATUSES = ["pending", "processing", "paid", "failed"] as const;

export function parseBank(value: unknown): PayoutBank | null {
  if (value === null || value === undefined) return null;
  const r = obj(value), review = r.review;
  const bankName = str(r.bankName, 120), bankCode = str(r.bankCode, 20), accountName = str(r.accountName), last4 = r.accountLast4;
  if (!bankName || !bankCode || !accountName || typeof last4 !== "string" || !/^\d{4}$/.test(last4) || (review !== "verified" && review !== "needs_review" && review !== "approved")) {
    throw new Error("Your saved payout account could not be confirmed.");
  }
  return { bankName, bankCode, accountName, accountLast4: last4, review };
}
export function parsePayout(value: unknown): WalletPayout {
  const r = obj(value), id = str(r.id), reference = str(r.reference), bankName = str(r.bankName, 120), accountName = str(r.accountName), last4 = r.accountLast4;
  const status = (STATUSES as readonly unknown[]).includes(r.status) ? (r.status as WalletPayout["status"]) : undefined;
  if (!id || !reference || !bankName || !accountName || !status || typeof last4 !== "string") throw new Error("A payout record could not be confirmed.");
  const day = (v: unknown) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : undefined);
  return { id, reference, amount: kobo(r.amountMinor), status, bankName, accountName, accountLast4: last4, failureReason: str(r.failureReason, 300), at: day(r.createdAt), paidAt: day(r.paidAt) };
}
export function parseOverview(value: unknown): PayoutOverview {
  const r = obj(value);
  if (!Array.isArray(r.payouts) || !Array.isArray(r.repayments)) throw new Error("Your payout records could not be loaded.");
  const ids = new Set<string>();
  const payouts = r.payouts.map(parsePayout);
  for (const p of payouts) { if (ids.has(p.id)) throw new Error("The payout records contain duplicates."); ids.add(p.id); }
  const out: PayoutOverview = {
    available: kobo(r.availableMinor), pending: kobo(r.pendingMinor), reserved: kobo(r.reservedMinor), repaymentOwed: kobo(r.repaymentOwedMinor),
    spendable: kobo(r.spendableMinor), minimumPayout: kobo(r.minimumPayoutMinor), bank: parseBank(r.bank), payouts,
    repayments: r.repayments.map((v) => {
      const d = obj(v), id = str(d.bookingId);
      if (!id) throw new Error("A repayment record could not be confirmed.");
      return { bookingId: id, bookingRef: str(d.bookingRef, 40), due: kobo(d.dueMinor), recovered: kobo(d.recoveredMinor), outstanding: kobo(d.outstandingMinor), status: str(d.status, 20) ?? "due", deadline: typeof d.deadline === "string" ? d.deadline : undefined };
    }),
  };
  if (out.spendable > out.available) throw new Error("Your wallet figures could not be confirmed.");
  return out;
}

export const payoutStatusLabel = (p: Pick<WalletPayout, "status">) =>
  p.status === "paid" ? "Paid" : p.status === "failed" ? "Unsuccessful · money returned" : p.status === "processing" ? "On its way to your bank" : "Being sent";

/** Why a typed amount cannot be paid out yet (shown before asking the server). */
export function payoutAmountError(o: PayoutOverview, amount: number | null): string | undefined {
  if (amount === null || !Number.isSafeInteger(amount) || amount <= 0) return "Enter a payout amount greater than ₦0.";
  if (!o.bank) return "Add your bank account first.";
  if (o.bank.review === "needs_review") return "Your bank account name doesn’t match your name. Contact support to approve it.";
  if (amount < o.minimumPayout) return "The smallest payout is ₦" + (o.minimumPayout / 100).toLocaleString("en-NG") + ".";
  if (amount > o.spendable) return o.repaymentOwed > 0 && amount <= o.available ? "Part of your balance is set aside to repay a refund." : "That is more than your available balance.";
  return undefined;
}

type Client = Pick<ApolloClient<unknown>, "mutate" | "query">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

/** One tap = one key, kept until the request settles, so a retry after a dropped connection cannot pay twice. */
const payoutKeys = new Map<string, string>();
const newKey = () => "payout-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);

export async function loadBanks(client: Client, ownerId: string, query: unknown): Promise<{ name: string; code: string }[]> {
  try {
    const res = await client.query({ query: query as never, fetchPolicy: "no-cache", context: scoped(ownerId) });
    const list = (res.data as { banks?: { name?: unknown; code?: unknown }[] } | null)?.banks;
    if (!Array.isArray(list)) throw new Error("The bank list could not be loaded.");
    return list.filter((b): b is { name: string; code: string } => typeof b.name === "string" && typeof b.code === "string");
  } catch (e) { throw friendlyError(e); }
}
export async function resolveAccountName(client: Client, ownerId: string, query: unknown, bankCode: string, accountNumber: string): Promise<string> {
  try {
    const res = await client.query({ query: query as never, variables: { bankCode, accountNumber }, fetchPolicy: "no-cache", context: scoped(ownerId) });
    const name = (res.data as { resolveBankAccount?: { accountName?: unknown } } | null)?.resolveBankAccount?.accountName;
    if (typeof name !== "string" || !name.trim()) throw new Error("We couldn’t find that account. Check the bank and account number.");
    return name.trim();
  } catch (e) { throw friendlyError(e); }
}
export async function saveBankAccount(client: Client, ownerId: string, bankCode: string, accountNumber: string): Promise<PayoutBank> {
  let result;
  try { result = await client.mutate({ mutation: SAVE_BANK_ACCOUNT_MUTATION as never, variables: { bankCode, accountNumber }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
  const bank = parseBank((result.data as { saveBankAccount?: unknown } | null)?.saveBankAccount);
  if (!bank) throw new Error("The server did not confirm your bank account.");
  return bank;
}
export async function requestPayout(client: Client, ownerId: string, amountMinor: number): Promise<WalletPayout> {
  const signature = ownerId + ":" + amountMinor;
  const key = payoutKeys.get(signature) ?? newKey();
  payoutKeys.set(signature, key);
  let result;
  try { result = await client.mutate({ mutation: REQUEST_WALLET_PAYOUT_MUTATION as never, variables: { amountMinor, idempotencyKey: key }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) {
    // A refusal means nothing was reserved, so the next try is a fresh request. A dropped connection keeps the key.
    const message = friendlyError(e).message;
    if (!/network|timeout|failed to fetch|offline/i.test(message)) payoutKeys.delete(signature);
    throw friendlyError(e);
  }
  payoutKeys.delete(signature);
  return parsePayout((result.data as { requestWalletPayout?: unknown } | null)?.requestWalletPayout);
}

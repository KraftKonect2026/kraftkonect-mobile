// Live request / inspection / quote flow.
//
// The server (graphql/requestFlow.ts on the backend) owns every state change.
// This file only: (1) declares the GraphQL documents, (2) maps the server's
// FlowBooking into the BookingRecord the shared screens render, and (3) turns
// the screens' commands into the matching mutations. Nothing here decides that
// a payment succeeded or that a request exists; it displays what the server
// returned. Steps that need payments are not connected yet and fail loudly.

import { ApolloClient, gql } from "@apollo/client";
import type { RequestDraft, RequestReceipt } from "@/lib/discovery/model";
import type {
  BalancePayment, BookingListItem, BookingRecord, BookingRole, BookingStage, DateProposal, FinalQuote, Payment,
} from "./model";
import { parseMoney, sampleListItem } from "./model";

// ── GraphQL documents ───────────────────────────────────────────────────────

const QUOTE_FIELDS = `id version status scope materialsMinor labourMinor totalMinor depositCreditMinor remainingMinor workDate workTime duration`;
export const FLOW_BOOKING_FRAGMENT = gql`
  fragment FlowBookingFields on FlowBooking {
    id revision stage status customerId customerName providerId providerName providerUserId
    serviceId serviceTitle area preferredDate description serviceMode
    terms { version minimumMinor maximumMinor depositMinor date time mode }
    depositVerified
    depositPayment { reference status amountMinor termsVersion quoteVersion }
    balancePayment { reference status amountMinor termsVersion quoteVersion }
    inspectionDate inspectionTime address findings
    quote { ${QUOTE_FIELDS} }
    acceptedQuote { ${QUOTE_FIELDS} }
    workDate workTime
    dateProposal { id purpose date time by version status }
    cancelledBy cancelReason conversationId createdAt updatedAt
  }
`;

export const FLOW_BOOKING_QUERY = gql`
  query FlowBooking($id: ID!) { flowBooking(id: $id) { ...FlowBookingFields } }
  ${FLOW_BOOKING_FRAGMENT}
`;
export const MY_FLOW_BOOKINGS_QUERY = gql`
  query MyFlowBookings($role: FlowRole!) { myFlowBookings(role: $role, limit: 100) { ...FlowBookingFields } }
  ${FLOW_BOOKING_FRAGMENT}
`;

const mutation = (name: string, args: string, call: string) => gql`
  mutation ${name}(${args}) { ${call} { ...FlowBookingFields } }
  ${FLOW_BOOKING_FRAGMENT}
`;
export const CREATE_SERVICE_REQUEST = mutation("CreateServiceRequest", "$input: CreateServiceRequestInput!", "createServiceRequest(input: $input)");
export const RESPOND_TO_REQUEST = mutation("RespondToRequest", "$bookingId: ID!, $revision: Int!, $input: InspectionResponseInput!", "respondToRequest(bookingId: $bookingId, revision: $revision, input: $input)");
export const DECLINE_REQUEST = mutation("DeclineRequest", "$bookingId: ID!, $revision: Int!, $reason: String!", "declineRequest(bookingId: $bookingId, revision: $revision, reason: $reason)");
export const CANCEL_REQUEST = mutation("CancelRequest", "$bookingId: ID!, $revision: Int!, $reason: String!", "cancelRequest(bookingId: $bookingId, revision: $revision, reason: $reason)");
export const COMPLETE_INSPECTION = mutation("CompleteInspection", "$bookingId: ID!, $revision: Int!, $findings: String!", "completeInspection(bookingId: $bookingId, revision: $revision, findings: $findings)");
export const SEND_FINAL_QUOTE = mutation("SendFinalQuote", "$bookingId: ID!, $revision: Int!, $input: FlowQuoteInput!", "sendFinalQuote(bookingId: $bookingId, revision: $revision, input: $input)");
export const ACCEPT_FINAL_QUOTE = mutation("AcceptFinalQuote", "$bookingId: ID!, $revision: Int!, $version: Int!", "acceptFinalQuote(bookingId: $bookingId, revision: $revision, version: $version)");
export const PROPOSE_DATE = mutation("ProposeDate", "$bookingId: ID!, $revision: Int!, $purpose: String!, $date: String!, $time: String!", "proposeDate(bookingId: $bookingId, revision: $revision, purpose: $purpose, date: $date, time: $time)");
export const RESPOND_TO_DATE_PROPOSAL = mutation("RespondToDateProposal", "$bookingId: ID!, $revision: Int!, $proposalId: ID!, $accept: Boolean!", "respondToDateProposal(bookingId: $bookingId, revision: $revision, proposalId: $proposalId, accept: $accept)");

// ── Server payload ──────────────────────────────────────────────────────────

type PayloadQuote = { id: string; version: number; status: string; scope: string; materialsMinor: number; labourMinor: number; totalMinor: number; depositCreditMinor: number; remainingMinor: number; workDate?: string | null; workTime?: string | null; duration?: string | null };
type PayloadPayment = { reference: string; status: string; amountMinor: number; termsVersion?: number | null; quoteVersion?: number | null };
export type FlowBookingPayload = {
  id: string; revision: number; stage: string; status?: string | null;
  customerId: string; customerName?: string | null; providerId: string; providerName?: string | null; providerUserId?: string | null;
  serviceId?: string | null; serviceTitle?: string | null; area?: string | null; preferredDate?: string | null; description?: string | null; serviceMode: string;
  terms?: { version: number; minimumMinor?: number | null; maximumMinor?: number | null; depositMinor: number; date?: string | null; time?: string | null; mode: string } | null;
  depositVerified: boolean; depositPayment?: PayloadPayment | null; balancePayment?: PayloadPayment | null;
  inspectionDate?: string | null; inspectionTime?: string | null; address?: string | null; findings?: string | null;
  quote?: PayloadQuote | null; acceptedQuote?: PayloadQuote | null; workDate?: string | null; workTime?: string | null;
  dateProposal?: { id: string; purpose: string; date: string; time: string; by: string; version: number; status: string } | null;
  cancelledBy?: string | null; cancelReason?: string | null; conversationId?: string | null;
};

const STAGES: BookingStage[] = ["request", "response", "inspection_scheduled", "inspection_complete", "quote_sent", "work_scheduled", "work_in_progress", "work_review", "completed"];
const asRole = (value?: string | null): BookingRole => (value === "customer" ? "customer" : "provider");

function mapQuote(q: PayloadQuote | null | undefined, serviceTitle: string): FinalQuote | undefined {
  if (!q || !q.workDate || !q.workTime || !q.duration) return undefined;
  return {
    version: q.version, serviceTitle, scope: q.scope, materials: q.materialsMinor, labour: q.labourMinor, total: q.totalMinor,
    depositCredit: q.depositCreditMinor, remaining: q.remainingMinor, date: q.workDate, time: q.workTime, duration: q.duration, currency: "NGN",
  };
}

/** Map the server's booking into the record the shared screens render. */
export function flowToRecord(f: FlowBookingPayload): BookingRecord {
  if (!f || typeof f.id !== "string" || !f.id) throw new Error("The request could not be confirmed.");
  const stage = (STAGES as string[]).includes(f.stage) ? (f.stage as BookingStage) : "request";
  const serviceTitle = f.serviceTitle || "Requested service";
  const terms = f.terms
    ? { version: f.terms.version, minimum: f.terms.minimumMinor ?? 0, maximum: f.terms.maximumMinor ?? 0, deposit: f.terms.depositMinor, date: f.terms.date ?? f.preferredDate ?? "", time: f.terms.time ?? "00:00" }
    : undefined;
  const dep = f.depositPayment;
  const payment: Payment | undefined = dep && terms
    ? { reference: dep.reference, bookingId: f.id, termsVersion: dep.termsVersion ?? terms.version, purpose: "inspection", amount: dep.amountMinor, currency: "NGN", status: dep.status as Payment["status"] }
    : undefined;
  const bal = f.balancePayment;
  const accepted = mapQuote(f.acceptedQuote, serviceTitle);
  const balancePayment: BalancePayment | undefined = bal
    ? { reference: bal.reference, bookingId: f.id, quoteVersion: bal.quoteVersion ?? accepted?.version ?? 0, purpose: "balance", amount: bal.amountMinor, currency: "NGN", status: bal.status as BalancePayment["status"] }
    : undefined;
  const p = f.dateProposal;
  const dateProposal: DateProposal | undefined = p && p.status === "proposed"
    ? { id: p.id, version: p.version, purpose: p.purpose === "work" ? "work" : "inspection", status: "proposed", by: asRole(p.by), date: p.date, time: p.time }
    : undefined;
  return {
    schema: 1, id: f.id, revision: f.revision, source: "live",
    customerId: f.customerId, providerId: f.providerId,
    customerName: f.customerName || "Customer", providerName: f.providerName || "Provider",
    serviceId: f.serviceId || "", serviceTitle, area: f.area || "", preferredDate: f.preferredDate || "", description: f.description || "",
    serviceMode: f.serviceMode === "remote" ? "remote" : "onsite", stage,
    terms, payment,
    inspectionPaymentReference: payment?.status === "verified" ? payment.reference : undefined,
    acceptedTermsVersion: payment?.status === "verified" ? payment.termsVersion : undefined,
    address: f.address || undefined, findings: f.findings || undefined,
    cancelled: f.cancelledBy && f.cancelReason ? { by: asRole(f.cancelledBy), reason: f.cancelReason } : undefined,
    quote: mapQuote(f.acceptedQuote ?? f.quote, serviceTitle), acceptedQuote: accepted,
    balancePayment, balancePaymentReference: balancePayment?.status === "verified" ? balancePayment.reference : undefined,
    inspectionAppointment: f.inspectionDate && f.inspectionTime ? { date: f.inspectionDate, time: f.inspectionTime } : undefined,
    workAppointment: f.workDate && f.workTime ? { date: f.workDate, time: f.workTime } : undefined,
    dateProposal,
    commands: [], events: [], messages: [],
  };
}

export function flowListItem(f: FlowBookingPayload, role: BookingRole): BookingListItem {
  return sampleListItem(flowToRecord(f), role);
}

// ── Mutations ───────────────────────────────────────────────────────────────

export type LiveClient = Pick<ApolloClient<unknown>, "mutate" | "query">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

/**
 * The server answers problems with real HTTP statuses (400/403/404/409), which Apollo reports as
 * a bare "Response not successful: status code 409". The useful sentence ("This request changed.
 * Refresh and try again.") sits inside the response body, so surface that instead.
 */
export function friendlyError(error: unknown): Error {
  const e = error as { message?: string; graphQLErrors?: { message?: string }[]; networkError?: { result?: { errors?: { message?: string }[] } } } | null;
  const fromBody = e?.networkError?.result?.errors?.[0]?.message;
  const fromGraph = e?.graphQLErrors?.[0]?.message;
  const message = [fromBody, fromGraph].find((m): m is string => typeof m === "string" && !!m.trim()) ?? (e?.message && !/^Response not successful/.test(e.message) ? e.message : "Something went wrong. Please try again.");
  return new Error(message);
}

async function runRaw(client: LiveClient, ownerId: string, document: unknown, variables: Record<string, unknown>, field: string): Promise<FlowBookingPayload> {
  let result;
  try {
    result = await client.mutate({ mutation: document as never, variables, context: scoped(ownerId), fetchPolicy: "no-cache" } as never);
  } catch (error) {
    throw friendlyError(error);
  }
  const payload = (result.data as Record<string, FlowBookingPayload> | null | undefined)?.[field];
  if (!payload) throw new Error("The server did not confirm that change.");
  return payload;
}
/** Send a targeted request. A retried send of the same draft reuses its key, so it never duplicates. */
const requestKeys = new Map<string, string>();
const randomKey = () => "req-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
export async function sendServiceRequest(client: LiveClient, ownerId: string, draft: RequestDraft): Promise<RequestReceipt> {
  const signature = JSON.stringify([ownerId, draft.providerId, draft.serviceId, draft.area, draft.date, draft.description]);
  const key = requestKeys.get(signature) ?? randomKey();
  requestKeys.set(signature, key);
  const payload = await runRaw(client, ownerId, CREATE_SERVICE_REQUEST, {
    input: { providerId: draft.providerId, listingId: draft.serviceId, area: draft.area, preferredDate: draft.date, description: draft.description, idempotencyKey: key },
  }, "createServiceRequest");
  requestKeys.delete(signature);
  const record = flowToRecord(payload);
  return { id: record.id, providerId: record.providerId, serviceId: record.serviceId, status: "pending", ...(payload.conversationId ? { conversationId: payload.conversationId } : {}) };
}

type LiveCommand = { type: string; [key: string]: unknown };
const NOT_CONNECTED = "This step needs payments, which are not connected in this version yet.";
// Accepting a quote locks it, and the customer pays immediately afterwards. Until
// checkout is connected, accepting would strand the quote locked and unpayable, so
// it is held back with the payment step. Flip this when checkout ships.
const CHECKOUT_CONNECTED = false;

/** Run a screen command against the server and return the server's updated booking. */
export async function runFlowCommand(client: LiveClient, ownerId: string, role: BookingRole, current: FlowBookingPayload, command: LiveCommand): Promise<FlowBookingPayload> {
  const base = { bookingId: current.id, revision: current.revision };
  switch (command.type) {
    case "respond": {
      const d = command.draft as { minimum: string; maximum: string; deposit: string; date: string; time: string };
      const min = parseMoney(d.minimum), max = parseMoney(d.maximum), deposit = parseMoney(d.deposit);
      if (min === null || max === null || deposit === null) throw new Error("Enter valid amounts.");
      return runRaw(client, ownerId, RESPOND_TO_REQUEST, { ...base, input: { minimumMinor: min, maximumMinor: max, depositMinor: deposit, date: d.date, time: d.time, mode: current.serviceMode === "remote" ? "remote" : "onsite" } }, "respondToRequest");
    }
    case "complete_inspection":
      return runRaw(client, ownerId, COMPLETE_INSPECTION, { ...base, findings: String(command.findings ?? "") }, "completeInspection");
    case "cancel_request":
      return role === "provider"
        ? runRaw(client, ownerId, DECLINE_REQUEST, { ...base, reason: String(command.reason ?? "") }, "declineRequest")
        : runRaw(client, ownerId, CANCEL_REQUEST, { ...base, reason: String(command.reason ?? "") }, "cancelRequest");
    case "send_quote": {
      const d = command.draft as { scope: string; materials: string; labour: string; date: string; time: string; duration: string };
      const materials = parseMoney(d.materials), labour = parseMoney(d.labour);
      if (materials === null || labour === null) throw new Error("Enter valid materials and labour amounts.");
      return runRaw(client, ownerId, SEND_FINAL_QUOTE, { ...base, input: { scope: d.scope, materialsMinor: materials, labourMinor: labour, workDate: d.date, workTime: d.time, duration: d.duration } }, "sendFinalQuote");
    }
    case "accept_quote":
      if (!CHECKOUT_CONNECTED) throw new Error(NOT_CONNECTED);
      return runRaw(client, ownerId, ACCEPT_FINAL_QUOTE, { ...base, version: Number(command.version) }, "acceptFinalQuote");
    case "propose_date":
      return runRaw(client, ownerId, PROPOSE_DATE, { ...base, purpose: String(command.purpose), date: String(command.date), time: String(command.time) }, "proposeDate");
    case "respond_date":
      return runRaw(client, ownerId, RESPOND_TO_DATE_PROPOSAL, { ...base, proposalId: String(command.proposalId), accept: !!command.accept }, "respondToDateProposal");
    case "mark_messages_read":
      return current; // messages live in the Messages tab, which tracks its own read state
    case "message":
      throw new Error("Use Message to chat with the other person.");
    default:
      throw new Error(NOT_CONNECTED);
  }
}

import { accountReadSnapshot } from "@/lib/account/liveAccount";
import type { BookingRole } from "./model";

export type LegacyBookingRecord = {
  id: string; status?: string; bookingRef?: string; bookingDate?: string;
  currency?: string; totalPriceCents?: number; description?: string; notes?: string; revisionReason?: string;
  listing?: { id?: string; title?: string };
  provider?: { id?: string; name?: string; avatar?: string; user?: { id?: string } };
  customer?: { id?: string; name?: string; avatarUrl?: string };
};
export type OwnedBookingRead = { ownerId: string; role: BookingRole; records: LegacyBookingRecord[] };
const text = (value: unknown, max = 2000) => typeof value === "string" && value.trim() && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ? value.trim() : undefined;
const image = (value: unknown) => { const url = text(value, 2048); return url && /^https?:\/\//i.test(url) ? url : undefined; };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Your saved bookings could not be loaded.");
  return value as Record<string, unknown>;
}
/** The existing participant-scoped list is a read boundary, never new completion/payment permission. */
export function ownedBookingSnapshot(ownerId: string, role: BookingRole, me: unknown, response: unknown): OwnedBookingRead {
  accountReadSnapshot(ownerId, me);
  if (role !== "customer" && role !== "provider" || !Array.isArray(response)) throw new Error("Your saved bookings could not be loaded.");
  const ids = new Set<string>();
  const records = response.map(value => {
    const raw = object(value), id = text(raw.id, 200);
    if (!id || ids.has(id)) throw new Error("The saved booking records could not be confirmed.");
    ids.add(id);
    const amount = raw.totalPriceCents;
    if (amount !== undefined && amount !== null && (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0)) throw new Error("A saved booking amount could not be confirmed.");
    const p = raw.provider ? object(raw.provider) : undefined, c = raw.customer ? object(raw.customer) : undefined, listing = raw.listing ? object(raw.listing) : undefined;
    const user = p?.user ? object(p.user) : undefined, date = text(raw.bookingDate, 60), currency = text(raw.currency, 3);
    return {
      id, status: text(raw.status, 80), bookingRef: text(raw.bookingRef, 200), bookingDate: date && Number.isFinite(Date.parse(date)) ? date : undefined,
      currency: currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : undefined,
      totalPriceCents: typeof amount === "number" ? amount : undefined, description: text(raw.description), notes: text(raw.notes), revisionReason: text(raw.revisionReason),
      listing: listing ? { id: text(listing.id, 200), title: text(listing.title, 200) } : undefined,
      provider: p ? { id: text(p.id, 200), name: text(p.name, 200), avatar: image(p.avatar), user: user ? { id: text(user.id, 200) } : undefined } : undefined,
      customer: c ? { id: text(c.id, 200), name: text(c.name, 200), avatarUrl: image(c.avatarUrl) } : undefined,
    };
  });
  return { ownerId, role, records };
}
export function ownedBooking(read: OwnedBookingRead, id: unknown): LegacyBookingRecord | undefined {
  return typeof id === "string" ? read.records.find(record => record.id === id) : undefined;
}
export async function readOwnedBookings(ownerId: string, role: BookingRole, ports: { me: () => Promise<unknown>; bookings: () => Promise<unknown>; isCurrent: () => boolean }): Promise<OwnedBookingRead> {
  if (!ports.isCurrent()) throw new Error("The signed-in account changed. Please reopen your bookings.");
  const [me, records] = await Promise.all([ports.me(), ports.bookings()]);
  if (!ports.isCurrent()) throw new Error("The signed-in account changed. Please reopen your bookings.");
  return ownedBookingSnapshot(ownerId, role, me, records);
}

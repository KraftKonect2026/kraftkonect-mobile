// Production draft storage for the booking journeys.
//
// Unlike the preview store (which refuses to run outside development), this is
// the real, on-device save used for live bookings: in-progress forms such as a
// provider's response or quote, kept so a dropped connection loses nothing.
// Writes are serialised so rapid edits land in order.
import { secureStorage } from "@/lib/storage";

let queue: Promise<unknown> = Promise.resolve();
export function saveDraft(key: string, value: unknown): Promise<void> {
  const next = queue.then(() => secureStorage.setItem(key, JSON.stringify(value)));
  queue = next.catch(() => undefined);
  return next as Promise<void>;
}

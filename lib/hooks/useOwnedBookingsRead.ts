import type { BookingRole } from "@/lib/bookings/model";
import { readOwnedBookings } from "@/lib/bookings/liveBookings";
import { BOOKINGS_FOR_PROVIDER_QUERY, BOOKINGS_FOR_USER_QUERY, USER_PROFILE_QUERY } from "@/lib/queries";
import { ProviderReadClient, useOwnedProviderRead } from "./useOwnedProviderRead";

function bookingReader(role: BookingRole) {
  return async (client: ProviderReadClient, ownerId: string, isCurrent: () => boolean) => {
    const context = { accountOwnerId: ownerId, queryDeduplication: false };
    return readOwnedBookings(ownerId, role, {
      me: async () => (await client.query({ query: USER_PROFILE_QUERY, fetchPolicy: "no-cache", context })).data?.me,
      bookings: async () => { const result = await client.query({ query: role === "provider" ? BOOKINGS_FOR_PROVIDER_QUERY : BOOKINGS_FOR_USER_QUERY, fetchPolicy: "no-cache", context }); return role === "provider" ? result.data?.bookingsForProvider : result.data?.bookingsForUser; },
      isCurrent,
    });
  };
}
const customerReader = bookingReader("customer"), providerReader = bookingReader("provider");
export function useOwnedBookingsRead(role: BookingRole) { return useOwnedProviderRead(role === "provider" ? providerReader : customerReader); }

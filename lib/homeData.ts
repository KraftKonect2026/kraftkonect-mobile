import type { ImageSource } from "expo-image";

export type ProviderCardData = {
  id: string; name: string; service: string; image?: ImageSource | string | number;
  rating?: number | null; startingPrice?: string;
};
export type HomeJob = {
  id: string; title: string; customer: string; date: string; address?: string;
  description?: string; image?: ImageSource | string | number; avatar?: ImageSource | string | number;
};
export type ProviderProfile = {
  id: string; status: string; kycStatus?: string | null; available?: boolean;
};

export function providerStage(profile: ProviderProfile | null | undefined, hasService: boolean) {
  if (!profile) return "setup" as const;
  if (profile.status === "approved" && profile.kycStatus === "approved") return "ready" as const;
  if (profile.status === "rejected" || profile.kycStatus === "failed" || profile.kycStatus === "declined" || profile.kycStatus === "rejected") return "changes" as const;
  if (hasService && (profile.status === "pending" || profile.kycStatus === "pending" || profile.kycStatus === "submitted" || profile.kycStatus === "in_review")) return "pending" as const;
  return "setup" as const;
}

export type ExistingProvider = {
  id: string; name?: string; avatar?: string; banner?: string; verified?: boolean; status?: string;
  category?: string; rating?: number | null;
  services?: { title: string; active?: boolean; priceCents?: number; minPriceCents?: number | null; currency?: string; photos?: string[] | null }[];
};
export function toProviderCard(provider: ExistingProvider): ProviderCardData {
  const service = provider.services?.find(item => item.active);
  const cents = service?.minPriceCents ?? service?.priceCents;
  return {
    id: provider.id, name: provider.name || "Service provider",
    service: service?.title || provider.category || "View services",
    image: provider.banner || service?.photos?.[0] || provider.avatar || undefined,
    rating: provider.rating,
    startingPrice: cents != null ? new Intl.NumberFormat("en-NG", {
      style: "currency", currency: service?.currency || "NGN", maximumFractionDigits: 0,
    }).format(cents / 100) : undefined,
  };
}

export type ExistingBooking = {
  id: string; status: string; bookingDate?: string | null; description?: string | null; notes?: string | null;
  listing?: { title?: string | null } | null;
  customer?: { name?: string | null; avatarUrl?: string | null } | null;
};
export function toHomeJob(booking: ExistingBooking): HomeJob {
  const date = booking.bookingDate ? new Date(booking.bookingDate) : null;
  return {
    id: booking.id, title: booking.listing?.title || booking.description || "Service request",
    customer: booking.customer?.name || "Customer",
    date: date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "Date to be confirmed",
    description: booking.description || booking.notes || booking.listing?.title || "View request details",
    avatar: booking.customer?.avatarUrl || undefined,
    // Appointment address and work photos are not supplied by the current query.
  };
}

export function partitionJobs<T extends { status: string }>(bookings: T[]) {
  return {
    requests: bookings.filter(b => b.status === "pending"),
    active: bookings.filter(b => b.status === "confirmed" || b.status === "in_progress"),
    completed: bookings.filter(b => b.status === "completed"),
    cancelled: bookings.filter(b => b.status === "cancelled" || b.status === "refunded"),
  };
}

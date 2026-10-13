import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogoLoader } from "@/components/LogoLoader";
import { ownedBooking, OwnedBookingRead } from "@/lib/bookings/liveBookings";
import { BookingFrame, bs, Heading } from "./Parts";
import { ReviewFields } from "./ReviewFields";

export function LiveReviewContent({ read, bookingId, loading, error, onRetry, onBack, onUnavailable, preview = false }: { read?: OwnedBookingRead; bookingId?: string; loading: boolean; error?: string; onRetry: () => void; onBack: () => void; onUnavailable: () => void; preview?: boolean }) {
  const record = read?.role === "customer" ? ownedBooking(read, bookingId) : undefined;
  if (record?.status === "completed") return <ReviewDraft key={read!.ownerId + ":" + record.id} provider={record.provider?.name ?? "the provider"} service={record.listing?.title ?? "service"} error={error} loading={loading} onRetry={onRetry} onBack={onBack} onUnavailable={onUnavailable} preview={preview} />;
  return <BookingFrame preview={preview} onBack={onBack} footer={<Button title="Back to bookings" variant="outline" onPress={onBack} />}>
    {loading && !read ? <LogoLoader label="Loading booking" /> : !record ? <><Heading title="Review unavailable" /><Callout message={error ?? "This booking was not returned for the signed-in customer."} tone={error ? "error" : "neutral"} /><Button title="Try again" disabled={loading} onPress={onRetry} /></> : <><Heading title="Review unavailable" /><Callout message="The saved booking is not marked completed. Review it from your booking details." /></>}
  </BookingFrame>;
}
function ReviewDraft({ provider, service, error, loading, onRetry, onBack, onUnavailable, preview }: { provider: string; service: string; error?: string; loading: boolean; onRetry: () => void; onBack: () => void; onUnavailable: () => void; preview: boolean }) {
  const [rating, setRating] = useState(0), [text, setText] = useState("");
  return <BookingFrame preview={preview} onBack={onBack} footer={<View style={bs.actions}><Button title="Submit review" disabled={!rating || text.length > 500} onPress={onUnavailable} /><Button title="Skip for now" variant="outline" onPress={onBack} /></View>}>
    <Heading title={"How did " + provider.split(" ")[0] + " do?"} subtitle={"Review your completed " + service.toLowerCase() + "."} />
    {error && <><Callout title="Showing the last loaded booking" tone="error" message={error} /><Button title="Try again" size="compact" variant="outline" disabled={loading} onPress={onRetry} /></>}
    <View style={{ gap: 12 }}><ReviewFields rating={rating} text={text} onRating={setRating} onText={setText} /><Callout title="Completion verification unavailable" message="The saved status does not verify customer confirmation or an existing review. Your draft can be prepared here; submission is unavailable until those records are confirmed." /></View>
  </BookingFrame>;
}

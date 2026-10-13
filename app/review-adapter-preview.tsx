import { useState } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Sheet } from "@/components/discovery/Parts";
import { LiveReviewContent } from "@/components/bookings/LiveReviewContent";
import { ownedBookingSnapshot } from "@/lib/bookings/liveBookings";
import Colors from "@/constants/colors";

const read = ownedBookingSnapshot("fictional-aminas-account", "customer", { id: "fictional-aminas-account", name: "Amina Yusuf" }, [{ id: "fictional-booking", status: "completed", provider: { id: "fictional-provider", name: "Tobi Plumbing" }, listing: { id: "fictional-service", title: "Plumbing repair" } }]);
export default function ReviewAdapterPreviewRoute() { if (!__DEV__) return <Redirect href="/" />; return <Preview />; }
function Preview() {
  const [error, setError] = useState(false), [foreign, setForeign] = useState(false), [unavailable, setUnavailable] = useState(false);
  return <View style={{ flex: 1, backgroundColor: Colors.surface }}><View style={{ padding: 12, gap: 8, backgroundColor: Colors.background }}><AppText variant="bodySmall">REVIEW READ PREVIEW · Fictional booking · No review writes</AppText><View style={{ flexDirection: "row", gap: 8 }}><Button title="Read error" size="compact" variant="outline" onPress={() => setError(true)} /><Button title={foreign ? "Owned booking" : "Foreign link"} size="compact" variant="outline" onPress={() => setForeign(!foreign)} /></View></View>
    <LiveReviewContent preview read={read} bookingId={foreign ? "foreign-booking" : "fictional-booking"} loading={false} error={error ? "The booking could not be refreshed." : undefined} onRetry={() => setError(false)} onBack={() => setForeign(false)} onUnavailable={() => setUnavailable(true)} />
    {unavailable && <Sheet title="Review submission unavailable" showClose onClose={() => setUnavailable(false)}><Callout message="Your draft is kept. Completion and the saved review could not be verified." /><Button title="Done" onPress={() => setUnavailable(false)} /></Sheet>}
  </View>;
}

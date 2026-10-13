import { useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/store";
import { useOwnedBookingsRead } from "@/lib/hooks/useOwnedBookingsRead";
import { LiveReviewContent } from "@/components/bookings/LiveReviewContent";
import { Sheet } from "@/components/discovery/Parts";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import Colors from "@/constants/colors";

export default function ReviewRoute() { const owner = useAppSelector(s => s.auth.user?.id); return <OwnedReview key={owner ?? "signed-out"} />; }
function OwnedReview() {
  const router = useRouter(), params = useLocalSearchParams<{ bookingId?: string }>(), data = useOwnedBookingsRead("customer"), [unavailable, setUnavailable] = useState(false);
  if (!data.signedIn) return <Redirect href="/sign-in" />;
  return <View style={{ flex: 1, backgroundColor: Colors.surface }}><LiveReviewContent read={data.data} bookingId={typeof params.bookingId === "string" ? params.bookingId : undefined} loading={data.loading} error={data.error} onRetry={() => void data.refresh()} onBack={() => router.replace("/(app)/(tabs)/bookings")} onUnavailable={() => setUnavailable(true)} />
    {unavailable && <Sheet title="Review submission unavailable" showClose onClose={() => setUnavailable(false)}><Callout message="Your draft is kept. Completion, review ownership and the saved result could not be verified. Please try again later." /><Button title="Done" onPress={() => setUnavailable(false)} /></Sheet>}
  </View>;
}

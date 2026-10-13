import { Redirect, Stack } from "expo-router";
import { useModeRoute } from "@/lib/hooks/useAppMode";

export default function ProviderLayout() {
  const signedIn = useModeRoute("provider");
  if (!signedIn) return <Redirect href="/sign-in" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

import { Redirect, Stack } from "expo-router";
import { useModeRoute } from "@/lib/hooks/useAppMode";

export default function AppStackLayout() {
  const signedIn = useModeRoute("customer");
  if (!signedIn) return <Redirect href="/sign-in" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="book-again" options={{ headerShown: false }} />
      <Stack.Screen name="filter" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
      <Stack.Screen name="provider" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false }} />
    </Stack>
  );
}

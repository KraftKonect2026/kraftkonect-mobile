import { Stack } from "expo-router";

export default function AppStackLayout() {
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
      <Stack.Screen name="filter" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
      <Stack.Screen name="provider" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false }} />
    </Stack>
  );
}

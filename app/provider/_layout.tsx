import { Stack } from "expo-router";
import { ProviderContext } from "@/contexts/ProviderContext";

export default function ProviderLayout() {
  return (
    <ProviderContext>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ProviderContext>
  );
}

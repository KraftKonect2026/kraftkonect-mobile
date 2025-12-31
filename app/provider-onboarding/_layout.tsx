import { Stack } from "expo-router";
import { ProviderOnboardingProvider } from "./context";

export default function ProviderOnboardingLayout() {
    return (
        <ProviderOnboardingProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </ProviderOnboardingProvider>
    );
}

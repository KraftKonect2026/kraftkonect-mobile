import { Stack } from "expo-router";
import { ProviderOnboardingProvider } from "./context";

export default function ProviderOnboardingLayout() {
    return (
        <ProviderOnboardingProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                    animationDuration: 250,
                }}
            />
        </ProviderOnboardingProvider>
    );
}

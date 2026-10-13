import { useLocalSearchParams } from "expo-router";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import { OnboardingStep, steps } from "@/lib/onboarding/model";
export default function OnboardingRoute() {
  const { step } = useLocalSearchParams<{ step?: string }>();
  const initial = typeof step === "string" && steps.includes(step as OnboardingStep) ? step as OnboardingStep : "role";
  return <OnboardingJourney key={initial} initialStep={initial} />;
}

import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { IntroView } from "@/components/onboarding/IntroView";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import { OnboardingStep, steps } from "@/lib/onboarding/model";
import Colors from "@/constants/colors";

export default function AuthPreviewRoute() {
  const { step, screen } = useLocalSearchParams<{ step?: string; screen?: string }>();
  const requested = step ?? screen;
  const router = useRouter();
  if (!__DEV__) return <Redirect href="/" />;
  if (requested === "intro") return <IntroView
    previewBar={<View style={{ backgroundColor: Colors.background, minHeight: 44, justifyContent: "center", paddingHorizontal: 12 }}><AppText variant="footnote">LOCAL PREVIEW · No real sign-in or account creation</AppText></View>}
    onSignIn={() => router.replace({ pathname: "/auth-preview", params: { step: "sign-in" } })}
    onStart={() => router.replace({ pathname: "/auth-preview", params: { step: "role" } })} />;
  const initial = typeof requested === "string" && steps.includes(requested as OnboardingStep) ? requested as OnboardingStep : "sign-in";
  return <OnboardingJourney key={initial} initialStep={initial} preview />;
}

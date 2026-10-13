import { useRouter } from "expo-router";
import { IntroView } from "@/components/onboarding/IntroView";
export default function GetStartedScreen() {
  const router = useRouter();
  return <IntroView onSignIn={() => router.push("/sign-in")} onStart={() => router.push("/sign-up")} />;
}

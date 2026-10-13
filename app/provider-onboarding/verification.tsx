import { Redirect } from "expo-router";
export default function ProviderVerificationScreen() { return <Redirect href={{ pathname: "/onboarding", params: { step: "verification-intro" } }} />; }

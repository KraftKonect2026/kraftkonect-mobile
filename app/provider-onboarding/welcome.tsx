import { Redirect } from "expo-router";
export default function ProviderWelcomeScreen() { return <Redirect href={{ pathname: "/onboarding", params: { step: "work" } }} />; }

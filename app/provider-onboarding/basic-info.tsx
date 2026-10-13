import { Redirect } from "expo-router";
export default function ProviderSetupAlias() { return <Redirect href={{ pathname: "/onboarding", params: { step: "profile" } }} />; }

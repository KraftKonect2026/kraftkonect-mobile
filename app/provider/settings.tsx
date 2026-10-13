import { Redirect } from "expo-router";
export default function ProviderSettingsRoute(){return <Redirect href={{pathname:"/account-settings",params:{step:"preferences"}}}/>;}

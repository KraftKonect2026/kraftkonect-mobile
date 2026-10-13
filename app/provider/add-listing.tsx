import { Redirect } from "expo-router";
export default function LegacyAddServiceRoute(){return <Redirect href={{pathname:"/provider/services",params:{step:"create"}}}/>;}

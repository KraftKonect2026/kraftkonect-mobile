import { Redirect } from "expo-router";
export default function LegacyPayoutHistoryRoute(){return <Redirect href={{pathname:"/provider/earnings",params:{step:"activity"}}}/>;}

import { Redirect } from "expo-router";
export default function LegacyPayoutAccountsRoute(){return <Redirect href={{pathname:"/provider/earnings",params:{step:"banks"}}}/>;}

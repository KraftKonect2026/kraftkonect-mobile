import { Redirect } from "expo-router";
export default function PaymentMethodsRoute(){return <Redirect href={{pathname:"/account-settings",params:{step:"payments"}}}/>;}

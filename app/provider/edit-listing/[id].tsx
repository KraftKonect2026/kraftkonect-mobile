import { Redirect, useLocalSearchParams } from "expo-router";
export default function LegacyEditServiceRoute(){const params=useLocalSearchParams<{id?:string}>();return <Redirect href={{pathname:"/provider/services",params:{step:"edit",serviceId:typeof params.id==="string"?params.id:""}}}/>;}

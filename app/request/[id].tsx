import { useLocalSearchParams } from "expo-router";
import { LiveRequest } from "@/components/bookings/LiveRequest";
export default function RequestRoute(){
  const {id}=useLocalSearchParams<{id?:string}>();
  return typeof id==="string"&&id?<LiveRequest id={id}/>:null;
}

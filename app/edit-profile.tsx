import { Redirect } from "expo-router";
export default function EditProfileRoute(){return <Redirect href={{pathname:"/account-settings",params:{step:"profile-details"}}}/>;}

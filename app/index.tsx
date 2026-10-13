import { useEffect } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View, StatusBar } from "react-native";
import { Image } from "expo-image";
import { store } from "@/store";
import { homeForMode, resolveAppMode } from "@/lib/appMode";
import Colors from "@/constants/colors";

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const auth = store.getState().auth;
    if (auth.accessToken && auth.isAuthenticated && auth.user) router.replace(homeForMode(resolveAppMode(auth)));
    else router.replace(auth.lastPhone || auth.lastEmail ? "/sign-in" : "/get-started");
  }, [router]);
  return <View style={styles.screen}><StatusBar hidden />
    <Image source={require("@/assets/onboarding/splash-mark.svg")} style={{ width: 117.896, height: 144.9 }} contentFit="contain" accessibilityLabel="KraftKonect" />
  </View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary } });

import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useAppSelector, useAppDispatch, store } from "@/store";
import { signOut } from "@/store/authSlice";
import { ScreenBackground } from "@/components/ScreenBackground";

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   dispatch(signOut());
  // }, [dispatch]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      const auth = store.getState().auth;
      const isAuthenticated = auth.accessToken !== null;
      const isProvider = auth.user?.role === "provider";
      // Returning user whose session expired: send them straight to sign-in
      // (email is pre-filled there, so they only need their password).
      const returningUser = !!auth.lastEmail;

      if (isAuthenticated && isProvider) {
        router.replace("/provider/(tabs)/today");
      } else if (isAuthenticated && !isProvider) {
        router.replace("/(app)" as any);
      } else if (returningUser) {
        router.replace("/sign-in" as any);
      } else {
        router.replace("/get-started");
      }
    }, 2000);

    return () => clearTimeout(timer);

    return () => clearTimeout(timer);
  }, [isLoading, router, fadeAnim, scaleAnim, colorAnim]);

  const logoOpacity = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={{ opacity: logoOpacity }}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});

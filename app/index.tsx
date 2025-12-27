import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useAppSelector, useAppDispatch, store } from "@/store";
import { signOut } from "@/store/authSlice";

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
      if (!isLoading) {
        // Check if user is authenticated and redirect accordingly
        const isAuthenticated = store.getState().auth.accessToken !== null;
        const isProvider = store.getState().auth.user?.role === "provider";
        if (isAuthenticated && isProvider) {
          router.replace("/provider/(tabs)/today");
        } else if (isAuthenticated && !isProvider) {
          router.replace("/(app)/explore");
        } else {
          router.replace("/get-started");
        }
      } else {
        const isAuthenticated = store.getState().auth.accessToken !== null;
        router.replace(isAuthenticated ? "/(app)/explore" : "/get-started");
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
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/btlhywtjwcxau0pm0xpab" }}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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

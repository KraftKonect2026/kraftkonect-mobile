import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="get-started" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up/index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up/verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up/verify-phone" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password/index" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password/reset" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="booking-detail/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[providerId]" options={{ headerShown: false }} />
      <Stack.Screen name="review/[bookingId]" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="provider" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/basic-info" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/category" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/verification" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/experience" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/submit" options={{ headerShown: false }} />
      <Stack.Screen name="provider-onboarding/pending-approval" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

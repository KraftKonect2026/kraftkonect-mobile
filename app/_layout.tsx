import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ApolloProvider } from "@apollo/client/react";
import { useAppSelector } from "@/store";
import { store, persistor } from "@/store";
import apolloClient from "@/lib/apolloClient";
import { ToastProvider } from "@/lib/toast";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated !== null);
  console.log("isAuthenticated:", isAuthenticated);
  const isRehydrated = useAppSelector((state) => state._persist?.rehydrated);

  console.log("isAuthenticated:", isAuthenticated, "isRehydrated:", isRehydrated);

  // Hide splash screen once rehydrated
  useEffect(() => {
    if (isRehydrated) {
      SplashScreen.hideAsync();
    }
  }, [isRehydrated]);

  // Don't render navigation until rehydrated
  if (!isRehydrated) {
    return null;
  }
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      {isAuthenticated === false ? (
        // Auth Screens (shown when not authenticated)
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="get-started" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up/index" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up/verify-email" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up/verify-phone" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password/index" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password/reset" options={{ headerShown: false }} />
        </>
      ) : (
        // App Screens (shown when authenticated)
        <>
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
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {


  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ToastProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </PersistGate>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    </Provider>
  );
}

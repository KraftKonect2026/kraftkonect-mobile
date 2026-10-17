import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ApolloProvider } from "@apollo/client/react";
import { store, persistor, useAppSelector } from "@/store";
import apolloClient from "@/lib/apolloClient";
import { ToastProvider } from "@/lib/toast";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { interFontMap, applyGlobalInterFont } from "@/lib/fonts";
import { UpdateBanner } from "@/components/UpdateBanner";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

// Apply Inter to every Text/TextInput in the app (once, at module load).
applyGlobalInterFont();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated && !!state.auth.accessToken && !!state.auth.user);
  const isRehydrated = useAppSelector((state) => state._persist?.rehydrated);

  const [fontsLoaded] = useFonts(interFontMap);

  const ready = isRehydrated && fontsLoaded;
  usePushNotifications(!!ready);

  // Hide splash screen once state is rehydrated and fonts are loaded
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Don't render navigation until rehydrated and fonts are ready
  if (!ready) {
    return null;
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Back",
        animation: "slide_from_right",
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="get-started" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up/index" />
      <Stack.Screen name="sign-up/verify-email" />
      <Stack.Screen name="sign-up/verify-phone" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="forgot-password/reset" />
      <Stack.Screen name="design-system" />
      <Stack.Screen name="app-preview" />
      <Stack.Screen name="auth-preview" />
      <Stack.Screen name="discovery-preview" />
      <Stack.Screen name="booking-preview" />
      <Stack.Screen name="finance-preview" />
      <Stack.Screen name="provider-preview" />
      <Stack.Screen name="account-preview" />
      <Stack.Screen name="messages-preview" />
      <Stack.Screen name="notifications-preview" />
      <Stack.Screen name="support-preview" />
      <Stack.Screen name="account-adapter-preview" />
      <Stack.Screen name="messages-adapter-preview" />
      <Stack.Screen name="provider-adapter-preview" />
      <Stack.Screen name="finance-adapter-preview" />
      <Stack.Screen name="review-adapter-preview" />
      <Stack.Screen name="recovery-preview" />
      <Stack.Screen name="recovery" />
      <Stack.Screen name="onboarding" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="legacy-sign-in" />
        <Stack.Screen name="legacy-sign-up" />
        <Stack.Screen name="email-sign-in" />
        <Stack.Screen name="email-sign-up" />
      </Stack.Protected>
      <Stack.Screen name="email-verify" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="provider" />
        <Stack.Screen name="provider-onboarding" />
        <Stack.Screen name="booking-detail/[id]" />
        <Stack.Screen name="chat/[providerId]" />
        <Stack.Screen name="review/[bookingId]" options={{ presentation: "modal" }} />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="account-settings" />
      </Stack.Protected>
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
                <UpdateBanner />
              </GestureHandlerRootView>
            </ToastProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </PersistGate>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    </Provider>
  );
}

import { Stack } from "expo-router";
import React from "react";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="[providerId]/select-service" />
      <Stack.Screen name="[providerId]/date-time" />
      <Stack.Screen name="[providerId]/summary" />
      <Stack.Screen name="[providerId]/payment" />
      {/* Confirmation slides up like a success sheet */}
      <Stack.Screen
        name="[providerId]/confirmation"
        options={{ animation: "slide_from_bottom", gestureEnabled: false }}
      />
    </Stack>
  );
}

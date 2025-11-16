import { Stack } from "expo-router";
import React from "react";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[providerId]/select-service" />
      <Stack.Screen name="[providerId]/date-time" />
      <Stack.Screen name="[providerId]/summary" />
      <Stack.Screen name="[providerId]/payment" />
      <Stack.Screen name="[providerId]/confirmation" />
    </Stack>
  );
}

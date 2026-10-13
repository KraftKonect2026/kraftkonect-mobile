import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { DesignIcon } from "@/components/DesignIcon";

export default function AppLayout() {
  return <Tabs tabBar={props => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ focused }) => <DesignIcon name="home" active={focused} /> }} />
    <Tabs.Screen name="bookings" options={{ title: "Bookings", tabBarIcon: ({ focused }) => <DesignIcon name="calendar" active={focused} /> }} />
    <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ focused }) => <DesignIcon name="messages" active={focused} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Account", tabBarIcon: ({ focused }) => <DesignIcon name="account" active={focused} /> }} />
    <Tabs.Screen name="favourites" options={{ href: null, title: "Saved providers" }} />
  </Tabs>;
}

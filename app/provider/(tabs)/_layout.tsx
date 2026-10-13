import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { DesignIcon } from "@/components/DesignIcon";

export default function ProviderTabsLayout() {
  return <Tabs tabBar={props => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="today" options={{ title: "Home", tabBarIcon: ({ focused }) => <DesignIcon name="home" active={focused} /> }} />
    <Tabs.Screen name="jobs" options={{ title: "Jobs", tabBarIcon: ({ focused }) => <DesignIcon name="calendar" active={focused} /> }} />
    <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ focused }) => <DesignIcon name="messages" active={focused} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Account", tabBarIcon: ({ focused }) => <DesignIcon name="account" active={focused} /> }} />
    <Tabs.Screen name="services" options={{ href: null, title: "Services" }} />
    <Tabs.Screen name="calendar" options={{ href: null, title: "Availability" }} />
  </Tabs>;
}

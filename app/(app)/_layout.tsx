import { Tabs } from "expo-router";
import { Home, Heart, Calendar, MessageCircle, User } from "lucide-react-native";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Explore is reachable from the "More" category tile on Home */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, size, focused }) => (
            <Heart size={size} color={color} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : "transparent"} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size, focused }) => (
            <MessageCircle size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      /> */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="filter"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="provider"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

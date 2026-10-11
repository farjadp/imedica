import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";

import { color, font } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.pine,
        tabBarInactiveTintColor: color.ink3,
        tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: color.card, borderTopColor: color.rule },
        sceneStyle: { backgroundColor: color.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Library", tabBarIcon: ({ color: c, size }) => <Feather name="activity" color={c} size={size - 2} /> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color: c, size }) => <Feather name="clock" color={c} size={size - 2} /> }} />
      <Tabs.Screen name="research" options={{ title: "Research", tabBarIcon: ({ color: c, size }) => <Feather name="book-open" color={c} size={size - 2} /> }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: ({ color: c, size }) => <Feather name="user" color={c} size={size - 2} /> }} />
    </Tabs>
  );
}

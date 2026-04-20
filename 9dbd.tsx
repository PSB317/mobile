import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: "Main" }}
      />
      <Tabs.Screen
        name="export"
        options={{ title: "Export" }}
      />
      <Tabs.Screen
        name="login"
        options={{ title: "Login" }}
      />
    </Tabs>
  );
}


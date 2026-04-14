import React, { useState } from "react";
import { SafeAreaView, Text, TextInput, Button, View, ActivityIndicator } from "react-native";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:8000";

export default function LoginScreen() {
  const { token, username, login, logout } = useAuth();

  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.detail ?? "Login failed");
      }

      await login(json.token, json.username);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Login</Text>

      {token ? (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16 }}>
            Logged in as <Text style={{ fontWeight: "800" }}>{username}</Text>
          </Text>
          <Button title="Logout" onPress={() => logout()} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text>Username</Text>
          <TextInput
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Password</Text>
          <TextInput
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Button title={loading ? "Logging in..." : "Login"} onPress={doLogin} disabled={loading} />
          {loading ? <ActivityIndicator /> : null}
          {error ? <Text style={{ color: "crimson" }}>Error: {error}</Text> : null}

          <Text style={{ opacity: 0.7, marginTop: 10 }}>
            Demo accounts: admin/admin123 or consultant/risk123
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
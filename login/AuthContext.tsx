import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  token: string | null;
  username: string | null;
  isLoading: boolean;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_username";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        const u = await AsyncStorage.getItem(USER_KEY);
        setToken(t);
        setUsername(u);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(() => ({
    token,
    username,
    isLoading,
    login: async (t, u) => {
      await AsyncStorage.setItem(TOKEN_KEY, t);
      await AsyncStorage.setItem(USER_KEY, u);
      setToken(t);
      setUsername(u);
    },
    logout: async () => {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUsername(null);
    },
  }), [token, username, isLoading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
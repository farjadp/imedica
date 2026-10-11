import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, setToken, setUnauthorizedHandler } from "./api";
import type { Me } from "./types";

const TOKEN_KEY = "imedica.session";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: Me };

type AuthContext = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const clear = useCallback(async () => {
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    queryClient.clear();
    setState({ status: "signedOut" });
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (!saved) return setState({ status: "signedOut" });
      setToken(saved);
      try {
        setState({ status: "signedIn", user: await api<Me>("GET", "/me") });
      } catch {
        // Offline or expired: either way, sign in again.
        await clear();
      }
    })();
  }, [clear]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token } = await api<{ token: string }>("POST", "/auth/login", { email, password });
    setToken(token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setState({ status: "signedIn", user: await api<Me>("GET", "/me") });
  }, []);

  const signOut = useCallback(async () => {
    await api("POST", "/auth/logout").catch(() => {});
    await clear();
  }, [clear]);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useMe(): Me {
  const auth = useAuth();
  if (auth.status !== "signedIn") throw new Error("useMe needs a signed-in user");
  return auth.user;
}

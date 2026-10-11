import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, setToken, setUnauthorizedHandler } from "./api";
import { useLock } from "./lock";
import { registerForPush, unregisterPush } from "./push";
import type { Me } from "./types";

const TOKEN_KEY = "imedica.session";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: Me };

type AuthContext = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads /me after the profile changes. */
  refresh: () => Promise<void>;
  /** Swaps in a new session token, e.g. after a password change. */
  replaceToken: (token: string) => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { reset: resetLock } = useLock();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const clear = useCallback(async () => {
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await resetLock();
    queryClient.clear();
    setState({ status: "signedOut" });
  }, [queryClient, resetLock]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (!saved) return setState({ status: "signedOut" });
      setToken(saved);
      try {
        setState({ status: "signedIn", user: await api<Me>("GET", "/me") });
        // Refresh the push token quietly; asking happens at sign-in.
        void registerForPush({ ask: false });
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
    // Right after signing in is the moment to ask for notifications.
    void registerForPush({ ask: true });
  }, []);

  const signOut = useCallback(async () => {
    // While the token still works: this phone stops getting their notices.
    await unregisterPush();
    await api("POST", "/auth/logout").catch(() => {});
    await clear();
  }, [clear]);

  const refresh = useCallback(async () => {
    setState({ status: "signedIn", user: await api<Me>("GET", "/me") });
  }, []);

  const replaceToken = useCallback(async (next: string) => {
    setToken(next);
    await SecureStore.setItemAsync(TOKEN_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, refresh, replaceToken }),
    [state, signIn, signOut, refresh, replaceToken],
  );
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

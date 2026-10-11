import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

// An optional Face ID / fingerprint lock. Off by default; when on, the app
// asks again at launch and whenever it comes back after LOCK_AFTER_MS away.
// The session token never leaves SecureStore either way.

const LOCK_KEY = "imedica.lock";
const LOCK_AFTER_MS = 30_000;

type LockContext = {
  enabled: boolean;
  locked: boolean;
  /** "Face ID", "Fingerprint", or null when the phone has no enrolled biometrics. */
  method: string | null;
  unlock: () => Promise<boolean>;
  /** Resolves to null on success, or a sentence saying why the lock didn't change. */
  setEnabled: (on: boolean) => Promise<string | null>;
  /** On sign-out: the next person on this phone starts without a lock. */
  reset: () => Promise<void>;
};

const Ctx = createContext<LockContext | null>(null);

async function biometricMethod(): Promise<string | null> {
  const [hardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
  if (!hardware || !enrolled) return null;
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Fingerprint";
  return "Biometrics";
}

export function LockProvider({ children }: { children: ReactNode }) {
  const [enabled, setOn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const awaySince = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [saved, m] = await Promise.all([SecureStore.getItemAsync(LOCK_KEY).catch(() => null), biometricMethod().catch(() => null)]);
      setMethod(m);
      const on = saved === "on" && m !== null;
      setOn(on);
      setLocked(on);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") awaySince.current = Date.now();
      if (next === "active" && awaySince.current !== null) {
        if (enabled && Date.now() - awaySince.current > LOCK_AFTER_MS) setLocked(true);
        awaySince.current = null;
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Imedica",
      cancelLabel: "Cancel",
      fallbackLabel: "Use passcode",
    });
    if (result.success) setLocked(false);
    return result.success;
  }, []);

  const setEnabled = useCallback(async (on: boolean) => {
    if (on) {
      // Prove it works before relying on it.
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Turn on the app lock" });
      if (!result.success) {
        if (result.error === "user_cancel" || result.error === "app_cancel" || result.error === "system_cancel") return "";
        return result.error === "not_enrolled" || result.error === "passcode_not_set"
          ? "Set up Face ID or a fingerprint in your phone’s settings first."
          : "That didn’t work. Try again.";
      }
    }
    await SecureStore.setItemAsync(LOCK_KEY, on ? "on" : "off");
    setOn(on);
    return null;
  }, []);

  const reset = useCallback(async () => {
    await SecureStore.deleteItemAsync(LOCK_KEY).catch(() => {});
    setOn(false);
    setLocked(false);
  }, []);

  const value = useMemo(() => ({ enabled, locked, method, unlock, setEnabled, reset }), [enabled, locked, method, unlock, setEnabled, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLock() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLock must be used inside LockProvider");
  return ctx;
}

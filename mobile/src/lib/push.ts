import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { api } from "./api";

// Push for one thing only: "your pre- or post-test is open". The server never
// puts scores or clinical content in a notice (src/server/push.ts).

const PUSH_TOKEN_KEY = "imedica.pushToken";

// Show the notice even while the app is open; it's rare and it matters.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushResult = "registered" | "denied" | "unavailable";

/**
 * Registers this phone with the server. With `ask`, shows the system prompt
 * if the person hasn't answered it yet; without, only refreshes an existing
 * grant. Never throws: a phone without push still works.
 */
export async function registerForPush({ ask }: { ask: boolean }): Promise<PushResult> {
  try {
    // The EAS project id ties tokens to this app. Until `eas init` has run there is none.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return "unavailable";

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("assessments", {
        name: "Pre- and post-tests",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && ask) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return "denied";

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api("POST", "/me/devices", { token, platform: Platform.OS === "ios" ? "ios" : "android" });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    return "registered";
  } catch {
    return "unavailable";
  }
}

/** On sign-out: this phone stops getting the signed-out person's notices. */
export async function unregisterPush() {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
  if (!token) return;
  await api("DELETE", "/me/devices", { token }).catch(() => {});
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
}

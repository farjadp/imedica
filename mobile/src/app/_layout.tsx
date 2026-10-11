import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans";
import { SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_500Medium } from "@expo-google-fonts/source-serif-4";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { LockScreen } from "@/components/lock-screen";
import { SplashIntro } from "@/components/splash-intro";
import { ApiError } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LockProvider, useLock } from "@/lib/lock";
import { color } from "@/lib/theme";

// Hold the native splash until fonts and the saved session are known.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't hammer the server over a 4xx; do retry a dropped connection once.
      retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});

function RootNavigator() {
  const auth = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_500Medium,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const lock = useLock();
  const notice = Notifications.useLastNotificationResponse();
  const [introDone, setIntroDone] = useState(false);
  const ready = (fontsLoaded || Boolean(fontError)) && auth.status !== "loading";

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  // Tapping "your pre-test is open" goes straight to it.
  const windowId = notice?.notification.request.content.data?.windowId;
  useEffect(() => {
    if (ready && auth.status === "signedIn" && typeof windowId === "string") router.push(`/assessment/${windowId}`);
  }, [ready, auth.status, windowId]);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.monitor }} />;

  const signedIn = auth.status === "signedIn";
  const paramedic = signedIn && auth.user.role === "PARAMEDIC";

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <StatusBar style={introDone && signedIn ? "dark" : "light"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
          <Stack.Screen name="invite/[token]" options={{ animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={paramedic}>
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="scenario/[id]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
          <Stack.Screen name="run/[id]" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="review/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="assessment/[windowId]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="assessment/quiz/[id]" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
          <Stack.Screen name="paper/[source]/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="profile/edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="profile/password" options={{ presentation: "modal" }} />
          <Stack.Screen name="profile/delete" options={{ presentation: "modal" }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !paramedic}>
          <Stack.Screen name="staff" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
      {signedIn && lock.locked ? <LockScreen /> : null}
      {introDone ? null : <SplashIntro onDone={finishIntro} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClient}>
        <LockProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </LockProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

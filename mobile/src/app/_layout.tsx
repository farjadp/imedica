import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans";
import { SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_500Medium } from "@expo-google-fonts/source-serif-4";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SplashIntro } from "@/components/splash-intro";
import { ApiError } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
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
  const [introDone, setIntroDone] = useState(false);
  const ready = (fontsLoaded || Boolean(fontError)) && auth.status !== "loading";

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);
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
        </Stack.Protected>
        <Stack.Protected guard={paramedic}>
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="scenario/[id]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
          <Stack.Screen name="run/[id]" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="review/[id]" options={{ animation: "slide_from_right" }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !paramedic}>
          <Stack.Screen name="staff" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
      {introDone ? null : <SplashIntro onDone={finishIntro} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

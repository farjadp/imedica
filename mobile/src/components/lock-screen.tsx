import Feather from "@expo/vector-icons/Feather";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { useLock } from "@/lib/lock";
import { color } from "@/lib/theme";

import { Button } from "./button";
import { EcgTrace } from "./ecg";
import { LogoMark } from "./logo";
import { Body, Display, Mono } from "./type";

/** Covers the app until Face ID / fingerprint says it's them. Asks once on its own. */
export function LockScreen() {
  const { unlock, method } = useLock();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    const t = setTimeout(() => void unlock(), 350);
    return () => clearTimeout(t);
  }, [unlock]);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, styles.root, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.pad}>
        <LogoMark size={34} tone={color.mint} />
        <Display tone={color.screenInk} size={40} style={{ marginTop: 28 }}>
          Locked.
        </Display>
        <Body tone={color.screenInk2} style={{ marginTop: 10 }}>
          Your training record stays on this side of {method ?? "the lock"}.
        </Body>
      </View>
      <View style={{ marginVertical: 40 }}>
        <EcgTrace width={width} height={56} hr={64} />
      </View>
      <View style={{ flex: 1 }} />
      <View style={[styles.pad, { gap: 12 }]}>
        <Button label={`Unlock with ${method ?? "passcode"}`} variant="mint" onPress={() => void unlock()} />
        <Pressable onPress={() => void signOut()} style={{ alignSelf: "center", padding: 10, flexDirection: "row", gap: 8, alignItems: "center" }} accessibilityRole="button">
          <Feather name="log-out" size={15} color={color.screenInk2} />
          <Mono tone={color.screenInk2}>SIGN OUT INSTEAD</Mono>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: color.monitor, zIndex: 20 },
  pad: { paddingHorizontal: 24 },
});

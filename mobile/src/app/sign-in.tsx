import * as Linking from "expo-linking";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { EcgTrace } from "@/components/ecg";
import { LogoMark } from "@/components/logo";
import { Body, Display, Mono } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { color, font, radius } from "@/lib/theme";

export default function SignIn() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.pad}>
          <View style={styles.brand}>
            <LogoMark size={26} tone={color.mint} />
            <Mono tone={color.screenInk2} size={11} style={{ letterSpacing: 2 }}>
              IMEDICA · PARAMEDIC
            </Mono>
          </View>

          <Animated.View entering={FadeInDown.duration(700).delay(150)}>
            <Display tone={color.screenInk} size={54} style={{ marginTop: 44 }}>
              Decide{"\n"}
              <Display tone={color.mint} size={54} style={{ fontFamily: font.displayItalic }}>
                before
              </Display>
              {"\n"}the call.
            </Display>
            <Body tone={color.screenInk2} style={{ marginTop: 14, maxWidth: 300 }}>
              Physician-written scenarios, scored the moment you decide.
            </Body>
          </Animated.View>
        </View>

        <View style={{ marginVertical: 28 }}>
          <EcgTrace width={width} height={64} hr={72} />
        </View>

        <Animated.View entering={FadeInDown.duration(700).delay(350)} style={[styles.pad, { gap: 12 }]}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@service.ca"
            placeholderTextColor={color.mintDim}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            style={styles.input}
            accessibilityLabel="Email"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={color.mintDim}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            style={styles.input}
            accessibilityLabel="Password"
          />
          {error ? (
            <Body tone={color.alarm} size={14} accessibilityLiveRegion="polite">
              {error}
            </Body>
          ) : null}
          <Button label="Sign in" variant="mint" loading={busy} onPress={submit} style={{ marginTop: 4 }} />
          <Pressable
            onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_API_URL}/forgot-password`)}
            style={{ alignSelf: "center", padding: 10 }}
            accessibilityRole="link"
          >
            <Body tone={color.mint} size={14}>
              Forgot your password?
            </Body>
          </Pressable>
          <Body tone={color.screenInk2} size={12.5} style={{ textAlign: "center", marginTop: 8 }}>
            Your service invites you. Ask your training lead if you don’t have an account.
          </Body>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.monitor },
  pad: { paddingHorizontal: 24 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.monitorRule,
    backgroundColor: color.monitor2,
    paddingHorizontal: 16,
    color: color.screenInk,
    fontFamily: font.sans,
    fontSize: 16,
  },
});

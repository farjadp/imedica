import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { LogoMark } from "@/components/logo";
import { Loading } from "@/components/screen";
import { Body, Display, Mono } from "@/components/type";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { color, radius } from "@/lib/theme";

// Opened by the invitation email's link (https://www.imedica.tech/invite/<token>)
// when the app is installed: join here instead of on the web.

type Invitation = { email: string; role: string; organizationName: string; expiresAt: string };

const LEVELS = [
  { value: "PCP", label: "PCP" },
  { value: "ACP", label: "ACP" },
  { value: "CCP", label: "CCP" },
  { value: "EMR", label: "EMR" },
  { value: "STUDENT", label: "Student" },
  { value: "OTHER", label: "Other" },
];

export default function Join() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const invite = useQuery({ queryKey: ["invitation", token], queryFn: () => api<Invitation>("GET", `/invitations/${token}`), retry: false });

  if (invite.isPending) return <Loading dark />;
  if (invite.error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 40, paddingHorizontal: 24, gap: 14 }]}>
        <LogoMark size={30} tone={color.mint} />
        <Display tone={color.screenInk} size={34} style={{ marginTop: 16 }}>
          This invitation can’t be used.
        </Display>
        <Body tone={color.screenInk2}>{errorMessage(invite.error)}</Body>
        <Button label="Sign in instead" variant="mint" style={{ marginTop: 12 }} onPress={() => router.replace("/sign-in")} />
      </View>
    );
  }
  return <JoinForm token={token} invite={invite.data} />;
}

function JoinForm({ token, invite }: { token: string; invite: Invitation }) {
  const { signInWithToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [years, setYears] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    const local: Record<string, string> = {};
    if (!firstName.trim()) local.firstName = "Enter your first name.";
    if (!lastName.trim()) local.lastName = "Enter your last name.";
    if (password.length < 12) local.password = "At least 12 characters, with a letter and a number.";
    if (password !== confirm) local.confirm = "The passwords don’t match.";
    setErrors(local);
    setProblem(null);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const { token: session } = await api<{ token: string }>("POST", `/invitations/${token}/accept`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        level: level ?? "",
        yearsExperience: years.trim() === "" ? "" : Number(years),
        password,
        confirm,
      });
      // Signing in swaps this screen for the library (the guards in _layout).
      await signInWithToken(session);
    } catch (e) {
      setProblem(
        e instanceof ApiError && e.status === 422
          ? "Check the fields above. Passwords need 12 characters with a letter and a number."
          : errorMessage(e),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.pad}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <LogoMark size={26} tone={color.mint} />
            <Mono tone={color.screenInk2} size={11} style={{ letterSpacing: 2 }}>
              INVITATION
            </Mono>
          </View>
          <Display tone={color.screenInk} size={40} style={{ marginTop: 28 }}>
            Join {invite.organizationName}.
          </Display>
          <Body tone={color.screenInk2} style={{ marginTop: 10 }}>
            You’re joining as a {invite.role === "PARAMEDIC" ? "paramedic" : invite.role.toLowerCase()} with{" "}
            <Body tone={color.screenInk} medium>
              {invite.email}
            </Body>
            .
          </Body>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(120)} style={styles.sheet}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Mono>LEVEL (OPTIONAL)</Mono>
            <View style={styles.chips}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l.value}
                  onPress={() => setLevel(level === l.value ? null : l.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: level === l.value }}
                  style={[styles.chip, level === l.value && styles.chipOn]}
                >
                  <Body size={14} medium tone={level === l.value ? color.paper : color.ink2}>
                    {l.label}
                  </Body>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label="Years in practice (optional)"
            value={years}
            onChangeText={(v) => setYears(v.replace(/\D/g, "").slice(0, 2))}
            keyboardType="number-pad"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint="At least 12 characters, with a letter and a number."
            error={errors.password}
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirm}
          />

          <Body size={13} tone={color.ink3}>
            Level and experience are only used as ranges in de-identified reporting. Your service never sees them next to your results.
          </Body>
          {problem ? (
            <Body tone={color.signal} size={14} accessibilityLiveRegion="polite">
              {problem}
            </Body>
          ) : null}
          <Button label="Create account" loading={busy} onPress={join} />
          <Pressable onPress={() => router.replace("/sign-in")} style={{ alignSelf: "center", padding: 8 }} accessibilityRole="link">
            <Body size={14} tone={color.pine3}>
              Already have an account? Sign in
            </Body>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.monitor },
  pad: { paddingHorizontal: 24 },
  sheet: { marginTop: 28, marginHorizontal: 12, padding: 18, gap: 18, borderRadius: radius.lg, backgroundColor: color.paper },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.rule,
  },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
});

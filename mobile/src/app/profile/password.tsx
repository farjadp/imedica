import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { SheetHeader } from "@/components/sheet-header";
import { Body } from "@/components/type";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { color } from "@/lib/theme";

export default function ChangePassword() {
  const { replaceToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (password !== confirm) return setProblem("The new passwords don't match.");
    setSaving(true);
    setProblem(null);
    try {
      const { token } = await api<{ token: string }>("POST", "/me/password", { current, password, confirm });
      await replaceToken(token);
      Alert.alert("Password changed", "Your other devices were signed out.");
      router.back();
    } catch (e) {
      setProblem(e instanceof ApiError && e.status === 422 ? "Use at least 12 characters, with a letter and a number." : errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: insets.bottom + 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        <SheetHeader kicker="ACCOUNT" title="Change password." />
        <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" textContentType="password" />
        <Field
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="At least 12 characters, with a letter and a number."
        />
        <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        {problem ? (
          <Body tone={color.signal} size={14} accessibilityLiveRegion="polite">
            {problem}
          </Body>
        ) : null}
        <Button label="Change password" loading={saving} disabled={!current || !password} onPress={() => void save()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

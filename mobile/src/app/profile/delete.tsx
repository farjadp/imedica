import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { SheetHeader } from "@/components/sheet-header";
import { Body } from "@/components/type";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { color } from "@/lib/theme";

export default function DeleteAccount() {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setProblem(null);
    try {
      await api("DELETE", "/me", { password });
      await signOut();
    } catch (e) {
      setProblem(errorMessage(e));
      setDeleting(false);
    }
  };

  const confirm = () =>
    Alert.alert("Delete your account?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void remove() },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: insets.bottom + 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        <SheetHeader kicker="ACCOUNT" title="Delete account." />
        <View style={{ gap: 10 }}>
          <Body>Your name, email, photo, profile and reading list are deleted, and you’re signed out everywhere.</Body>
          <Body>
            Your past training runs stay in your service’s de-identified team results. They’re stored under an anonymous key, so once your account is gone nothing links them back to you.
          </Body>
        </View>
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" />
        {problem ? (
          <Body tone={color.signal} size={14} accessibilityLiveRegion="polite">
            {problem}
          </Body>
        ) : null}
        <Button label="Delete my account" loading={deleting} disabled={!password} onPress={confirm} style={{ backgroundColor: color.signal, borderColor: color.signal }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

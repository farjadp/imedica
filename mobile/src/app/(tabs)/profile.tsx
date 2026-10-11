import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Body, Display, Mono, Serif } from "@/components/type";
import { useAuth, useMe } from "@/lib/auth";
import { color } from "@/lib/theme";

export default function Profile() {
  const me = useMe();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 40 }}>
      <Mono>{(me.organizationName ?? "").toUpperCase()}</Mono>
      <Display size={38} style={{ marginTop: 6 }}>
        {me.firstName} {me.lastName}.
      </Display>

      <View style={styles.card}>
        <Row label="EMAIL" value={me.email} />
        <Row label="LEVEL" value={me.level ?? "Not set"} />
        <Row label="EXPERIENCE" value={me.yearsExperience != null ? `${me.yearsExperience} years` : "Not set"} last />
      </View>

      <Body size={13.5} style={{ marginTop: 14 }}>
        Your training runs are stored under an anonymous key. Your service sees team results only when five or more people are in a group, never yours alone.
      </Body>

      <Button
        label="Sign out"
        variant="secondary"
        style={{ marginTop: 28 }}
        onPress={() =>
          Alert.alert("Sign out?", undefined, [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: () => void signOut() },
          ])
        }
      />
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowRule]}>
      <Mono>{label}</Mono>
      <Serif size={16} tone={color.ink} style={{ flexShrink: 1, textAlign: "right" }}>
        {value}
      </Serif>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 24, backgroundColor: color.card, borderRadius: 18, borderWidth: 1, borderColor: color.rule, paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 14 },
  rowRule: { borderBottomWidth: 1, borderBottomColor: color.rule2 },
});

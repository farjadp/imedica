import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OutcomeTag } from "@/components/outcome-tag";
import { ScoreRing } from "@/components/score-ring";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { categoryLabel, shortDate } from "@/lib/labels";
import { useSessions } from "@/lib/queries";
import { color } from "@/lib/theme";

export default function History() {
  const insets = useSafeAreaInsets();
  const sessions = useSessions();

  if (sessions.isPending) return <Loading />;
  const done = (sessions.data ?? []).filter((s) => s.status !== "IN_PROGRESS");
  const average = done.length ? Math.round(done.reduce((sum, s) => sum + s.percent, 0) / done.length) : null;

  return (
    <FlatList
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32 }}
      data={sessions.data ?? []}
      keyExtractor={(s) => s.id}
      refreshControl={<RefreshControl refreshing={sessions.isRefetching} onRefresh={() => sessions.refetch()} tintColor={color.pine} />}
      ListHeaderComponent={
        <View style={styles.pad}>
          <Mono>YOUR LAST 20 RUNS</Mono>
          <Display size={38} style={{ marginTop: 6 }}>
            History.
          </Display>
          {average != null ? (
            <View style={styles.summary}>
              <ScoreRing percent={average} size={64} stroke={6} />
              <View style={{ flex: 1 }}>
                <Serif size={17} tone={color.ink}>
                  {average}% on average
                </Serif>
                <Body size={13.5}>
                  Across {done.length} finished {done.length === 1 ? "call" : "calls"}. Only you see this.
                </Body>
              </View>
            </View>
          ) : null}
          {sessions.error ? <Problem message={errorMessage(sessions.error)} onRetry={() => sessions.refetch()} /> : null}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(item.status === "IN_PROGRESS" ? `/run/${item.id}` : `/review/${item.id}`)}
          style={({ pressed }) => [styles.row, { backgroundColor: pressed ? color.paper2 : "transparent" }]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Serif size={17} tone={color.ink}>
              {item.scenario.title}
            </Serif>
            <Mono>
              {shortDate(item.startedAt).toUpperCase()} · {(categoryLabel[item.scenario.category] ?? "").toUpperCase()}
            </Mono>
          </View>
          {item.status === "IN_PROGRESS" ? (
            <OutcomeTag outcome="SUBOPTIMAL" label="Resume" />
          ) : (
            <OutcomeTag outcome={item.percent >= 75 ? "CORRECT" : item.percent >= 50 ? "SUBOPTIMAL" : "HARMFUL"} label={`${item.percent}%`} />
          )}
          <Feather name="chevron-right" size={18} color={color.ink3} />
        </Pressable>
      )}
      ListEmptyComponent={
        sessions.error ? null : (
          <View style={[styles.pad, { paddingVertical: 28 }]}>
            <Serif size={19}>No runs yet.</Serif>
            <Body style={{ marginTop: 6 }}>Take a call from the library. Every debrief lands here.</Body>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  summary: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 20, marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: color.card, borderWidth: 1, borderColor: color.rule },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.rule2 },
});

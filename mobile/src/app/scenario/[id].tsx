import Feather from "@expo/vector-icons/Feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { api, errorMessage } from "@/lib/api";
import { categoryLabel, difficultyLabel, minutes } from "@/lib/labels";
import { keys } from "@/lib/queries";
import { color, radius } from "@/lib/theme";

// Learners get the published scenario without rules. Only the brief is shown
// here: the states would give the call away.
type Brief = {
  id: string;
  title: string;
  summary: string;
  dispatch: string;
  category: string;
  difficulty: string;
  timeLimitSec: number;
  learningGoals: string[];
  protocolSource: string | null;
};

export default function ScenarioBrief() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const brief = useQuery({ queryKey: ["scenario", id], queryFn: () => api<Brief>("GET", `/scenarios/${id}`) });
  const start = useMutation({
    mutationFn: () => api<{ id: string }>("POST", "/sessions", { scenarioId: id }),
    onSuccess: ({ id: runId }) => {
      void queryClient.invalidateQueries({ queryKey: keys.sessions });
      router.replace(`/run/${runId}`);
    },
  });

  if (brief.isPending) return <Loading />;
  if (brief.error) return <Problem message={errorMessage(brief.error)} onRetry={() => brief.refetch()} />;
  const s = brief.data;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <ScrollView
        // iOS shows this as a sheet below the status bar; Android draws the modal full screen.
        contentContainerStyle={{ padding: 20, paddingTop: 18 + (Platform.OS === "android" ? insets.top : 0), paddingBottom: 140 }}
      >
        <View style={styles.grabber} />
        <View style={styles.top}>
          <Mono>
            {(categoryLabel[s.category] ?? "").toUpperCase()} · {(difficultyLabel[s.difficulty] ?? "").toUpperCase()}
          </Mono>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
            <Feather name="x" size={22} color={color.ink2} />
          </Pressable>
        </View>
        <Display size={34} style={{ marginTop: 10 }}>
          {s.title}
        </Display>
        <Body style={{ marginTop: 10 }}>{s.summary}</Body>

        <View style={styles.dispatch}>
          <View style={styles.dispatchTop}>
            <Mono tone={color.mint} medium>
              DISPATCH
            </Mono>
            <Mono tone={color.screenInk2}>{minutes(s.timeLimitSec).toUpperCase()} ON THE CLOCK</Mono>
          </View>
          <Serif tone={color.screenInk} size={17} style={{ marginTop: 10 }}>
            {s.dispatch}
          </Serif>
        </View>

        {s.learningGoals.length ? (
          <View style={{ marginTop: 26, gap: 10 }}>
            <Mono>WHAT THIS CALL TRAINS</Mono>
            {s.learningGoals.map((g) => (
              <View key={g} style={{ flexDirection: "row", gap: 10 }}>
                <View style={styles.bullet} />
                <Body style={{ flex: 1 }}>{g}</Body>
              </View>
            ))}
          </View>
        ) : null}

        {s.protocolSource ? (
          <Body size={12.5} tone={color.ink3} style={{ marginTop: 22 }}>
            Protocol: {s.protocolSource}
          </Body>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {start.error ? (
          <Body tone={color.signal} size={14} style={{ marginBottom: 8 }}>
            {errorMessage(start.error)}
          </Body>
        ) : null}
        <Button label="Take the call" loading={start.isPending} onPress={() => start.mutate()} />
        <Body size={12.5} tone={color.ink3} style={{ textAlign: "center", marginTop: 10 }}>
          The clock starts when you tap. Every decision is scored as you make it.
        </Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: color.rule, marginBottom: 14 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dispatch: { marginTop: 24, backgroundColor: color.monitor, borderRadius: radius.lg, padding: 18 },
  dispatchTop: { flexDirection: "row", justifyContent: "space-between" },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.brand, marginTop: 8 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, backgroundColor: color.paper, borderTopWidth: 1, borderTopColor: color.rule },
});

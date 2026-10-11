import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EcgTrace } from "@/components/ecg";
import { OutcomeTag } from "@/components/outcome-tag";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { categoryLabel, difficultyLabel, minutes } from "@/lib/labels";
import { useOpenAssessments, useScenarios, useSessions } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { OpenAssessment, ScenarioSummary, SessionSummary } from "@/lib/types";
import { usePull } from "@/lib/use-pull";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Night shift" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
}

/** The best last result per scenario, for the tag on each row. */
function lastResults(sessions: SessionSummary[] | undefined) {
  const map = new Map<string, SessionSummary>();
  for (const s of sessions ?? []) if (!map.has(s.scenario.id)) map.set(s.scenario.id, s);
  return map;
}

function resultTag(s: SessionSummary | undefined) {
  if (!s) return null;
  if (s.status === "IN_PROGRESS") return <OutcomeTag outcome="SUBOPTIMAL" label="In progress" />;
  const outcome = s.percent >= 75 ? "CORRECT" : s.percent >= 50 ? "SUBOPTIMAL" : "HARMFUL";
  return <OutcomeTag outcome={outcome} label={`${s.percent}%`} />;
}

export default function Library() {
  const me = useMe();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scenarios = useScenarios();
  const assessments = useOpenAssessments();
  const due = (assessments.data ?? []).filter((a) => !a.completed);
  const sessions = useSessions();
  const pull = usePull(() => Promise.all([scenarios.refetch(), sessions.refetch(), assessments.refetch()]));
  const [filter, setFilter] = useState<string | null>(null);

  const results = useMemo(() => lastResults(sessions.data), [sessions.data]);
  // A run only counts as live while its clock still has time; an abandoned one
  // the server hasn't closed yet would otherwise open straight onto "timed out".
  const limits = useMemo(() => new Map((scenarios.data ?? []).map((s) => [s.id, s.timeLimitSec])), [scenarios.data]);
  const isLive = (s: SessionSummary) =>
    s.status === "IN_PROGRESS" && new Date(s.startedAt).getTime() + (limits.get(s.scenario.id) ?? 0) * 1000 > sessions.dataUpdatedAt;
  const live = sessions.data?.find(isLive);
  const fresh = scenarios.data?.find((s) => !results.has(s.id));
  const categories = useMemo(() => [...new Set((scenarios.data ?? []).map((s) => s.category))], [scenarios.data]);
  const shown = (scenarios.data ?? []).filter((s) => !filter || s.category === filter);

  if (scenarios.isPending) return <Loading />;

  const refresh = () => {
    void scenarios.refetch();
    void sessions.refetch();
    void assessments.refetch();
  };

  return (
    <FlatList
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32 }}
      data={shown}
      keyExtractor={(s) => s.id}
      refreshControl={<RefreshControl {...pull} tintColor={color.pine} />}
      ListHeaderComponent={
        <View>
          <View style={styles.pad}>
            <Mono>{(me.organizationName ?? "Imedica").toUpperCase()}</Mono>
            <Display size={38} style={{ marginTop: 6 }}>
              {greeting()}, {me.preferredName ?? me.firstName}.
            </Display>
          </View>

          {scenarios.error ? <Problem message={errorMessage(scenarios.error)} onRetry={refresh} /> : null}

          {due.map((a) => (
            <Animated.View key={a.windowId} entering={FadeInDown.duration(600)}>
              <AssessmentCard a={a} />
            </Animated.View>
          ))}

          {live || fresh ? (
            <Animated.View entering={FadeInDown.duration(600)}>
              <NextCall
                width={width - 40}
                title={live ? live.scenario.title : fresh!.title}
                kicker={live ? "RESUME YOUR CALL" : "NEXT CALL"}
                meta={live ? categoryLabel[live.scenario.category] : `${minutes(fresh!.timeLimitSec)} · ${categoryLabel[fresh!.category]}`}
                onPress={() => (live ? router.push(`/run/${live.id}`) : router.push(`/scenario/${fresh!.id}`))}
              />
            </Animated.View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="All" active={!filter} onPress={() => setFilter(null)} />
            {categories.map((c) => (
              <Chip key={c} label={categoryLabel[c] ?? c} active={filter === c} onPress={() => setFilter(c)} />
            ))}
          </ScrollView>
          <View style={[styles.pad, styles.rule]} />
        </View>
      }
      renderItem={({ item, index }) => {
        const last = results.get(item.id);
        return <Row scenario={item} last={last && (last.status !== "IN_PROGRESS" || isLive(last)) ? last : undefined} index={index} />;
      }}
      ListEmptyComponent={
        scenarios.error ? null : (
          <View style={[styles.pad, { paddingVertical: 32 }]}>
            <Serif size={19}>No scenarios yet.</Serif>
            <Body style={{ marginTop: 6 }}>Your physicians are still writing them. Pull down to check again.</Body>
          </View>
        )
      }
    />
  );
}

/** An open pre- or post-test. It comes first: the service is waiting on it. */
function AssessmentCard({ a }: { a: OpenAssessment }) {
  const started = Boolean(a.attemptId);
  return (
    <Pressable
      onPress={() => router.push(`/assessment/${a.windowId}`)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.test, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.nextTop}>
        <Mono tone={color.mint} medium>
          {a.phase === "PRE" ? "PRE-TEST · BEFORE TRAINING" : "POST-TEST · AFTER TRAINING"}
        </Mono>
        <View style={styles.live}>
          <View style={[styles.dot, { backgroundColor: color.mint }]} />
          <Mono tone={color.mint}>OPEN</Mono>
        </View>
      </View>
      <Display tone={color.paper} size={23} style={{ marginTop: 10 }}>
        {a.assessment.title}
      </Display>
      <Mono tone={color.pineWash} style={{ marginTop: 8, opacity: 0.8 }}>
        {a.assessment.questionCount} QUESTIONS · {a.assessment.scenarioCount} {a.assessment.scenarioCount === 1 ? "SCENARIO" : "SCENARIOS"}
      </Mono>
      <View style={[styles.nextCta, { borderTopColor: "rgba(159,240,196,0.18)" }]}>
        <Body tone={color.mint} medium>
          {started ? "Carry on" : "Start the test"}
        </Body>
        <Feather name="arrow-right" size={18} color={color.mint} />
      </View>
    </Pressable>
  );
}

function NextCall({ width, title, kicker, meta, onPress }: { width: number; title: string; kicker: string; meta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.next, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={styles.nextTop}>
        <Mono tone={color.mint} medium>
          {kicker}
        </Mono>
        <View style={styles.live}>
          <View style={styles.dot} />
          <Mono tone={color.alarm}>LIVE</Mono>
        </View>
      </View>
      <Display tone={color.screenInk} size={25} style={{ marginTop: 10 }}>
        {title}
      </Display>
      <Mono tone={color.screenInk2} style={{ marginTop: 8 }}>
        {meta.toUpperCase()}
      </Mono>
      <View style={{ marginTop: 18, marginHorizontal: -20 }}>
        <EcgTrace width={width} height={46} hr={96} rhythm="tachycardia" />
      </View>
      <View style={styles.nextCta}>
        <Body tone={color.mint} medium>
          {kicker === "NEXT CALL" ? "Take the call" : "Pick up where you left off"}
        </Body>
        <Feather name="arrow-right" size={18} color={color.mint} />
      </View>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.chip, active && styles.chipOn]}>
      <Body size={13} medium tone={active ? color.paper : color.ink2}>
        {label}
      </Body>
    </Pressable>
  );
}

function Row({ scenario, last, index }: { scenario: ScenarioSummary; last: SessionSummary | undefined; index: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(Math.min(index, 8) * 50)}>
      <Pressable
        onPress={() => router.push(`/scenario/${scenario.id}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, { backgroundColor: pressed ? color.paper2 : "transparent" }]}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Serif size={18} tone={color.ink}>
            {scenario.title}
          </Serif>
          <Body size={13.5} numberOfLines={2}>
            {scenario.summary}
          </Body>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
            <Mono>
              {minutes(scenario.timeLimitSec).toUpperCase()} · {(categoryLabel[scenario.category] ?? "").toUpperCase()} ·{" "}
              {(difficultyLabel[scenario.difficulty] ?? "").toUpperCase()}
            </Mono>
            {resultTag(last)}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={color.ink3} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  test: { marginHorizontal: 20, marginTop: 22, backgroundColor: color.pine, borderRadius: radius.lg, padding: 20 },
  next: { marginHorizontal: 20, marginTop: 22, backgroundColor: color.monitor, borderRadius: radius.lg, padding: 20, overflow: "hidden" },
  nextTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  live: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.alarm },
  nextCta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.monitorRule },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 14 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: "center", backgroundColor: color.card, borderWidth: 1, borderColor: color.rule },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  rule: { height: 1, backgroundColor: color.rule, marginHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.rule2 },
});

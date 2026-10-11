import Feather from "@expo/vector-icons/Feather";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOutDown, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EcgTrace } from "@/components/ecg";
import { OutcomeTag } from "@/components/outcome-tag";
import { Loading, Problem } from "@/components/screen";
import { Body, Mono, Serif } from "@/components/type";
import { VitalsGrid } from "@/components/vitals";
import { ApiError, api, errorMessage } from "@/lib/api";
import { rhythmLabel, type Rhythm } from "@/lib/ecg";
import { ECG_CREDIT, pickStrip } from "@/lib/ecg-strips";
import { actionCategoryLabel, clock } from "@/lib/labels";
import { keys } from "@/lib/queries";
import { color, outcomeStyle, radius } from "@/lib/theme";
import type { Runtime, Verdict } from "@/lib/types";

const feel: Record<string, Haptics.NotificationFeedbackType> = {
  CORRECT: Haptics.NotificationFeedbackType.Success,
  ACCEPTABLE: Haptics.NotificationFeedbackType.Success,
  SUBOPTIMAL: Haptics.NotificationFeedbackType.Warning,
  HARMFUL: Haptics.NotificationFeedbackType.Error,
  CRITICAL: Haptics.NotificationFeedbackType.Error,
};

export default function Run() {
  // `windowId`: the assessment this run belongs to, which it returns to (its debrief stays locked).
  const { id, windowId } = useLocalSearchParams<{ id: string; windowId?: string }>();
  // Always fresh: a cached runtime would show an old state and a wrong clock.
  const run = useQuery({ queryKey: ["run", id], queryFn: () => api<Runtime>("GET", `/sessions/${id}`), staleTime: 0, gcTime: 0 });
  const over = run.data && run.data.status !== "IN_PROGRESS";

  useEffect(() => {
    if (!over) return;
    if (run.data?.assessment) router.replace(windowId ? `/assessment/${windowId}` : "/");
    else router.replace(`/review/${id}`);
  }, [over, id, windowId, run.data?.assessment]);

  if (run.error) return <Problem message={errorMessage(run.error)} onRetry={() => run.refetch()} />;
  if (!run.data || over) return <Loading dark />;
  return <Live initial={run.data} windowId={windowId} />;
}

function Live({ initial, windowId }: { initial: Runtime; windowId?: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<(Verdict & { label: string; key: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const ending = useRef(false);
  const verdictSeq = useRef(0);

  // The server's clock is the authority; this offset corrects a skewed phone clock.
  const [offset] = useState(() => new Date(initial.serverNow).getTime() - Date.now());

  const toReview = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: keys.sessions });
    if (data.assessment) {
      // No debrief yet: back to the assessment, which now shows this scenario done.
      void queryClient.invalidateQueries({ queryKey: ["attempt"] });
      router.replace(windowId ? `/assessment/${windowId}` : "/");
      return;
    }
    router.replace(`/review/${data.id}`);
  }, [data.id, data.assessment, windowId, queryClient]);

  const finish = useCallback(async () => {
    if (ending.current) return;
    ending.current = true;
    await api("POST", `/sessions/${data.id}/end`).catch(() => {});
    toReview();
  }, [data.id, toReview]);

  useEffect(() => {
    if (!verdict || verdict.ended) return;
    const t = setTimeout(() => setVerdict(null), 2600);
    return () => clearTimeout(t);
  }, [verdict]);

  const labelOf = useMemo(() => new Map(data.scenario.actions.map((a) => [a.id, a.label])), [data.scenario.actions]);
  const categories = useMemo(() => [...new Set(data.scenario.actions.map((a) => a.category))], [data.scenario.actions]);
  const shown = data.scenario.actions.filter((a) => !filter || a.category === filter);
  const doneIds = useMemo(() => new Set(data.decisions.map((d) => d.actionId)), [data.decisions]);

  async function act(actionId: string) {
    if (pending || ending.current) return;
    setPending(actionId);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const v = await api<Verdict>("POST", `/sessions/${data.id}/decisions`, { actionId });
      if (v.outcome) void Haptics.notificationAsync(feel[v.outcome] ?? Haptics.NotificationFeedbackType.Warning);
      else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVerdict({ ...v, label: labelOf.get(actionId) ?? "", key: ++verdictSeq.current });
      if (v.ended) {
        ending.current = true;
        setTimeout(toReview, 1600);
        return;
      }
      setData(await api<Runtime>("GET", `/sessions/${data.id}`));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        ending.current = true;
        return toReview();
      }
      setError(errorMessage(e));
    } finally {
      setPending(null);
    }
  }

  function handOver() {
    Alert.alert("Hand over care?", data.assessment ? "This ends the run. You go back to your assessment." : "This ends the run and opens your debrief.", [
      { text: "Keep going", style: "cancel" },
      { text: "Hand over", style: "destructive", onPress: () => void finish() },
    ]);
  }

  const v = data.state?.vitals ?? {};
  const rhythm = (v.rhythm ?? "sinus") as Rhythm;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <StatusBar style="light" />
      {/* The monitor */}
      <View style={[styles.monitor, { paddingTop: insets.top + 8 }]}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Leave and come back later">
            <Feather name="chevron-down" size={24} color={color.screenInk2} />
          </Pressable>
          <Mono tone={color.screenInk2} numberOfLines={1} style={{ flex: 1, marginHorizontal: 12 }}>
            {data.assessment ? "ASSESSMENT · " : ""}
            {data.scenario.title.toUpperCase()}
          </Mono>
          <Clock endsAt={new Date(data.startedAt).getTime() + data.scenario.timeLimitSec * 1000} offset={offset} onExpire={finish} />
        </View>

        <View style={{ marginTop: 12, marginHorizontal: -16 }}>
          <EcgTrace width={width} height={60} rhythm={rhythm} hr={v.hr ?? 80} real strip={v.ecgStrip} stroke={rhythm === "vfib" ? color.alarm : color.mint} />
        </View>
        <View style={styles.traceLabel}>
          <Mono tone={color.screenInk2} size={10}>
            II · {(rhythmLabel[rhythm] ?? "").toUpperCase()}
          </Mono>
          {pickStrip(rhythm) ? (
            <Mono tone={color.mintDim} size={9}>
              {ECG_CREDIT}
            </Mono>
          ) : null}
        </View>
        <VitalsGrid v={v} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        {data.state ? (
          <Animated.View key={data.state.id} entering={FadeIn.duration(500)} style={styles.patient}>
            <Mono>{data.state.title.toUpperCase()}</Mono>
            <Serif size={18} tone={color.ink} style={{ marginTop: 8 }}>
              {data.state.narrative}
            </Serif>
            {v.skin ? (
              <Body size={14} tone={color.ink3} style={{ marginTop: 6 }}>
                Skin: {v.skin}
              </Body>
            ) : null}
          </Animated.View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={!filter} onPress={() => setFilter(null)} />
          {categories.map((c) => (
            <Chip key={c} label={actionCategoryLabel[c] ?? c} active={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ScrollView>

        {error ? (
          <Body tone={color.signal} size={14} style={{ marginHorizontal: 20, marginBottom: 8 }}>
            {error}
          </Body>
        ) : null}

        <Animated.View layout={LinearTransition.duration(220)} style={{ paddingHorizontal: 16, gap: 8 }}>
          {shown.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => act(a.id)}
              disabled={Boolean(pending)}
              accessibilityRole="button"
              accessibilityHint={doneIds.has(a.id) ? "You've done this already" : undefined}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed, pending === a.id && styles.actionPending]}
            >
              <View style={{ flex: 1 }}>
                <Body size={15.5} tone={color.ink} medium>
                  {a.label}
                </Body>
                {a.detail ? (
                  <Body size={13} tone={color.ink3} style={{ marginTop: 2 }}>
                    {a.detail}
                  </Body>
                ) : null}
              </View>
              <Mono size={10} tone={color.ink3}>
                {(actionCategoryLabel[a.category] ?? "").toUpperCase()}
              </Mono>
              {doneIds.has(a.id) ? <Feather name="check" size={16} color={color.pine3} /> : null}
            </Pressable>
          ))}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Mono>{data.decisions.length} {data.decisions.length === 1 ? "DECISION" : "DECISIONS"}</Mono>
        <Pressable onPress={handOver} style={styles.handover} accessibilityRole="button">
          <Body medium tone={color.ink}>
            Hand over
          </Body>
        </Pressable>
      </View>

      {verdict ? <VerdictToast key={verdict.key} verdict={verdict} bottom={insets.bottom + 76} /> : null}
    </View>
  );
}

/** Ticks on its own, so the rest of the screen doesn't re-render four times a second. */
function Clock({ endsAt, offset, onExpire }: { endsAt: number; offset: number; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 250);
    return () => clearInterval(t);
  }, [offset]);
  const remaining = endsAt - now;
  const low = remaining < 60_000;
  useEffect(() => {
    if (remaining <= 0) onExpire();
  }, [remaining, onExpire]);

  return (
    <View style={[styles.clock, low && styles.clockLow]}>
      <View style={[styles.dot, { opacity: now % 1000 < 500 ? 1 : 0.25 }]} />
      <Mono tone={low ? color.alarm : color.screenInk} size={16} medium accessibilityLabel={`Time remaining ${clock(remaining)}`}>
        {clock(remaining)}
      </Mono>
    </View>
  );
}

function VerdictToast({ verdict, bottom }: { verdict: Verdict & { label: string }; bottom: number }) {
  // Assessment runs: recorded, no verdict, so the baseline isn't a lesson.
  const blind = verdict.outcome === null;
  const s = blind ? { fg: color.rule } : outcomeStyle[verdict.outcome!];
  const notes = [verdict.late ? "too late" : null, verdict.repeated ? "already done" : null].filter(Boolean).join(" · ");
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown.duration(220)}
      style={[styles.toast, { bottom, borderColor: s.fg }]}
      accessibilityLiveRegion="assertive"
    >
      {blind ? (
        <Mono medium size={10.5} tone={color.ink2}>
          RECORDED
        </Mono>
      ) : (
        <OutcomeTag outcome={verdict.outcome!} />
      )}
      <View style={{ flex: 1 }}>
        <Body size={14.5} tone={color.ink} medium numberOfLines={1}>
          {verdict.label}
        </Body>
        <Body size={12.5} tone={color.ink3}>
          {blind
            ? verdict.ended
              ? "The call is over. Back to your assessment…"
              : "Results open once the post-test is handed in."
            : verdict.ended
              ? "The call is over. Opening your debrief…"
              : notes || "Scored. The reason is in your debrief."}
        </Body>
      </View>
    </Animated.View>
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

const styles = StyleSheet.create({
  monitor: { backgroundColor: color.monitor, paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  bar: { flexDirection: "row", alignItems: "center" },
  traceLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  clock: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: color.monitor2 },
  clockLow: { backgroundColor: "#2a1210" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.alarm },
  patient: { paddingHorizontal: 20, paddingTop: 20 },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: "center", backgroundColor: color.card, borderWidth: 1, borderColor: color.rule },
  chipOn: { backgroundColor: color.pine, borderColor: color.pine },
  action: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: color.card, borderWidth: 1, borderColor: color.rule, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  actionPressed: { backgroundColor: color.pineWash, borderColor: color.pine3 },
  actionPending: { borderColor: color.pine, borderWidth: 2 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, backgroundColor: color.paper, borderTopWidth: 1, borderTopColor: color.rule },
  handover: { paddingHorizontal: 18, height: 42, borderRadius: 21, justifyContent: "center", borderWidth: 1, borderColor: color.rule, backgroundColor: color.card },
  toast: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: color.card, borderRadius: radius.md, borderWidth: 1.5, padding: 14, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
});

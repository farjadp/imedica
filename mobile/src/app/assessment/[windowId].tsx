import Feather from "@expo/vector-icons/Feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { ScoreRing } from "@/components/score-ring";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { api, errorMessage } from "@/lib/api";
import { categoryLabel, minutes } from "@/lib/labels";
import { keys, useAttempt } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { Attempt } from "@/lib/types";

/**
 * One pre- or post-test: the quiz, then each scenario once, then hand it in.
 * Opened by window, so a push notice can land here; starting is idempotent on
 * the server, so opening it again resumes the same attempt.
 */
export default function AssessmentScreen() {
  const { windowId } = useLocalSearchParams<{ windowId: string }>();
  const start = useQuery({
    queryKey: ["attempt-for-window", windowId],
    queryFn: () => api<{ id: string }>("POST", "/attempts", { windowId }),
    staleTime: Infinity,
  });
  const attempt = useAttempt(start.data?.id);

  const error = start.error ?? attempt.error;
  if (error) {
    return (
      <Frame>
        <Problem message={errorMessage(error)} onRetry={() => (start.error ? start.refetch() : attempt.refetch())}>
          <Button label="Back to library" variant="secondary" onPress={() => router.replace("/")} />
        </Problem>
      </Frame>
    );
  }
  if (!attempt.data) return <Loading />;
  return <Flow a={attempt.data} windowId={windowId} refetch={() => attempt.refetch()} />;
}

function Frame({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: color.paper, paddingTop: insets.top + 12 }}>{children}</View>;
}

function Flow({ a, windowId, refetch }: { a: Attempt; windowId: string; refetch: () => Promise<unknown> }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only a real pull shows the spinner; background refetches (after a run or the quiz) stay quiet.
  const [pulling, setPulling] = useState(false);
  const pull = () => {
    setPulling(true);
    void refetch().finally(() => setPulling(false));
  };

  const answered = a.quiz.filter((q) => q.answer !== null).length;
  const quizDone = answered === a.quiz.length;
  const runsDone = a.scenarios.filter((s) => s.run && s.run.status !== "IN_PROGRESS").length;
  const allDone = quizDone && runsDone === a.scenarios.length;
  const editable = a.open && !a.completed;

  const run = async (scenarioId: string) => {
    setPending(scenarioId);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("POST", `/attempts/${a.id}/runs`, { scenarioId });
      router.push({ pathname: "/run/[id]", params: { id, windowId } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(null);
    }
  };

  const handIn = useMutation({
    mutationFn: () => api("POST", `/attempts/${a.id}/finish`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.assessments });
      void refetch();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <ScrollView
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={pulling} onRefresh={pull} tintColor={color.pine} />}
    >
      <View style={styles.pad}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} accessibilityLabel="Back" style={{ alignSelf: "flex-start" }}>
          <Feather name="arrow-left" size={22} color={color.ink} />
        </Pressable>
        <Mono style={{ marginTop: 20 }}>{a.phase === "PRE" ? "BEFORE TRAINING · PRE-TEST" : "AFTER TRAINING · POST-TEST"}</Mono>
        <Display size={34} style={{ marginTop: 8 }}>
          {a.assessment.title}
        </Display>
        {a.completed ? null : (
          <Body style={{ marginTop: 10 }}>
            {a.phase === "PRE"
              ? `${a.quiz.length} questions, then each scenario once. You won’t see answers or debriefs until you’ve done the after-training round, so this is a fair picture of where you start. Your service only sees team totals.`
              : `The same ${a.quiz.length} questions and scenarios as before training. Hand it in and your answers, scores and debriefs from both rounds open up. Your service only sees team totals.`}
          </Body>
        )}
      </View>

      {a.completed ? <Done a={a} /> : null}
      {!a.open && !a.completed ? (
        <View style={[styles.note, styles.pad]}>
          <Feather name="lock" size={16} color={color.ink2} />
          <Body>This assessment has closed.</Body>
        </View>
      ) : null}

      {/* Step 1 */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.step}>
        <StepHead n={1} title="Questions" meta={`${answered}/${a.quiz.length}`} done={quizDone} />
        <Progress value={answered / Math.max(1, a.quiz.length)} />
        <Button
          label={a.completed ? (a.reveal ? "See answers and reasons" : "Review your answers") : quizDone ? "Change an answer" : answered ? "Carry on" : "Start the questions"}
          variant={quizDone || a.completed ? "secondary" : "primary"}
          style={{ marginTop: 14 }}
          onPress={() => router.push(`/assessment/quiz/${a.id}`)}
        />
      </Animated.View>

      {/* Step 2 */}
      <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.step}>
        <StepHead n={2} title="Scenarios" meta={`${runsDone}/${a.scenarios.length}`} done={runsDone === a.scenarios.length} />
        {a.completed ? null : (
          <Body size={13.5} style={{ marginTop: 4 }}>
            Each one once, on the clock. Decisions are recorded without a verdict.
          </Body>
        )}
        <View style={{ marginTop: 10 }}>
          {a.scenarios.map((s, i) => {
            const done = s.run && s.run.status !== "IN_PROGRESS";
            return (
              <View key={s.id} style={[styles.scenario, i > 0 && styles.scenarioRule]}>
                <Mono size={12} style={{ width: 18 }}>
                  {i + 1}
                </Mono>
                <View style={{ flex: 1 }}>
                  <Serif size={16.5} tone={color.ink}>
                    {s.title}
                  </Serif>
                  <Mono style={{ marginTop: 3 }}>
                    {(categoryLabel[s.category] ?? "").toUpperCase()} · {minutes(s.timeLimitSec).toUpperCase()}
                  </Mono>
                </View>
                {done ? (
                  a.reveal && s.run?.percent != null ? (
                    <Pressable onPress={() => router.push(`/review/${s.run!.id}`)} accessibilityRole="button" style={styles.scoreChip}>
                      <Mono medium tone={color.pine}>
                        {s.run.percent}%
                      </Mono>
                      <Feather name="chevron-right" size={14} color={color.pine} />
                    </Pressable>
                  ) : (
                    <Feather name="check-circle" size={20} color={color.brand} accessibilityLabel="Done" />
                  )
                ) : editable ? (
                  <Pressable onPress={() => void run(s.id)} disabled={pending !== null} accessibilityRole="button" style={[styles.runChip, s.run && styles.runChipResume]}>
                    <Body size={13.5} medium tone={s.run ? color.ink : color.paper}>
                      {pending === s.id ? "…" : s.run ? "Resume" : "Run"}
                    </Body>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </Animated.View>

      {error ? (
        <Body tone={color.signal} size={14} style={[styles.pad, { marginTop: 14 }]}>
          {error}
        </Body>
      ) : null}

      {editable ? (
        <View style={[styles.pad, { marginTop: 20 }]}>
          <Button label="Hand it in" loading={handIn.isPending} disabled={!allDone} style={!allDone ? { opacity: 0.45 } : undefined} onPress={() =>
              Alert.alert("Hand it in?", "You can’t change your answers or run the scenarios again after this.", [
                { text: "Not yet", style: "cancel" },
                { text: "Hand it in", onPress: () => handIn.mutate() },
              ])
            }
          />
          <Body size={12.5} tone={color.ink3} style={{ textAlign: "center", marginTop: 8 }}>
            {allDone ? "You can’t change anything after this." : "Answer every question and run every scenario first."}
          </Body>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Done({ a }: { a: Attempt }) {
  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.done}>
      <View style={{ flex: 1 }}>
        <Mono tone={color.mint} medium>
          HANDED IN
        </Mono>
        <Serif tone={color.screenInk} size={18} style={{ marginTop: 8 }}>
          {a.reveal
            ? "Your answers, scores and debriefs are open below."
            : a.phase === "PRE"
              ? "Thanks. Results open after your post-test, so this stays a fair baseline."
              : "Thanks. Your results are being put together."}
        </Serif>
      </View>
      {a.reveal && a.quizScorePct != null ? <ScoreRing percent={a.quizScorePct} size={72} stroke={6} tone={color.mint} onDark /> : null}
    </Animated.View>
  );
}

function StepHead({ n, title, meta, done }: { n: number; title: string; meta: string; done: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={[styles.stepDot, done && styles.stepDotDone]}>
        {done ? <Feather name="check" size={13} color={color.paper} /> : <Mono size={11} tone={color.ink}>{n}</Mono>}
      </View>
      <Serif size={19} tone={color.ink} style={{ flex: 1 }}>
        {title}
      </Serif>
      <Mono>{meta}</Mono>
    </View>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  note: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 16 },
  step: { marginHorizontal: 20, marginTop: 18, padding: 18, borderRadius: radius.lg, backgroundColor: color.card, borderWidth: 1, borderColor: color.rule },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: color.rule, alignItems: "center", justifyContent: "center" },
  stepDotDone: { backgroundColor: color.brand, borderColor: color.brand },
  track: { height: 6, borderRadius: 3, backgroundColor: color.paper2, marginTop: 14, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: color.pine3 },
  scenario: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  scenarioRule: { borderTopWidth: 1, borderTopColor: color.rule2 },
  runChip: { paddingHorizontal: 16, height: 36, borderRadius: 18, justifyContent: "center", backgroundColor: color.pine },
  runChipResume: { backgroundColor: color.card, borderWidth: 1, borderColor: color.rule },
  scoreChip: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 10, height: 32, borderRadius: 16, backgroundColor: color.pineWash },
  done: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 20, marginTop: 20, padding: 18, borderRadius: radius.lg, backgroundColor: color.monitor },
});

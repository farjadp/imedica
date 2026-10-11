import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { OutcomeTag } from "@/components/outcome-tag";
import { ScoreRing } from "@/components/score-ring";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { ApiError, errorMessage } from "@/lib/api";
import { categoryLabel, clock } from "@/lib/labels";
import { useReview } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { Review } from "@/lib/types";

const gradeTone: Record<Review["grade"], string> = {
  Excellent: color.brand,
  Proficient: color.pine,
  Developing: "#8a6500",
  "Needs review": color.signal,
};

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const review = useReview(id);

  if (review.isPending) return <Loading />;
  if (review.error) {
    const locked = review.error instanceof ApiError && review.error.status === 403;
    return (
      <View style={{ flex: 1, backgroundColor: color.paper, paddingTop: insets.top + 20 }}>
        <Problem message={errorMessage(review.error)} onRetry={locked ? undefined : () => review.refetch()}>
          <Button label="Back to library" variant="secondary" onPress={() => router.replace("/")} />
        </Problem>
      </View>
    );
  }
  const r = review.data;
  const tone = gradeTone[r.grade];

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <View style={styles.pad}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} accessibilityLabel="Back" style={{ alignSelf: "flex-start" }}>
          <Feather name="arrow-left" size={22} color={color.ink} />
        </Pressable>

        <Mono style={{ marginTop: 20 }}>
          DEBRIEF · {(categoryLabel[r.scenario.category] ?? "").toUpperCase()} · {clock(r.durationSec * 1000)}
          {r.status === "TIMED_OUT" ? " · TIMED OUT" : ""}
        </Mono>
        <Serif size={18} tone={color.ink2} style={{ marginTop: 6 }}>
          {r.scenario.title}
        </Serif>

        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Display size={46} tone={tone}>
              {r.grade}.
            </Display>
            <Mono style={{ marginTop: 10 }}>
              {r.score} OF {r.maxScore} POINTS · {r.decisions.length} DECISIONS
            </Mono>
          </View>
          <ScoreRing percent={r.percent} tone={tone} />
        </View>
      </View>

      {r.endState ? (
        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.endState}>
          <Mono tone={color.mint} medium>
            HOW THE CALL ENDED · {r.endState.title.toUpperCase()}
          </Mono>
          {r.endState.debrief ? (
            <Serif tone={color.screenInk} size={17} italic style={{ marginTop: 10 }}>
              {r.endState.debrief}
            </Serif>
          ) : null}
        </Animated.View>
      ) : null}

      {r.ai && r.ai.status !== "SKIPPED" && r.ai.status !== "FAILED" ? <AiNotes ai={r.ai} /> : null}

      <View style={[styles.pad, { marginTop: 30 }]}>
        <Mono>EVERY DECISION, AND THE PHYSICIAN’S REASON</Mono>
      </View>
      <View style={{ marginTop: 12 }}>
        {r.decisions.map((d, i) => (
          <Decision key={d.id} d={d} index={i} />
        ))}
      </View>

      {r.missed.length ? (
        <View style={[styles.pad, { marginTop: 26 }]}>
          <Mono tone={color.signal} medium>
            MISSED · REQUIRED STEPS
          </Mono>
          {r.missed.map((m) => (
            <View key={m.action} style={styles.missed}>
              <Body medium tone={color.ink}>
                {m.action}
              </Body>
              <Body size={14} style={{ marginTop: 4 }}>
                {m.rationale}
              </Body>
            </View>
          ))}
        </View>
      ) : null}

      {r.scenario.protocolSource ? (
        <Body size={12.5} tone={color.ink3} style={[styles.pad, { marginTop: 22 }]}>
          Protocol: {r.scenario.protocolSource}
        </Body>
      ) : null}

      <View style={[styles.pad, { marginTop: 28, gap: 10 }]}>
        <Button label="Run it again" onPress={() => router.replace(`/scenario/${r.scenario.id}`)} />
        <Button label="Back to library" variant="secondary" onPress={() => router.replace("/")} />
      </View>
    </ScrollView>
  );
}

function Decision({ d, index }: { d: Review["decisions"][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(200 + Math.min(index, 10) * 60)} style={styles.decision}>
      <View style={styles.timeline}>
        <Mono size={10.5}>{clock(d.elapsedMs)}</Mono>
        <View style={styles.line} />
      </View>
      <View style={{ flex: 1, paddingBottom: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <OutcomeTag outcome={d.outcome} />
          <Mono size={10.5}>{d.state.toUpperCase()}</Mono>
        </View>
        <Serif size={17} tone={color.ink} style={{ marginTop: 6 }}>
          {d.action}
        </Serif>
        <View style={styles.rationale}>
          <Body size={14.5} tone={color.ink2}>
            {d.rationale}
          </Body>
        </View>
        {d.teaching ? (
          <Pressable onPress={() => setOpen(!open)} style={{ marginTop: 8 }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
            <Body size={13.5} medium tone={color.pine3}>
              {open ? "Hide" : "Read"} the teaching note: {d.teaching.title}
            </Body>
            {open ? (
              <View style={{ marginTop: 6 }}>
                <Body size={14}>{d.teaching.body}</Body>
                {d.teaching.reference ? (
                  <Body size={12.5} tone={color.ink3} style={{ marginTop: 4 }}>
                    {d.teaching.reference}
                  </Body>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

function AiNotes({ ai }: { ai: NonNullable<Review["ai"]> }) {
  if (ai.status === "PENDING" || !ai.content) {
    return (
      <View style={[styles.ai, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
        <View style={styles.pulse} />
        <Body size={14}>Claude is writing notes on your run…</Body>
      </View>
    );
  }
  const c = ai.content;
  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.ai}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Mono medium tone={color.pine}>
          NOTES ON YOUR RUN
        </Mono>
        <Mono size={10}>{ai.review === "APPROVED" ? "PHYSICIAN APPROVED" : "AI · NOT YET REVIEWED"}</Mono>
      </View>
      <Serif size={17} tone={color.ink} style={{ marginTop: 10 }}>
        {c.summary}
      </Serif>
      <View style={styles.keyMoment}>
        <Mono size={10.5}>THE MOMENT THAT MATTERED</Mono>
        <Body medium tone={color.ink} style={{ marginTop: 4 }}>
          {c.keyMoment.decision}
        </Body>
        <Body size={14} style={{ marginTop: 2 }}>
          {c.keyMoment.why}
        </Body>
      </View>
      {c.strengths.length ? <List title="WHAT WENT WELL" items={c.strengths} tone={color.brand} /> : null}
      {c.improvements.length ? (
        <List title="DO DIFFERENTLY" items={c.improvements.map((i) => (i.reference ? `${i.point} (${i.reference})` : i.point))} tone="#8a6500" />
      ) : null}
      <Body size={14} tone={color.ink} style={{ marginTop: 12 }}>
        <Body medium tone={color.ink}>Practise next: </Body>
        {c.practiseNext}
      </Body>
    </Animated.View>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <View style={{ marginTop: 14, gap: 6 }}>
      <Mono size={10.5}>{title}</Mono>
      {items.map((t) => (
        <View key={t} style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tone, marginTop: 8 }} />
          <Body size={14} style={{ flex: 1 }}>
            {t}
          </Body>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  hero: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 18 },
  endState: { marginHorizontal: 20, marginTop: 24, backgroundColor: color.monitor, borderRadius: radius.lg, padding: 18 },
  ai: { marginHorizontal: 20, marginTop: 16, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.rule, padding: 18 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.brand },
  keyMoment: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: color.pineWash },
  decision: { flexDirection: "row", gap: 12, paddingHorizontal: 20 },
  timeline: { width: 40, alignItems: "center" },
  line: { flex: 1, width: 1, backgroundColor: color.rule, marginTop: 6 },
  rationale: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: color.pine, paddingLeft: 12 },
  missed: { marginTop: 10, padding: 14, borderRadius: radius.md, backgroundColor: color.signalWash },
});

import Feather from "@expo/vector-icons/Feather";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Loading, Problem } from "@/components/screen";
import { Body, Mono, Serif } from "@/components/type";
import { api, errorMessage } from "@/lib/api";
import { keys, useAttempt } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { Attempt } from "@/lib/types";

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attempt = useAttempt(id);
  if (attempt.error) return <Problem message={errorMessage(attempt.error)} onRetry={() => attempt.refetch()} />;
  if (!attempt.data) return <Loading />;
  return <Quiz a={attempt.data} />;
}

/** One question at a time. Answers save as you tap; nothing says right or wrong until the post-test is done. */
function Quiz({ a }: { a: Attempt }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => Object.fromEntries(a.quiz.map((q) => [q.id, q.answer])));
  const first = a.quiz.findIndex((q) => q.answer === null);
  const [index, setIndex] = useState(first === -1 ? 0 : first);
  const [error, setError] = useState<string | null>(null);
  const editable = a.open && !a.completed;
  const q = a.quiz[index];
  const last = index === a.quiz.length - 1;
  // On the last question, a blank one earlier is where "Done" should go instead.
  const blank = a.quiz.findIndex((x) => answers[x.id] === null);

  const close = () => {
    void queryClient.invalidateQueries({ queryKey: keys.attempt(a.id) });
    router.back();
  };

  const choose = async (choice: number) => {
    if (!editable || !q) return;
    const previous = answers[q.id];
    setAnswers((s) => ({ ...s, [q.id]: choice }));
    setError(null);
    void Haptics.selectionAsync();
    try {
      await api("POST", `/attempts/${a.id}/answers`, { questionId: q.id, choice });
    } catch (e) {
      setAnswers((s) => ({ ...s, [q.id]: previous }));
      setError(errorMessage(e));
    }
  };

  if (!q) return <Problem message="This assessment has no questions yet." />;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper, paddingTop: insets.top + 12 }}>
      <View style={[styles.pad, styles.top]}>
        <Mono>
          QUESTION {index + 1} OF {a.quiz.length}
        </Mono>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
          <Feather name="x" size={22} color={color.ink2} />
        </Pressable>
      </View>
      <View style={[styles.pad, styles.segments]}>
        {a.quiz.map((x, i) => (
          <Pressable
            key={x.id}
            onPress={() => setIndex(i)}
            hitSlop={{ top: 12, bottom: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Question ${i + 1}${answers[x.id] !== null ? ", answered" : ""}`}
            style={[styles.segment, answers[x.id] !== null && styles.segmentDone, i === index && styles.segmentNow]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Animated.View key={q.id} entering={FadeInRight.duration(260)}>
          <Serif size={22} tone={color.ink} style={{ lineHeight: 30 }}>
            {q.stem}
          </Serif>
          <View style={{ gap: 10, marginTop: 20 }} accessibilityRole="radiogroup">
            {q.options.map((o, i) => {
              const chosen = answers[q.id] === i;
              const right = a.reveal && q.correctIndex === i;
              const wrong = a.reveal && chosen && q.correctIndex !== i;
              return (
                <Pressable
                  key={i}
                  onPress={() => void choose(i)}
                  disabled={!editable}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: chosen }}
                  style={({ pressed }) => [
                    styles.option,
                    chosen && styles.optionChosen,
                    right && styles.optionRight,
                    wrong && styles.optionWrong,
                    pressed && editable && { opacity: 0.85 },
                  ]}
                >
                  <View style={[styles.radio, chosen && styles.radioOn, right && styles.radioRight, wrong && styles.radioWrong]}>
                    {right ? <Feather name="check" size={12} color={color.paper} /> : wrong ? <Feather name="x" size={12} color={color.paper} /> : chosen ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Body size={15.5} tone={chosen || right ? color.ink : color.ink2} style={{ flex: 1 }}>
                    {o}
                  </Body>
                </Pressable>
              );
            })}
          </View>
          {a.reveal && q.rationale ? (
            <View style={styles.rationale}>
              <Body size={14.5} tone={color.ink2}>
                {q.rationale}
              </Body>
              {q.reference ? (
                <Body size={12.5} tone={color.ink3} style={{ marginTop: 4 }}>
                  {q.reference}
                </Body>
              ) : null}
            </View>
          ) : null}
          {error ? (
            <Body tone={color.signal} size={14} style={{ marginTop: 12 }}>
              {error}
            </Body>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Back" variant="secondary" style={{ flex: 1, opacity: index === 0 ? 0.4 : 1 }} disabled={index === 0} onPress={() => setIndex(index - 1)} />
        <Button
          label={!last ? "Next" : editable && blank !== -1 ? `Question ${blank + 1} is blank` : "Done"}
          style={{ flex: 2 }}
          onPress={() => (!last ? setIndex(index + 1) : editable && blank !== -1 ? setIndex(blank) : close())}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  segments: { flexDirection: "row", gap: 4, marginTop: 14 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: color.rule },
  segmentDone: { backgroundColor: color.pine3 },
  segmentNow: { backgroundColor: color.ink },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: color.rule, backgroundColor: color.card, minHeight: 56 },
  optionChosen: { borderColor: color.pine3, backgroundColor: color.pineWash },
  optionRight: { borderColor: "#2d7d4f", backgroundColor: "#e2f0e6" },
  optionWrong: { borderColor: "#b3261e", backgroundColor: "#f9e2df" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: color.rule, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: color.pine3, backgroundColor: color.pine3 },
  radioRight: { borderColor: "#2d7d4f", backgroundColor: "#2d7d4f" },
  radioWrong: { borderColor: "#b3261e", backgroundColor: "#b3261e" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.paper },
  rationale: { marginTop: 16, padding: 14, borderRadius: radius.md, backgroundColor: color.paper2 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.rule, backgroundColor: color.paper },
});

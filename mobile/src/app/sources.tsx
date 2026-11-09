import Feather from "@expo/vector-icons/Feather";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Loading, Problem } from "@/components/screen";
import { SheetHeader } from "@/components/sheet-header";
import { SourceRow, sourceMeta } from "@/components/sources";
import { Body, Mono } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { DISCLAIMER_LINE, FALLBACK_DISCLAIMER_URL, openLink } from "@/lib/citations";
import { useSources } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { Source, SourceKind } from "@/lib/types";

const groups: { kind: SourceKind; title: string; lead: string }[] = [
  { kind: "guideline", title: "CLINICAL STANDARDS & GUIDELINES", lead: "Every scenario, action and dose is written from these." },
  { kind: "data", title: "DATA", lead: "The rhythms on the scenario monitor." },
  { kind: "literature", title: "RESEARCH", lead: "Where the Research tab finds papers." },
];

export default function SourcesScreen() {
  const insets = useSafeAreaInsets();
  const list = useSources();

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ padding: 20, paddingTop: 22, paddingBottom: insets.bottom + 40 }}>
      <SheetHeader kicker="IMEDICA" title="Sources & references" />
      <Body style={{ marginTop: 12 }}>
        Imedica’s scenarios follow the Ontario paramedic standards and the guidelines below. Tap a source to read it.
      </Body>

      {list.isPending ? (
        <View style={{ height: 160 }}>
          <Loading />
        </View>
      ) : list.error ? (
        <View style={{ marginHorizontal: -24 }}>
          <Problem message={errorMessage(list.error)} onRetry={() => list.refetch()} />
        </View>
      ) : (
        groups.map((g) => <Group key={g.kind} title={g.title} lead={g.lead} sources={list.data.sources.filter((s) => s.kind === g.kind)} />)
      )}

      <View style={{ marginTop: 28 }}>
        <Mono>HOW THE NOTES ARE WRITTEN</Mono>
        <View style={[styles.card, { padding: 16, flexDirection: "row", gap: 12 }]}>
          <Feather name="edit-3" size={17} color={color.pine2} style={{ marginTop: 2 }} />
          <Body tone={color.ink} style={{ flex: 1 }}>
            AI notes by Claude, checked against these sources by our physicians. Scores come from physician-written rules, never from the AI.
          </Body>
        </View>
      </View>

      <View style={{ marginTop: 28 }}>
        <Mono>MEDICAL DISCLAIMER</Mono>
        <View style={[styles.card, { padding: 16, gap: 10 }]}>
          <Body medium tone={color.ink}>
            {DISCLAIMER_LINE}
          </Body>
          <Body>
            Imedica is an educational tool for trained health professionals and students under supervision. It is not a medical device, it does not diagnose or treat anyone, and nothing in it is medical advice for a particular patient.
          </Body>
          <Body>
            Drugs, doses and procedures differ between provinces, services and base hospitals, and they change. Where Imedica differs from your medical directives, your directives are right. In an emergency, call 911.
          </Body>
        </View>
        <Pressable
          onPress={() => void openLink(list.data?.disclaimerUrl ?? FALLBACK_DISCLAIMER_URL)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        >
          <Body medium tone={color.pine2}>
            Read the full medical disclaimer
          </Body>
          <Feather name="external-link" size={16} color={color.pine2} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Group({ title, lead, sources }: { title: string; lead: string; sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <View style={{ marginTop: 28 }}>
      <Mono>{title}</Mono>
      <Body size={14} tone={color.ink3} style={{ marginTop: 4 }}>
        {lead}
      </Body>
      <View style={styles.card}>
        {sources.map((s, i) => (
          <SourceRow key={s.id} title={s.title} meta={sourceMeta(s)} url={s.url} last={i === sources.length - 1} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 10, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.rule, overflow: "hidden" },
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, marginTop: 6, alignSelf: "flex-start" },
});

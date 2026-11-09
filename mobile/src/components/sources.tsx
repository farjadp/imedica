import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { DISCLAIMER_LINE, openLink } from "@/lib/citations";
import { color, radius } from "@/lib/theme";
import type { ScenarioSource } from "@/lib/types";

import { Body, Mono } from "./type";

/** One tappable source: title, the section that applies, and where it's from. */
export function SourceRow({
  title,
  section,
  meta,
  url,
  last,
}: {
  title: string;
  section?: string | null;
  meta?: string | null;
  url: string;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={() => void openLink(url)}
      accessibilityRole="link"
      accessibilityLabel={[title, section].filter(Boolean).join(", ")}
      accessibilityHint="Opens the source"
      style={({ pressed }) => [styles.row, !last && styles.rowRule, pressed && { backgroundColor: color.paper2 }]}
    >
      <Feather name="book-open" size={17} color={color.pine2} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Body medium tone={color.ink}>
          {title}
        </Body>
        {section ? <Body tone={color.ink2}>{section}</Body> : null}
        {meta ? (
          <Body size={13} tone={color.ink3}>
            {meta}
          </Body>
        ) : null}
      </View>
      <Feather name="external-link" size={16} color={color.pine3} style={{ marginTop: 3 }} />
    </Pressable>
  );
}

export function sourceMeta(s: { publisher: string; version: string | null }): string {
  return [s.publisher, s.version].filter(Boolean).join(" · ");
}

/** The disclaimer line every medical screen carries. */
export function Disclaimer({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]}>
      <Feather name="info" size={15} color={color.ink3} style={{ marginTop: 3 }} />
      <Body size={14} tone={color.ink2} style={{ flex: 1 }}>
        {DISCLAIMER_LINE}
      </Body>
    </View>
  );
}

/**
 * The SOURCES block: the guidelines this scenario is built on, each a link,
 * then the disclaimer and the way to every source. Renders nothing until the
 * server sends sources, so older servers just don't show it.
 */
export function SourcesBlock({
  sources,
  style,
  onOpenAll = () => router.push("/sources"),
}: {
  sources: ScenarioSource[] | undefined;
  style?: ViewStyle;
  onOpenAll?: () => void;
}) {
  if (!sources?.length) return null;
  return (
    <View style={style}>
      <Mono>SOURCES</Mono>
      <View style={styles.card}>
        {sources.map((s, i) => (
          <SourceRow key={`${s.id}-${s.section ?? i}`} title={s.title} section={s.section} meta={sourceMeta(s)} url={s.url} last={i === sources.length - 1} />
        ))}
      </View>
      <Disclaimer style={{ marginTop: 12 }} />
      <Pressable onPress={onOpenAll} accessibilityRole="button" style={({ pressed }) => [styles.all, pressed && { opacity: 0.7 }]}>
        <Body medium tone={color.pine2}>
          All sources & references
        </Body>
        <Feather name="chevron-right" size={18} color={color.pine2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 10, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.rule, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  rowRule: { borderBottomWidth: 1, borderBottomColor: color.rule2 },
  all: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, marginTop: 4, alignSelf: "flex-start" },
});

import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { useBrief, usePaper, useToggleSaved } from "@/lib/queries";
import { color, radius } from "@/lib/theme";
import type { Brief, PaperDetail } from "@/lib/types";

export default function Paper() {
  const { source, id } = useLocalSearchParams<{ source: string; id: string }>();
  const ref = { source, extId: id };
  const insets = useSafeAreaInsets();
  const paper = usePaper(ref);
  const brief = useBrief(ref);
  const toggle = useToggleSaved(ref);
  const [showAbstract, setShowAbstract] = useState(false);

  if (paper.isPending) return <Loading />;
  if (paper.error) {
    return (
      <View style={{ flex: 1, backgroundColor: color.paper, paddingTop: insets.top + 12 }}>
        <Back />
        <Problem message={errorMessage(paper.error)} onRetry={() => paper.refetch()} />
      </View>
    );
  }
  const p = paper.data;
  const b = p.brief;

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.pad}>
        <View style={styles.bar}>
          <Back />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconButton
              icon="bookmark"
              label={p.saved ? "Remove from reading list" : "Save to reading list"}
              active={p.saved}
              busy={toggle.isPending}
              onPress={() => toggle.mutate(!p.saved, { onError: (e) => Alert.alert("Not saved", errorMessage(e)) })}
            />
            <IconButton icon="external-link" label="Open the paper" onPress={() => void WebBrowser.openBrowserAsync(p.url)} />
          </View>
        </View>

        <Mono style={{ marginTop: 18 }}>{[p.journal, p.year].filter(Boolean).join(" · ").toUpperCase()}</Mono>
        <Display size={26} style={{ marginTop: 8 }}>
          {p.title}
        </Display>
        {p.authors ? (
          <Body size={13.5} tone={color.ink3} numberOfLines={2} style={{ marginTop: 10 }}>
            {p.authors}
          </Body>
        ) : null}
        <View style={styles.tags}>
          {p.openAccess ? <Tag label="FULL TEXT" tone={color.pine2} bg={color.pineWash} /> : <Tag label="ABSTRACT ONLY" tone={color.ink2} bg={color.paper2} />}
          {p.pubTypes
            .filter((t) => !/journal article|research-article/i.test(t))
            .slice(0, 2)
            .map((t) => (
              <Tag key={t} label={t.toUpperCase()} tone={color.ink2} bg={color.paper2} />
            ))}
          {p.citedBy ? <Tag label={`CITED ${p.citedBy}×`} tone={color.ink2} bg={color.paper2} /> : null}
        </View>
      </View>

      {b ? (
        <BriefView brief={b.content} basedOn={b.basedOn} />
      ) : (
        <Animated.View entering={FadeIn.duration(500)} style={styles.monitor}>
          <Mono tone={color.mint} medium>
            READ IT FOR ME
          </Mono>
          <Serif size={18} tone={color.screenInk} style={{ marginTop: 10 }}>
            Claude reads the {p.openAccess ? "full paper" : "abstract"} and pulls out the bottom line, how strong the evidence is, and what it could mean on a call.
          </Serif>
          {brief.isPending ? (
            <View style={styles.reading}>
              <ActivityIndicator color={color.mint} />
              <Body tone={color.screenInk2} size={14}>
                Reading the {p.openAccess ? "full text" : "abstract"}. A long paper can take half a minute.
              </Body>
            </View>
          ) : (
            <Button label="Read this paper" variant="mint" style={{ marginTop: 18 }} onPress={() => brief.mutate()} disabled={!p.abstract && !p.openAccess} />
          )}
          {!p.abstract && !p.openAccess ? (
            <Body tone={color.alarm} size={13.5} style={{ marginTop: 10 }}>
              This paper has no abstract or open full text, so there’s nothing to read here. Open it with the link above.
            </Body>
          ) : null}
          {brief.error ? (
            <Body tone={color.alarm} size={14} style={{ marginTop: 12 }} accessibilityLiveRegion="polite">
              {errorMessage(brief.error)}
            </Body>
          ) : null}
        </Animated.View>
      )}

      <Abstract paper={p} open={showAbstract} onToggle={() => setShowAbstract((v) => !v)} />

      {p.keywords.length ? (
        <View style={[styles.pad, { marginTop: 22 }]}>
          <Mono>KEYWORDS</Mono>
          <View style={[styles.tags, { marginTop: 10 }]}>
            {p.keywords.map((k) => (
              <View key={k} style={styles.keyword}>
                <Body size={13} tone={color.ink2}>
                  {k}
                </Body>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function BriefView({ brief, basedOn }: { brief: Brief; basedOn: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(600)}>
      <View style={styles.monitor}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Mono tone={color.mint} medium>
            BOTTOM LINE
          </Mono>
          <Mono tone={color.screenInk2}>{brief.evidence.toUpperCase()}</Mono>
        </View>
        <Serif size={19} tone={color.screenInk} style={{ marginTop: 12 }}>
          {brief.bottomLine}
        </Serif>
        <View style={styles.monitorFoot}>
          <Mono tone={color.screenInk2}>DESIGN</Mono>
          <Body tone={color.screenInk} size={14} style={{ marginTop: 4 }}>
            {brief.design}
          </Body>
        </View>
      </View>

      <Block title="WHO WAS STUDIED">
        <Body tone={color.ink}>{brief.population}</Body>
      </Block>

      <Block title="WHAT THEY FOUND">
        {brief.findings.map((f, i) => (
          <View key={i} style={styles.item}>
            <Mono tone={color.pine2} medium style={{ width: 22 }}>
              {String(i + 1).padStart(2, "0")}
            </Mono>
            <Body tone={color.ink} style={{ flex: 1 }}>
              {f}
            </Body>
          </View>
        ))}
      </Block>

      {brief.limitations.length ? (
        <Block title="HOW FAR TO TRUST IT">
          {brief.limitations.map((l, i) => (
            <View key={i} style={styles.item}>
              <Feather name="alert-triangle" size={14} color="#8a6500" style={{ marginTop: 4 }} />
              <Body style={{ flex: 1 }}>{l}</Body>
            </View>
          ))}
        </Block>
      ) : null}

      <View style={styles.road}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="truck" size={16} color={color.pine} />
          <Mono tone={color.pine} medium>
            ON THE ROAD
          </Mono>
        </View>
        <Serif size={17} tone={color.ink} style={{ marginTop: 10 }}>
          {brief.onTheRoad}
        </Serif>
        <Body size={13} tone={color.pine2} style={{ marginTop: 10 }}>
          One paper doesn’t change practice. Your provincial standards and base hospital medical directives do.
        </Body>
      </View>

      {brief.terms.length ? (
        <Block title="TERMS">
          {brief.terms.map((t) => (
            <View key={t.term} style={{ gap: 2, marginBottom: 10 }}>
              <Body medium tone={color.ink}>
                {t.term}
              </Body>
              <Body size={14}>{t.meaning}</Body>
            </View>
          ))}
        </Block>
      ) : null}

      <Mono style={[styles.pad, { marginTop: 18 }]}>READ FROM THE {basedOn.toUpperCase()} BY CLAUDE · A READING AID, NOT MEDICAL DIRECTION</Mono>
    </Animated.View>
  );
}

function Abstract({ paper, open, onToggle }: { paper: PaperDetail; open: boolean; onToggle: () => void }) {
  if (!paper.abstract) return null;
  return (
    <View style={[styles.pad, { marginTop: 26 }]}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.abstractHead}>
        <Mono>ABSTRACT</Mono>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={color.ink3} />
      </Pressable>
      <Body tone={color.ink} numberOfLines={open ? undefined : 4} style={{ marginTop: 10 }} selectable>
        {paper.abstract}
      </Body>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.pad, { marginTop: 24 }]}>
      <Mono style={{ marginBottom: 10 }}>{title}</Mono>
      {children}
    </View>
  );
}

function Tag({ label, tone, bg }: { label: string; tone: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4 }}>
      <Mono size={10} medium tone={tone}>
        {label}
      </Mono>
    </View>
  );
}

function Back() {
  return (
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.iconBtn}>
      <Feather name="arrow-left" size={19} color={color.ink} />
    </Pressable>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  active,
  busy,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      style={[styles.iconBtn, active && { backgroundColor: color.pine }]}
    >
      {busy ? <ActivityIndicator size="small" color={active ? color.paper : color.ink} /> : <Feather name={icon} size={17} color={active ? color.paper : color.ink} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.card, borderWidth: 1, borderColor: color.rule, alignItems: "center", justifyContent: "center" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  monitor: { marginHorizontal: 20, marginTop: 24, backgroundColor: color.monitor, borderRadius: radius.lg, padding: 20 },
  monitorFoot: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.monitorRule },
  reading: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 },
  item: { flexDirection: "row", gap: 10, marginBottom: 10 },
  road: { marginHorizontal: 20, marginTop: 24, backgroundColor: color.pineWash, borderRadius: radius.lg, padding: 18 },
  abstractHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: color.rule },
  keyword: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: color.rule, backgroundColor: color.card },
});

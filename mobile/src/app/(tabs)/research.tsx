import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Loading, Problem } from "@/components/screen";
import { Body, Display, Mono, Serif } from "@/components/type";
import { errorMessage } from "@/lib/api";
import { usePaperSearch, useSavedPapers } from "@/lib/queries";
import { color, font, radius } from "@/lib/theme";
import type { PaperRef } from "@/lib/types";

// Starting points for paramedics, matched to the call types in the library.
const TOPICS = [
  { label: "Prehospital STEMI and 12-lead", q: "prehospital STEMI 12-lead ECG" },
  { label: "Naloxone and synthetic opioids", q: "prehospital naloxone fentanyl" },
  { label: "Stroke screening and EVT bypass", q: "prehospital large vessel occlusion stroke scale" },
  { label: "Paediatric status epilepticus", q: "prehospital pediatric status epilepticus midazolam" },
  { label: "Tourniquets in civilian trauma", q: "prehospital tourniquet civilian hemorrhage" },
  { label: "Epinephrine in cardiac arrest", q: "out-of-hospital cardiac arrest epinephrine" },
  { label: "Anaphylaxis and IM epinephrine", q: "prehospital anaphylaxis epinephrine" },
  { label: "Severe asthma in the field", q: "prehospital severe asthma management" },
];

function openPaper(p: PaperRef) {
  router.push({ pathname: "/paper/[source]/[id]", params: { source: p.source, id: p.extId } });
}

export default function Research() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ view?: string }>();
  const [view, setView] = useState<"search" | "saved">(params.view === "saved" ? "saved" : "search");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  // The profile links here with ?view=saved, also when this tab is already open.
  const [seenParam, setSeenParam] = useState(params.view);
  if (params.view !== seenParam) {
    setSeenParam(params.view);
    if (params.view === "saved") setView("saved");
  }

  const search = usePaperSearch(query, openOnly);
  const saved = useSavedPapers();
  const results = search.data?.pages.flatMap((p) => p.results) ?? [];

  const run = (q: string) => {
    setDraft(q);
    setQuery(q.trim());
    setView("search");
  };

  const header = (
    <View style={styles.pad}>
      <Mono>PUBMED · PUBMED CENTRAL</Mono>
      <Display size={38} style={{ marginTop: 6 }}>
        Research.
      </Display>
      <Body style={{ marginTop: 8 }}>Find a paper, then let Claude read it and tell you what it means on the road.</Body>

      <View style={styles.search}>
        <Feather name="search" size={18} color={color.ink3} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => run(draft)}
          placeholder="Topic, DOI or PMID"
          placeholderTextColor={color.ink3}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Search papers"
        />
        {draft ? (
          <Pressable onPress={() => run("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Feather name="x-circle" size={17} color={color.ink3} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <Seg label="Search" active={view === "search"} onPress={() => setView("search")} />
        <Seg label={`Reading list${saved.data?.length ? ` · ${saved.data.length}` : ""}`} active={view === "saved"} onPress={() => setView("saved")} />
        <View style={{ flex: 1 }} />
        {view === "search" ? (
          <Pressable
            onPress={() => setOpenOnly((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: openOnly }}
            style={[styles.toggle, openOnly && styles.toggleOn]}
          >
            <Feather name={openOnly ? "check" : "book-open"} size={13} color={openOnly ? color.paper : color.ink2} />
            <Body size={13} medium tone={openOnly ? color.paper : color.ink2}>
              Full text
            </Body>
          </Pressable>
        ) : null}
      </View>
      {view === "search" && query && search.data ? (
        <Mono style={{ marginTop: 14 }}>{search.data.pages[0].total.toLocaleString("en-CA")} PAPERS</Mono>
      ) : null}
    </View>
  );

  if (view === "saved") {
    return (
      <FlatList
        style={{ backgroundColor: color.paper }}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32 }}
        data={saved.data ?? []}
        keyExtractor={(p) => `${p.source}:${p.extId}`}
        refreshControl={<RefreshControl refreshing={saved.isRefetching} onRefresh={() => saved.refetch()} tintColor={color.pine} />}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <PaperRow title={item.title} meta={[item.journal, item.year].filter(Boolean).join(" · ")} index={index} onPress={() => openPaper(item)} />
        )}
        ListEmptyComponent={
          saved.isPending ? (
            <ActivityIndicator color={color.pine} style={{ marginTop: 32 }} />
          ) : saved.error ? (
            <Problem message={errorMessage(saved.error)} onRetry={() => saved.refetch()} />
          ) : (
            <View style={[styles.pad, { paddingTop: 28, gap: 6 }]}>
              <Serif size={19}>Nothing saved yet.</Serif>
              <Body>Tap the bookmark on any paper to keep it here.</Body>
            </View>
          )
        }
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      data={query ? results : []}
      keyExtractor={(p) => `${p.source}:${p.extId}`}
      ListHeaderComponent={header}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
      }}
      renderItem={({ item, index }) => (
        <PaperRow
          title={item.title}
          meta={[item.journal, item.year].filter(Boolean).join(" · ")}
          openAccess={item.openAccess}
          saved={item.saved}
          kind={item.pubType}
          index={index}
          onPress={() => openPaper(item)}
        />
      )}
      ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator color={color.pine} style={{ marginVertical: 20 }} /> : null}
      ListEmptyComponent={
        !query ? (
          <View style={{ paddingTop: 22 }}>
            <Mono style={[styles.pad, { marginBottom: 6 }]}>START WITH A CALL TYPE</Mono>
            {TOPICS.map((t, i) => (
              <Animated.View key={t.q} entering={FadeInDown.duration(450).delay(i * 40)}>
                <Pressable
                  onPress={() => run(t.q)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.topic, pressed && { backgroundColor: color.paper2 }]}
                >
                  <Serif size={17} tone={color.ink} style={{ flex: 1 }}>
                    {t.label}
                  </Serif>
                  <Feather name="arrow-up-right" size={17} color={color.ink3} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : search.isPending ? (
          <Loading />
        ) : search.error ? (
          <Problem message={errorMessage(search.error)} onRetry={() => search.refetch()} />
        ) : (
          <View style={[styles.pad, { paddingTop: 28, gap: 6 }]}>
            <Serif size={19}>No papers found.</Serif>
            <Body>Try fewer words, or turn off Full text.</Body>
          </View>
        )
      }
    />
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.seg, active && styles.segOn]}>
      <Body size={14} medium tone={active ? color.ink : color.ink3}>
        {label}
      </Body>
    </Pressable>
  );
}

function PaperRow({
  title,
  meta,
  openAccess,
  saved,
  kind,
  index,
  onPress,
}: {
  title: string;
  meta: string;
  openAccess?: boolean;
  saved?: boolean;
  kind?: string | null;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index, 8) * 35)}>
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.paper2 }]}>
        <View style={{ flex: 1, gap: 7 }}>
          <Serif size={17} tone={color.ink} numberOfLines={3}>
            {title}
          </Serif>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {meta ? <Mono numberOfLines={1}>{meta.toUpperCase()}</Mono> : null}
            {openAccess ? (
              <View style={styles.tag}>
                <Mono size={10} medium tone={color.pine2}>
                  FULL TEXT
                </Mono>
              </View>
            ) : null}
            {kind && /review|meta|trial/i.test(kind) ? (
              <View style={[styles.tag, { backgroundColor: color.paper2 }]}>
                <Mono size={10} medium tone={color.ink2}>
                  {kind.toUpperCase()}
                </Mono>
              </View>
            ) : null}
          </View>
        </View>
        {saved ? <Feather name="bookmark" size={16} color={color.pine2} /> : <Feather name="chevron-right" size={18} color={color.ink3} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  search: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.rule,
    backgroundColor: color.card,
  },
  input: { flex: 1, height: "100%", fontFamily: font.sans, fontSize: 16, color: color.ink },
  tabs: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 18, borderBottomWidth: 1, borderBottomColor: color.rule },
  seg: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "transparent", marginBottom: -1 },
  segOn: { borderBottomColor: color.ink },
  toggle: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 14, borderWidth: 1, borderColor: color.rule, marginBottom: 8 },
  toggleOn: { backgroundColor: color.pine, borderColor: color.pine },
  topic: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: color.rule2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.rule2 },
  tag: { backgroundColor: color.pineWash, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
});

import Feather from "@expo/vector-icons/Feather";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { Avatar } from "@/components/avatar";
import { Body, Display, Mono, Serif } from "@/components/type";
import { api, errorMessage } from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { chooseAvatar, removeAvatar } from "@/lib/avatar";
import { categoryLabel } from "@/lib/labels";
import { useSavedPapers, useScenarios, useSessions } from "@/lib/queries";
import { trainingStats } from "@/lib/stats";
import { color, radius } from "@/lib/theme";

const levelLabel: Record<string, string> = {
  PCP: "Primary Care Paramedic",
  ACP: "Advanced Care Paramedic",
  CCP: "Critical Care Paramedic",
  EMR: "Emergency Medical Responder",
  STUDENT: "Paramedic student",
  OTHER: "Paramedic",
};

export default function Profile() {
  const me = useMe();
  const { signOut, refresh } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sessions = useSessions();
  const scenarios = useScenarios();
  const saved = useSavedPapers();
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(me.notifyAssessments);

  const stats = useMemo(() => trainingStats(sessions.data ?? []), [sessions.data]);
  const allCategories = useMemo(() => [...new Set((scenarios.data ?? []).map((s) => s.category))], [scenarios.data]);

  const photo = async (from: "camera" | "library") => {
    setBusy(true);
    try {
      if (await chooseAvatar(from)) await refresh();
    } catch (e) {
      Alert.alert("Photo not updated", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const editPhoto = () =>
    Alert.alert("Profile photo", "Only you see it, in the app and on the web.", [
      { text: "Take photo", onPress: () => void photo("camera") },
      { text: "Choose from library", onPress: () => void photo("library") },
      ...(me.avatarVersion
        ? [
            {
              text: "Remove photo",
              style: "destructive" as const,
              onPress: async () => {
                setBusy(true);
                await removeAvatar().catch((e) => Alert.alert("Photo not removed", errorMessage(e)));
                await refresh().finally(() => setBusy(false));
              },
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);

  const toggleNotify = async (value: boolean) => {
    setNotify(value);
    try {
      await api("PATCH", "/me", { notifyAssessments: value });
      await refresh();
    } catch (e) {
      setNotify(!value);
      Alert.alert("Not saved", errorMessage(e));
    }
  };

  const displayName = me.preferredName ? `${me.preferredName} ${me.lastName}` : `${me.firstName} ${me.lastName}`;
  const facts = [me.level, me.yearsExperience != null ? `${me.yearsExperience} YRS` : null, me.station?.toUpperCase()].filter(Boolean);
  const since = new Date(me.memberSince).toLocaleDateString("en-CA", { month: "short", year: "numeric" }).toUpperCase();

  return (
    <ScrollView
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={sessions.isRefetching} onRefresh={() => void Promise.all([sessions.refetch(), refresh()])} tintColor={color.pine} />}
    >
      {/* Identity */}
      <View style={styles.pad}>
        <Mono>{(me.organizationName ?? "Imedica").toUpperCase()}</Mono>
        <View style={styles.identity}>
          <Pressable onPress={editPhoto} accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={busy}>
            <Avatar version={me.avatarVersion} first={me.preferredName ?? me.firstName} last={me.lastName} size={92} />
            <View style={styles.camera}>
              {busy ? <ActivityIndicator size="small" color={color.paper} /> : <Feather name="camera" size={14} color={color.paper} />}
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <Display size={30}>{displayName}</Display>
            {me.pronouns ? <Body size={13.5} tone={color.ink3}>{me.pronouns}</Body> : null}
          </View>
        </View>

        <Serif size={16} tone={color.ink2} style={{ marginTop: 16 }}>
          {me.level ? levelLabel[me.level] : "Add your level and experience"}
        </Serif>
        {facts.length ? <Mono style={{ marginTop: 6 }}>{facts.join(" · ")}</Mono> : null}
        {me.bio ? (
          <Serif italic size={16} tone={color.ink} style={{ marginTop: 14 }}>
            “{me.bio}”
          </Serif>
        ) : null}
        {me.certifications.length ? (
          <View style={styles.certs}>
            {me.certifications.map((c) => (
              <View key={c} style={styles.cert}>
                <Feather name="award" size={12} color={color.pine2} />
                <Mono medium tone={color.pine2}>
                  {c.toUpperCase()}
                </Mono>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => router.push("/profile/edit")} accessibilityRole="button" style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.8 }]}>
          <Feather name="edit-3" size={15} color={color.ink} />
          <Body medium tone={color.ink} size={14.5}>
            Edit profile
          </Body>
        </Pressable>
      </View>

      {/* Training on the monitor */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.monitor}>
        <View style={styles.monitorTop}>
          <Mono tone={color.mint} medium>
            YOUR TRAINING
          </Mono>
          <Mono tone={color.screenInk2}>LAST 20 RUNS</Mono>
        </View>
        <View style={styles.readouts}>
          <Readout label="RUNS" value={String(stats.runs)} />
          <Readout label="AVERAGE" value={stats.average != null ? `${stats.average}` : "—"} unit={stats.average != null ? "%" : undefined} />
          <Readout label="BEST" value={stats.best != null ? `${stats.best}` : "—"} unit={stats.best != null ? "%" : undefined} />
          <Readout label="STREAK" value={String(stats.streak)} unit={stats.streak === 1 ? "day" : "days"} />
        </View>
        {stats.trend.length > 1 ? (
          <Sparkline values={stats.trend} width={width - 80} height={56} />
        ) : (
          <Body tone={color.screenInk2} size={13.5} style={{ marginTop: 14 }}>
            Finish two calls and your score trend draws here.
          </Body>
        )}
        {allCategories.length ? (
          <View style={styles.coverage}>
            <Mono tone={color.screenInk2}>
              CALL TYPES PRACTISED · {[...stats.categories].filter((c) => allCategories.includes(c)).length}/{allCategories.length}
            </Mono>
            <View style={styles.coverageRow}>
              {allCategories.map((c) => {
                const done = stats.categories.has(c);
                return (
                  <View key={c} style={[styles.coverChip, done && styles.coverChipOn]}>
                    <Mono size={10} tone={done ? color.monitor : color.screenInk2} medium={done}>
                      {(categoryLabel[c] ?? c).toUpperCase()}
                    </Mono>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </Animated.View>

      {/* Settings */}
      <Section title="RESEARCH">
        <Row
          icon="bookmark"
          label="Reading list"
          value={saved.data ? `${saved.data.length} saved` : undefined}
          onPress={() => router.push({ pathname: "/research", params: { view: "saved" } })}
        />
      </Section>

      <Section title="NOTIFICATIONS">
        <View style={styles.row}>
          <Feather name="bell" size={18} color={color.ink2} />
          <View style={{ flex: 1 }}>
            <Body tone={color.ink}>Pre- and post-tests</Body>
            <Body size={13} tone={color.ink3}>
              A notice when your service opens one.
            </Body>
          </View>
          <Switch value={notify} onValueChange={(v) => void toggleNotify(v)} trackColor={{ true: color.pine3, false: color.rule }} thumbColor={color.card} />
        </View>
      </Section>

      <Section title="ACCOUNT">
        <Row icon="mail" label="Email" value={me.email} />
        <Row icon="calendar" label="Member since" value={since} />
        <Row icon="lock" label="Change password" onPress={() => router.push("/profile/password")} />
        <Row
          icon="log-out"
          label="Sign out"
          onPress={() =>
            Alert.alert("Sign out?", undefined, [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => void signOut() },
            ])
          }
        />
        <Row icon="trash-2" label="Delete account" danger onPress={() => router.push("/profile/delete")} last />
      </Section>

      <View style={[styles.pad, { marginTop: 22, gap: 10 }]}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Feather name="shield" size={16} color={color.pine2} style={{ marginTop: 2 }} />
          <Body size={13.5} style={{ flex: 1 }}>
            Your runs are stored under an anonymous key. Your service sees team results only when five or more people are in a group, never yours alone. Your profile details never reach those reports.
          </Body>
        </View>
        <Mono style={{ marginTop: 6 }}>IMEDICA {Constants.expoConfig?.version ?? ""}</Mono>
      </View>
    </ScrollView>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Mono tone={color.screenInk2} size={10}>
        {label}
      </Mono>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Mono tone={color.screenInk} size={26}>
          {value}
        </Mono>
        {unit ? (
          <Mono tone={color.mintDim} size={11}>
            {unit}
          </Mono>
        ) : null}
      </View>
    </View>
  );
}

function Sparkline({ values, width, height }: { values: number[]; width: number; height: number }) {
  const step = width / (values.length - 1);
  const y = (v: number) => 4 + (1 - v / 100) * (height - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <Svg width={width} height={height} style={{ marginTop: 16 }} accessibilityLabel={`Score trend, latest ${last}%`}>
      <Defs>
        <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color.mint} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color.mint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={`M0,${height} ${d.replace("M", "L")} L${width},${height} Z`} fill="url(#fill)" />
      <Path d={`M0,${y(75)} L${width},${y(75)}`} stroke={color.monitorRule} strokeDasharray="3 4" />
      <Path d={d} stroke={color.mint} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Circle cx={width} cy={y(last)} r={4} fill={color.mint} />
    </Svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 26 }}>
      <Mono style={[styles.pad, { marginBottom: 8 }]}>{title}</Mono>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const tone = danger ? color.signal : color.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      style={({ pressed }) => [styles.row, !last && styles.rowRule, pressed && { backgroundColor: color.paper2 }]}
    >
      <Feather name={icon} size={18} color={danger ? color.signal : color.ink2} />
      <Body tone={tone} style={{ flex: 1 }}>
        {label}
      </Body>
      {value ? (
        <Body size={14} tone={color.ink3} numberOfLines={1} style={{ maxWidth: "55%" }}>
          {value}
        </Body>
      ) : null}
      {onPress ? <Feather name="chevron-right" size={18} color={color.ink3} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  identity: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 14 },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.ink,
    borderWidth: 2,
    borderColor: color.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  certs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  cert: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: color.pineWash },
  editBtn: {
    marginTop: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: color.rule,
    backgroundColor: color.card,
  },
  monitor: { marginHorizontal: 20, marginTop: 26, backgroundColor: color.monitor, borderRadius: radius.lg, padding: 20 },
  monitorTop: { flexDirection: "row", justifyContent: "space-between" },
  readouts: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  coverage: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.monitorRule, gap: 10 },
  coverageRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  coverChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: color.monitorRule },
  coverChipOn: { backgroundColor: color.mint, borderColor: color.mint },
  card: { marginHorizontal: 20, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.rule, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowRule: { borderBottomWidth: 1, borderBottomColor: color.rule2 },
});

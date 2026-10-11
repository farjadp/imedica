import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { SheetHeader } from "@/components/sheet-header";
import { Body, Mono } from "@/components/type";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { color } from "@/lib/theme";
import type { ProfilePatch } from "@/lib/types";

const LEVELS = [
  { value: "PCP", label: "PCP" },
  { value: "ACP", label: "ACP" },
  { value: "CCP", label: "CCP" },
  { value: "EMR", label: "EMR" },
  { value: "STUDENT", label: "Student" },
  { value: "OTHER", label: "Other" },
];

const COMMON_CERTS = ["ACLS", "PALS", "PHTLS", "ITLS", "AMLS", "NRP", "BLS", "CCT"];

export default function EditProfile() {
  const me = useMe();
  const { refresh } = useAuth();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName,
    preferredName: me.preferredName ?? "",
    pronouns: me.pronouns ?? "",
    station: me.station ?? "",
    bio: me.bio ?? "",
    years: me.yearsExperience != null ? String(me.yearsExperience) : "",
  });
  const [level, setLevel] = useState<string | null>(me.level);
  const [certs, setCerts] = useState<string[]>(me.certifications);
  const [certDraft, setCertDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addCert = (raw: string) => {
    const c = raw.trim();
    if (!c || certs.some((x) => x.toLowerCase() === c.toLowerCase()) || certs.length >= 12) return;
    setCerts((list) => [...list, c.slice(0, 40)]);
    setCertDraft("");
  };

  const save = async () => {
    const years = form.years.trim() === "" ? null : Number(form.years);
    if (years != null && (!Number.isInteger(years) || years < 0 || years > 60)) {
      setErrors({ yearsExperience: "Enter a whole number from 0 to 60." });
      return;
    }
    const patch: ProfilePatch = {
      firstName: form.firstName,
      lastName: form.lastName,
      preferredName: form.preferredName,
      pronouns: form.pronouns,
      station: form.station,
      bio: form.bio,
      yearsExperience: years,
      level: level ?? "",
      certifications: certDraft.trim() ? [...certs, certDraft.trim()] : certs,
    };
    setSaving(true);
    setErrors({});
    setProblem(null);
    try {
      await api("PATCH", "/me", patch);
      await refresh();
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setProblem("Some fields need attention. Check names aren't empty and the bio is under 280 characters.");
      else setProblem(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: insets.bottom + 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        <SheetHeader kicker="YOUR PROFILE" title="Edit profile." />

        <View style={styles.two}>
          <View style={{ flex: 1 }}>
            <Field label="First name" value={form.firstName} onChangeText={set("firstName")} autoComplete="given-name" textContentType="givenName" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Last name" value={form.lastName} onChangeText={set("lastName")} autoComplete="family-name" textContentType="familyName" />
          </View>
        </View>
        <View style={styles.two}>
          <View style={{ flex: 1 }}>
            <Field label="Preferred name" value={form.preferredName} onChangeText={set("preferredName")} placeholder="Optional" textContentType="nickname" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Pronouns" value={form.pronouns} onChangeText={set("pronouns")} placeholder="e.g. she/her" autoCapitalize="none" />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Mono>LEVEL</Mono>
          <View style={styles.chips}>
            {LEVELS.map((l) => (
              <Pressable
                key={l.value}
                onPress={() => setLevel(level === l.value ? null : l.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: level === l.value }}
                style={[styles.chip, level === l.value && styles.chipOn]}
              >
                <Body size={14} medium tone={level === l.value ? color.paper : color.ink2}>
                  {l.label}
                </Body>
              </Pressable>
            ))}
          </View>
          <Body size={13} tone={color.ink3}>
            Level and years reach team reports only as ranges, and only for groups of five or more.
          </Body>
        </View>

        <View style={styles.two}>
          <View style={{ width: 120 }}>
            <Field label="Years" value={form.years} onChangeText={set("years")} keyboardType="number-pad" maxLength={2} error={errors.yearsExperience} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Station or base" value={form.station} onChangeText={set("station")} placeholder="e.g. Station 12" />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Field
            label="Certifications"
            value={certDraft}
            onChangeText={setCertDraft}
            placeholder="Type one and press return"
            autoCapitalize="characters"
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={() => addCert(certDraft)}
          />
          {certs.length ? (
            <View style={styles.chips}>
              {certs.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCerts((list) => list.filter((x) => x !== c))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${c}`}
                  style={[styles.chip, styles.certOn]}
                >
                  <Body size={13.5} medium tone={color.pine2}>
                    {c}
                  </Body>
                  <Feather name="x" size={13} color={color.pine2} />
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.chips}>
            {COMMON_CERTS.filter((c) => !certs.includes(c)).map((c) => (
              <Pressable key={c} onPress={() => addCert(c)} accessibilityRole="button" accessibilityLabel={`Add ${c}`} style={styles.chip}>
                <Feather name="plus" size={13} color={color.ink3} />
                <Body size={13.5} tone={color.ink2}>
                  {c}
                </Body>
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label="About you"
          value={form.bio}
          onChangeText={set("bio")}
          multiline
          maxLength={280}
          placeholder="A line about your practice"
          hint={`${280 - form.bio.length} characters left`}
          style={{ minHeight: 96 }}
        />

        {problem ? (
          <Body tone={color.signal} size={14} accessibilityLiveRegion="polite">
            {problem}
          </Body>
        ) : null}
        <Button label="Save" loading={saving} onPress={() => void save()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  two: { flexDirection: "row", gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.rule,
  },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  certOn: { backgroundColor: color.pineWash, borderColor: color.pineWash },
});

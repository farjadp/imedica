import { StyleSheet, View } from "react-native";

import { color } from "@/lib/theme";
import type { Vitals } from "@/lib/types";

import { Mono } from "./type";

// Thresholds that turn a number alarm red. Illustrative adult ranges for
// training, not clinical decision support.
const alarm = {
  hr: (v: number) => v > 120 || v < 50,
  sbp: (v: number) => v < 90 || v > 180,
  spo2: (v: number) => v < 92,
  rr: (v: number) => v > 24 || v < 10,
};

function Cell({ label, value, unit, bad }: { label: string; value: string; unit?: string; bad?: boolean }) {
  return (
    <View style={styles.cell} accessible accessibilityLabel={`${label} ${value} ${unit ?? ""}`}>
      <Mono tone={color.screenInk2} size={10}>
        {label}
      </Mono>
      <Mono tone={bad ? color.alarm : color.mint} size={26} medium style={{ marginTop: 2 }}>
        {value}
        {unit ? (
          <Mono tone={color.screenInk2} size={10}>
            {" "}
            {unit}
          </Mono>
        ) : null}
      </Mono>
    </View>
  );
}

export function VitalsGrid({ v }: { v: Vitals }) {
  const extra = [
    v.gcs != null ? `GCS ${v.gcs}` : null,
    v.glucose != null ? `BGL ${v.glucose}` : null,
    v.etco2 != null ? `EtCO₂ ${v.etco2}` : null,
    v.temp != null ? `T ${v.temp}°` : null,
  ].filter(Boolean);
  return (
    <View>
      <View style={styles.grid}>
        <Cell label="HR" value={v.hr != null ? String(v.hr) : "--"} bad={v.hr != null && alarm.hr(v.hr)} />
        <Cell label="BP" value={v.sbp != null ? `${v.sbp}/${v.dbp ?? "--"}` : "--"} bad={v.sbp != null && alarm.sbp(v.sbp)} />
        <Cell label="SpO₂" value={v.spo2 != null ? String(v.spo2) : "--"} unit="%" bad={v.spo2 != null && alarm.spo2(v.spo2)} />
        <Cell label="RR" value={v.rr != null ? String(v.rr) : "--"} bad={v.rr != null && alarm.rr(v.rr)} />
      </View>
      {extra.length ? (
        <Mono tone={color.screenInk2} style={{ marginTop: 10 }}>
          {extra.join("  ·  ")}
        </Mono>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", justifyContent: "space-between" },
  cell: { minWidth: 64 },
});

import { View } from "react-native";

import { outcomeStyle } from "@/lib/theme";

import { Mono } from "./type";

export function OutcomeTag({ outcome, label }: { outcome: string; label?: string }) {
  const s = outcomeStyle[outcome] ?? outcomeStyle.SUBOPTIMAL;
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start" }}>
      <Mono medium tone={s.fg} size={10.5}>
        {(label ?? s.label).toUpperCase()}
      </Mono>
    </View>
  );
}

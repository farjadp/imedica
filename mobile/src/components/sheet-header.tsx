import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { color } from "@/lib/theme";

import { Display, Mono } from "./type";

/** Title block for a modal screen, with a close button. */
export function SheetHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Mono>{kicker}</Mono>
        <Display size={32} style={{ marginTop: 6 }}>
          {title}
        </Display>
      </View>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={12}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.paper2, alignItems: "center", justifyContent: "center" }}
      >
        <Feather name="x" size={18} color={color.ink} />
      </Pressable>
    </View>
  );
}

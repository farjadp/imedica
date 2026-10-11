import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from "react-native";

import { color, font, radius } from "@/lib/theme";

import { Body } from "./type";

type Variant = "primary" | "mint" | "secondary" | "ghostDark";

const look: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.pine, fg: color.paper },
  mint: { bg: color.mint, fg: color.monitor },
  secondary: { bg: color.card, fg: color.ink, border: color.rule },
  ghostDark: { bg: "transparent", fg: color.mint, border: color.monitorRule },
};

export function Button({
  label,
  variant = "primary",
  loading,
  style,
  onPress,
  ...rest
}: PressableProps & { label: string; variant?: Variant; loading?: boolean; style?: ViewStyle }) {
  const l = look[variant];
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      onPress={(e) => {
        if (loading) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          backgroundColor: l.bg,
          borderColor: l.border ?? l.bg,
          borderWidth: 1,
          borderRadius: radius.md,
          minHeight: 52,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={l.fg} /> : <Body tone={l.fg} size={16} style={{ fontFamily: font.sansMedium }}>{label}</Body>}
    </Pressable>
  );
}

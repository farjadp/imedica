import { Text, type TextProps, type TextStyle } from "react-native";

import { color, font } from "@/lib/theme";

// Source Serif for the voice, Plex Sans for the interface, Plex Mono only for
// measurement: vitals, clocks, scores, outcome tags.

type Props = TextProps & { tone?: string; size?: number; style?: TextStyle | TextStyle[] };

export function Display({ tone = color.ink, size = 34, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: font.display, fontSize: size, lineHeight: size * 1.08, letterSpacing: -size * 0.03, color: tone }, style as TextStyle]}
    />
  );
}

export function Serif({ tone = color.ink, size = 17, italic, style, ...rest }: Props & { italic?: boolean }) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: italic ? font.displayItalic : font.serif, fontSize: size, lineHeight: size * 1.4, color: tone }, style as TextStyle]}
    />
  );
}

export function Body({ tone = color.ink2, size = 15, medium, style, ...rest }: Props & { medium?: boolean }) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: medium ? font.sansMedium : font.sans, fontSize: size, lineHeight: size * 1.45, color: tone }, style as TextStyle]}
    />
  );
}

export function Mono({ tone = color.ink3, size = 11, medium, style, ...rest }: Props & { medium?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: medium ? font.monoMedium : font.mono, fontSize: size, letterSpacing: size < 14 ? 0.6 : 0, color: tone, fontVariant: ["tabular-nums"] },
        style as TextStyle,
      ]}
    />
  );
}

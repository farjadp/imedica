import Svg, { Path } from "react-native-svg";

import { color } from "@/lib/theme";

// The iMedica mark: a heart drawn as one continuous line with the stem of an
// "i" folded into it. Same geometry as the web logo.
export const MARK_PATHS = [
  "M141 86V185a80 80 0 0 0 80 80h134a99 99 0 0 1 0 198H57V150a99 99 0 0 1 198 0v90",
  "M57 300a68 68 0 0 0 68 68h205",
];

export function LogoMark({ size = 28, tone = color.brand }: { size?: number; tone?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path d={MARK_PATHS[0]} fill="none" stroke={tone} strokeWidth={56} />
      <Path d={MARK_PATHS[1]} fill="none" stroke={tone} strokeWidth={56} strokeLinecap="round" />
    </Svg>
  );
}

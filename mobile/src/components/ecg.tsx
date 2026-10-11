import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { ecgPath, type Rhythm } from "@/lib/ecg";
import { color } from "@/lib/theme";

const BEAT: Record<Rhythm, number> = { sinus: 120, tachycardia: 78, stemi: 96, bradycardia: 190, vfib: 100, asystole: 100 };

/**
 * A scrolling lead II trace. The sweep speed follows the heart rate, so a
 * tachycardic patient's trace really does run faster. Paused under reduced motion.
 */
export function EcgTrace({
  width,
  height = 56,
  rhythm = "sinus",
  hr = 80,
  stroke = color.mint,
  glow = true,
}: {
  width: number;
  height?: number;
  rhythm?: Rhythm;
  hr?: number;
  stroke?: string;
  glow?: boolean;
}) {
  const reduced = useReducedMotion();
  const beat = BEAT[rhythm] ?? 120;
  // One period long enough to cover the view, so two side by side loop seamlessly.
  const period = Math.max(beat, Math.ceil(width / beat) * beat);
  const d = useMemo(() => ecgPath(rhythm, period * 2, height), [rhythm, period, height]);

  const x = useSharedValue(0);
  useEffect(() => {
    if (reduced || rhythm === "asystole") return;
    const pxPerSec = rhythm === "vfib" ? 140 : (Math.max(30, Math.min(hr, 220)) / 60) * beat;
    x.value = 0;
    x.value = withRepeat(withTiming(-period, { duration: (period / pxPerSec) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [reduced, rhythm, hr, beat, period, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="none" style={{ width, height, overflow: "hidden" }}>
      <Animated.View style={[{ width: period * 2, height }, style]}>
        <Svg width={period * 2} height={height}>
          {glow ? <Path d={d} fill="none" stroke={stroke} strokeOpacity={0.18} strokeWidth={6} strokeLinejoin="round" /> : null}
          <Path d={d} fill="none" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

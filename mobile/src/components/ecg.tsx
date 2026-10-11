import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

import { ecgPath, stripPath, type Rhythm } from "@/lib/ecg";
import { pickStrip, stripDuration } from "@/lib/ecg-strips";
import { color } from "@/lib/theme";

// Pixels per drawn beat at 60 bpm, so the sweep speed can follow the heart rate.
const BEAT: Record<Rhythm, number> = { sinus: 120, tachycardia: 78, bradycardia: 190, afib: 100, stemi: 96, vfib: 100, asystole: 100 };
// A real strip (~8 s) is laid out this wide, the same scale as the web monitor.
const STRIP_WIDTH = 960;

const sampleCache = new Map<string, Promise<number[] | null>>();

/** PTB-XL samples are static files on the web app; fetched once per strip. */
function loadSamples(id: string): Promise<number[] | null> {
  let p = sampleCache.get(id);
  if (!p) {
    p = fetch(`${process.env.EXPO_PUBLIC_API_URL}/ecg/ptbxl/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<{ samples: number[] }>) : null))
      .then((d) => (d && Array.isArray(d.samples) ? d.samples : null))
      .catch(() => null);
    sampleCache.set(id, p);
  }
  return p;
}

/**
 * A scrolling lead II trace: two copies of one period slide left forever, so
 * the loop has no seam. With `real`, rhythms that have PTB-XL recordings play
 * a real strip (the chosen one, or the one closest to `hr`); VF, asystole and
 * anything still loading use the drawn trace, whose speed follows the heart
 * rate. Paused under reduced motion.
 */
export function EcgTrace({
  width,
  height = 56,
  rhythm = "sinus",
  hr = 80,
  stroke = color.mint,
  glow = true,
  real = false,
  strip,
}: {
  width: number;
  height?: number;
  rhythm?: Rhythm;
  hr?: number;
  stroke?: string;
  glow?: boolean;
  real?: boolean;
  strip?: string | null;
}) {
  const reduced = useReducedMotion();
  const chosen = useMemo(() => (real ? pickStrip(rhythm, hr, strip) : null), [real, rhythm, hr, strip]);
  const [loaded, setLoaded] = useState<{ id: string; samples: number[] } | null>(null);

  useEffect(() => {
    if (!chosen) return;
    let live = true;
    void loadSamples(chosen.id).then((samples) => {
      if (live && samples) setLoaded({ id: chosen.id, samples });
    });
    return () => {
      live = false;
    };
  }, [chosen]);

  const samples = chosen && loaded?.id === chosen.id ? loaded.samples : null;
  const beat = BEAT[rhythm] ?? 120;
  const period = samples ? STRIP_WIDTH : Math.max(beat, Math.ceil(width / beat) * beat);
  const d = useMemo(() => (samples ? stripPath(samples, period, height) : ecgPath(rhythm, period, height)), [samples, rhythm, period, height]);
  const ms = samples && chosen
    ? stripDuration(chosen, hr) * 1000
    : rhythm === "vfib"
      ? (period / 140) * 1000
      : (period / ((Math.max(30, Math.min(hr, 220)) / 60) * beat)) * 1000;

  const x = useSharedValue(0);
  useEffect(() => {
    if (reduced || rhythm === "asystole") return;
    x.value = 0;
    x.value = withRepeat(withTiming(-period, { duration: ms, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [reduced, rhythm, period, ms, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="none" style={{ width, height, overflow: "hidden" }}>
      <Animated.View style={[{ width: period * 2, height }, style]}>
        <Svg width={period * 2} height={height}>
          {[0, period].map((offset) => (
            <G key={offset} x={offset}>
              {glow ? <Path d={d} fill="none" stroke={stroke} strokeOpacity={0.18} strokeWidth={6} strokeLinejoin="round" /> : null}
              <Path d={d} fill="none" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
            </G>
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

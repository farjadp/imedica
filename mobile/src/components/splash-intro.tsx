import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { color } from "@/lib/theme";

import { MARK_PATHS } from "./logo";
import { Display, Mono } from "./type";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LOGO = 120; // matches imageWidth of the native splash, so the hand-off is seamless

/** A flat line with one heartbeat in the middle, plus its length for the draw-on. */
function beatLine(width: number, mid: number) {
  const c = width / 2;
  const pts: [number, number][] = [
    [0, 0], [c - 60, 0], [c - 50, -6], [c - 42, 0], [c - 24, 0], [c - 18, 8],
    [c - 10, -46], [c - 2, 18], [c + 6, 0], [c + 22, -4], [c + 34, -12], [c + 46, 0], [width, 0],
  ];
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${(mid + y).toFixed(1)}`).join(" ");
  return { d, length };
}

/**
 * The opening moment. The native splash hands over a still heart; here it
 * beats twice, a monitor trace sweeps across, and the name arrives. ~2.3 s,
 * or a quick fade under reduced motion.
 */
export function SplashIntro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const traceY = height * 0.72;
  const trace = useMemo(() => beatLine(width, 60), [width]);

  const beat = useSharedValue(1);
  const halo = useSharedValue(0);
  const draw = useSharedValue(0);
  const lift = useSharedValue(0);
  const words = useSharedValue(0);
  const veil = useSharedValue(1);

  useEffect(() => {
    const finish = () => {
      veil.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(onDone)();
      });
    };
    if (reduced) {
      words.value = 1;
      lift.value = 1;
      draw.value = 1;
      const t = setTimeout(finish, 700);
      return () => clearTimeout(t);
    }
    const lub = { duration: 110, easing: Easing.out(Easing.quad) };
    const settle = { duration: 220, easing: Easing.inOut(Easing.quad) };
    beat.value = withSequence(withTiming(1.09, lub), withTiming(0.98, settle), withTiming(1.05, lub), withTiming(1, settle));
    halo.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    draw.value = withDelay(250, withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }));
    lift.value = withDelay(800, withTiming(1, { duration: 650, easing: Easing.out(Easing.exp) }));
    words.value = withDelay(950, withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) }));
    const t = setTimeout(finish, 2250);
    return () => clearTimeout(t);
  }, [reduced, beat, halo, draw, lift, words, veil, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -56 * lift.value }, { scale: beat.value * (1 - 0.18 * lift.value) }],
  }));
  const haloProps = useAnimatedProps(() => ({
    r: 40 + 120 * halo.value,
    strokeOpacity: 0.4 * (1 - halo.value),
  }));
  const traceProps = useAnimatedProps(() => ({ strokeDashoffset: trace.length * (1 - draw.value) }));
  const headProps = useAnimatedProps(() => {
    // The bright dot rides the leading edge of the trace, like a monitor's sweep.
    const x = width * draw.value;
    const c = width / 2;
    const y = Math.abs(x - c + 10) < 14 ? 60 - 30 : 60;
    return { cx: x, cy: y, opacity: draw.value > 0 && draw.value < 1 ? 1 : 0 };
  });
  const wordStyle = useAnimatedStyle(() => ({
    opacity: words.value,
    transform: [{ translateY: 18 * (1 - words.value) }],
  }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root, veilStyle]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <AnimatedCircle cx={width / 2} cy={height / 2} fill="none" stroke={color.mint} strokeWidth={1.5} animatedProps={haloProps} />
      </Svg>

      <Animated.View style={[styles.center, logoStyle]}>
        <Svg width={LOGO} height={LOGO} viewBox="0 0 512 512">
          <Path d={MARK_PATHS[0]} fill="none" stroke={color.mint} strokeWidth={44} />
          <Path d={MARK_PATHS[1]} fill="none" stroke={color.mint} strokeWidth={44} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.words, { top: height / 2 + 34 }, wordStyle]}>
        <Display tone={color.screenInk} size={40}>
          i<Display tone={color.mint} size={40}>M</Display>edica
        </Display>
        <Mono tone={color.screenInk2} size={11} style={{ marginTop: 10, letterSpacing: 2.4 }}>
          DECIDE BEFORE THE CALL
        </Mono>
      </Animated.View>

      <Svg width={width} height={120} style={{ position: "absolute", top: traceY - 60, left: 0 }}>
        <AnimatedPath d={trace.d} fill="none" stroke={color.mint} strokeOpacity={0.16} strokeWidth={7} strokeDasharray={trace.length} animatedProps={traceProps} />
        <AnimatedPath d={trace.d} fill="none" stroke={color.mint} strokeWidth={1.8} strokeLinejoin="round" strokeDasharray={trace.length} animatedProps={traceProps} />
        <AnimatedCircle r={3.5} fill={color.mint} animatedProps={headProps} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: color.monitor, zIndex: 10 },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  words: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});

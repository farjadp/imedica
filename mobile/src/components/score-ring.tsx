import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { color } from "@/lib/theme";

import { Mono } from "./type";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreRing({
  percent,
  size = 112,
  stroke = 8,
  tone = color.pine,
  label = true,
  onDark = false,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  tone?: string;
  label?: boolean;
  /** On the dark monitor: a lighter track and number. */
  onDark?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(200, withTiming(Math.max(0, Math.min(percent, 100)) / 100, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [percent, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessible accessibilityLabel={`${percent} percent`}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={onDark ? color.monitorRule : color.rule} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} animatedProps={props} />
      </Svg>
      {label ? (
        <Mono tone={onDark ? color.screenInk : color.ink} size={size / 4.2} medium>
          {percent}
          <Mono tone={onDark ? color.screenInk2 : color.ink3} size={size / 9}>
            %
          </Mono>
        </Mono>
      ) : null}
    </View>
  );
}

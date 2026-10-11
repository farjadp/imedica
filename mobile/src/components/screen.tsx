import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { color } from "@/lib/theme";

import { Button } from "./button";
import { Body, Serif } from "./type";

export function Loading({ dark }: { dark?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: dark ? color.monitor : color.paper }}>
      <ActivityIndicator color={dark ? color.mint : color.pine} />
    </View>
  );
}

export function Problem({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <View style={{ padding: 24, gap: 14, alignItems: "flex-start" }}>
      <Serif size={20}>That didn’t load.</Serif>
      <Body>{message}</Body>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
      {children}
    </View>
  );
}

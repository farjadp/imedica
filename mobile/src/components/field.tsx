import { TextInput, View, type TextInputProps } from "react-native";

import { color, font, radius } from "@/lib/theme";

import { Body, Mono } from "./type";

/** A labelled text field on paper. */
export function Field({ label, hint, error, style, ...input }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Mono>{label.toUpperCase()}</Mono>
      <TextInput
        placeholderTextColor={color.ink3}
        accessibilityLabel={label}
        {...input}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: error ? color.signal : color.rule,
            borderRadius: radius.md,
            backgroundColor: color.card,
            paddingHorizontal: 14,
            paddingVertical: input.multiline ? 12 : 0,
            fontFamily: font.sans,
            fontSize: 16,
            color: color.ink,
            textAlignVertical: input.multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {error ? (
        <Body size={13} tone={color.signal}>
          {error}
        </Body>
      ) : hint ? (
        <Body size={13} tone={color.ink3}>
          {hint}
        </Body>
      ) : null}
    </View>
  );
}

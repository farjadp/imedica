import { useState } from "react";
import { Image, View } from "react-native";

import { BASE, authHeaders } from "@/lib/api";
import { color, font } from "@/lib/theme";

import { Display } from "./type";

export function initials(first: string, last: string) {
  return `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`.toUpperCase();
}

/** Your own photo, fetched with your token; initials on pine when there isn't one. */
export function Avatar({ version, first, last, size = 88 }: { version: string | null; first: string; last: string; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const showPhoto = version && failed !== version;
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: color.pine, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="image"
      accessibilityLabel={showPhoto ? "Your profile photo" : `${first} ${last}`}
    >
      {showPhoto ? (
        <Image
          source={{ uri: `${BASE}/api/v1/me/avatar?v=${version}`, headers: authHeaders(), cache: "force-cache" }}
          style={{ width: size, height: size }}
          onError={() => setFailed(version)}
        />
      ) : (
        <Display tone={color.paper} size={size * 0.36} style={{ fontFamily: font.display, letterSpacing: 0 }}>
          {initials(first, last)}
        </Display>
      )}
    </View>
  );
}

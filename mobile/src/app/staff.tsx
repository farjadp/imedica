import * as Linking from "expo-linking";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { LogoMark } from "@/components/logo";
import { Body, Display } from "@/components/type";
import { useAuth, useMe } from "@/lib/auth";
import { color } from "@/lib/theme";

// Physicians, training leads and admins work on the web; the app is for paramedics.
export default function Staff() {
  const me = useMe();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: color.monitor, padding: 24, paddingTop: insets.top + 32, gap: 16 }}>
      <LogoMark size={30} tone={color.mint} />
      <Display tone={color.screenInk} size={36} style={{ marginTop: 16 }}>
        The app is for paramedics, {me.firstName}.
      </Display>
      <Body tone={color.screenInk2}>
        Scenario authoring, team results and pre/post tests live on the web, where there’s room to work.
      </Body>
      <View style={{ flex: 1 }} />
      <Button label="Open Imedica on the web" variant="mint" onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_API_URL}/admin`)} />
      <Button label="Sign out" variant="ghostDark" onPress={() => void signOut()} style={{ marginBottom: insets.bottom }} />
    </View>
  );
}

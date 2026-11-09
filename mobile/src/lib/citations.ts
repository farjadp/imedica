import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";

import { BASE } from "./api";

// Guideline 1.4.1: every medical claim in the app links to its source.

export { sourceForReference } from "./source-match";

export const DISCLAIMER_LINE = "Training tool for paramedics. Not for clinical decisions: follow your local medical directives and base hospital.";

/** The web app's legal pages. The API base is the web origin. */
export function siteUrl(path: string): string {
  return `${BASE ?? "https://www.imedica.tech"}${path}`;
}

/** Used only when /sources hasn't loaded; the server sends the canonical URL. */
export const FALLBACK_DISCLAIMER_URL = siteUrl("/legal/disclaimer");

/** Opens a source in the in-app browser, so the learner comes straight back. */
export async function openLink(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } catch {
    Alert.alert("Couldn’t open the link", url);
  }
}

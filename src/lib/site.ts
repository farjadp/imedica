// Public contact details, from imedica.tech/contact (October 2026).
export const site = {
  legalName: "Ashavid Inc.",
  contactEmail: "hi@imedica.tech",
  // No separate privacy inbox exists yet; privacy questions go to the main one.
  privacyEmail: "hi@imedica.tech",
  phone: "+1 437 286 0787",
  phoneHref: "tel:+14372860787",
  address: {
    street: "567 Davis Dr.",
    city: "Newmarket",
    province: "ON",
    postalCode: "L3Y 2P5",
    country: "Canada",
  },
};

// The rebuilt mobile apps. Store links come from NEXT_PUBLIC_IOS_STORE_URL and
// NEXT_PUBLIC_ANDROID_STORE_URL (set on Railway once each listing resolves), so a
// store goes live on the site with a redeploy and no code change. Until then the
// badges say "coming" instead of pointing at a dead link.
export const apps = {
  // Pilot services get the beta (TestFlight / Play testing) first; the store
  // listings go public once both reviews have passed.
  betaDate: "2026-10-20",
  launchDate: "2026-11-03",
  ios: { url: process.env.NEXT_PUBLIC_IOS_STORE_URL || null },
  // TestFlight's public link for the pilot beta; works once Apple's beta review approves a build.
  iosBeta: "https://testflight.apple.com/join/2q9wY5sg",
  // The app's URL scheme (mobile/app.json "scheme"): opens the installed app.
  scheme: "imedica://",
  android: { url: process.env.NEXT_PUBLIC_ANDROID_STORE_URL || null },
};

export type Store = "ios" | "android";

/** Where a store button goes: the listing once it's live, otherwise the app page. */
export const storeHref = (store: Store) => apps[store].url ?? "/download#get";

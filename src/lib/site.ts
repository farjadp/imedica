// Public contact details, from imedica.tech/contact (October 2026).
export const site = {
  legalName: "Imedica HealthTech Inc.",
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

// The rebuilt mobile apps. Store links stay null until each listing is live,
// so the download page shows "coming" instead of a dead link.
export const apps = {
  // Pilot services get the beta (TestFlight / Play testing) first; the store
  // listings go public once both reviews have passed.
  betaDate: "2026-10-20",
  launchDate: "2026-11-03",
  ios: { url: null as string | null },
  android: { url: null as string | null },
};

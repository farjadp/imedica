# Imedica for iPhone and Android

The paramedic app: sign in, the scenario library, the live call, debriefs and history. Expo (SDK 57) with Expo Router, talking only to `/api/v1` of the web app with a bearer token kept in SecureStore. Grading stays on the server.

Plan: `../docs/superpowers/plans/2026-10-11-mobile-apps.md`. Design: `../DESIGN.md`.

## Run it

```bash
cp .env.example .env        # EXPO_PUBLIC_API_URL: staging, or http://localhost:3000 for the local web app
npm install
npx expo run:ios            # dev build in the iOS simulator (needs Xcode)
npx expo run:android        # dev build in the Android emulator; use http://10.0.2.2:3000 for a local API
```

Android needs JDK 17 (`JAVA_HOME`); JDK 25 fails at the CMake step with "A restricted method in java.lang.System has been called". To reach a local API from the emulator, `adb reverse tcp:3000 tcp:3000` lets `localhost` work there too.

If `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT`, export `LANG=en_US.UTF-8` first.

Sign in with a seeded paramedic (`medic1@lakeshore.test`, local password in the root README). Staff accounts see a note pointing them to the web.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## Layout

- `src/app/` — screens (Expo Router). `sign-in`, `(tabs)/` library, history and profile, `scenario/[id]` brief, `run/[id]` live call, `review/[id]` debrief, `staff` for non-paramedics.
- `src/components/` — the opening animation (`splash-intro`), the HR-synced ECG trace, vitals, score ring, type and buttons.
- `src/lib/` — API client, auth, queries, theme tokens, labels. `ecg.ts` and `labels.ts` mirror files in the web app; keep them in step.

The native splash is the heart on the monitor background; `SplashIntro` takes over from that exact frame. Splash changes only show in a new build, not Expo Go.

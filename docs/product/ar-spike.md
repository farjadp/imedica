# AR spike: a 3D patient in the user's room, phone only

Status: spike finished on 2026-11-08. The **test page** ships on the web app at `/ar-spike/index.html` (files in `public/ar-spike/`, MIME headers in `next.config.ts`) so Farjad can test on his own phone. The throwaway mobile screen, the Blender pipeline and the spike-only Vercel config stay on the unmerged local branch `myca/ar-spike-b6e555` and don't ship.
Owner: tech-lead session. Timebox: 2–3 days. Used: under 1 day.

## Verdict

**Yes.** Imedica can show a 3D patient at real size on the user's floor using only their phone, with no native module and no app-store-risky change. iOS opens a hosted `.usdz` in AR Quick Look; Android opens a hosted `.glb` in Google Scene Viewer. Both are one `Linking.openURL` call.
**But the built-in viewers can only show the patient.** The user can't tap a wound, make a decision, or get a score inside AR. Interactive, scored AR means ViroReact, a native dependency and a new store submission. Real 3D content and physician review cost more than either code path.

## What was built

| Piece | Path | Notes |
|---|---|---|
| Placeholder model, GLB | `public/ar-spike/models/placeholder-casualty.glb` | 450 KB (460,748 B), 3 meshes + marker, no textures, no animation |
| Placeholder model, USDZ | `public/ar-spike/models/placeholder-casualty.usdz` | 524 KB (536,860 B), single `.usdc`, passes `usdchecker --arkit` |
| Poster image | `public/ar-spike/models/placeholder-casualty-preview.png` | 72 KB |
| Conversion pipeline | `prototypes/ar-spike/pipeline/build_patient.py` (spike branch only) | Headless Blender 5.2 script, one command |
| `<model-viewer>` test page | `public/ar-spike/index.html` → https://www.imedica.tech/ar-spike/index.html | Zero-build static page with direct Quick Look / Scene Viewer fallbacks and an on-page diagnostics box |
| Throwaway app screen | `mobile/src/app/ar-spike.tsx` (spike branch only) | "View in your room" button; reads `EXPO_PUBLIC_AR_SPIKE_BASE_URL`; not linked from any navigation |

The app screen is not wired into navigation. Because Expo Router is file-based, though, the file is reachable by deep link (`imedica://ar-spike`), so it stays on the spike branch and is **not** part of the web PR. Nothing in iOS build 1.0.0 (5) was touched: no change under `mobile/` ships, nor any change to `app.json`, `eas.json` or native config.

The web page is unlinked and sends `X-Robots-Tag: noindex, nofollow`. The site-wide `Permissions-Policy: camera=()` blocks the in-browser WebXR mode on this page. That doesn't matter, because Quick Look and Scene Viewer are separate system apps with their own camera access.

### Model: source and licence

- **Source:** Quaternius, *Ultimate Modular Men* pack, `Casual.glb` (https://quaternius.com/packs/ultimatemodularcharacters.html). Fetched from the fan-made mirror `trebeljahr/quaternius-showcase`, whose `LICENSES.md` lists this pack as **CC0-1.0**.
- **Licence:** CC0-1.0 (public domain dedication): no attribution required and commercial use allowed. Crediting Quaternius is still good practice.
- **Label:** *PLACEHOLDER — not clinical content.* It is a stylised low-poly figure. The red disc on the right thigh is a marker, not a wound.

### Conversion pipeline (reproducible)

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
  --python prototypes/ar-spike/pipeline/build_patient.py -- Casual.glb out/
```

Steps in the script:
1. Import GLB.
2. Delete a stray 2 m helper sphere shipped in the source file.
3. Drop animations.
4. Rotate the upper-arm bones from T-pose down to the sides.
5. Bake the pose into static meshes and remove the armature.
6. Scale to 1.75 m and lie the figure supine on z = 0, centred on the origin, so AR places it where the user taps.
7. Add the placeholder marker.
8. Export GLB, and export USDZ with Blender's native USD exporter (`UsdPreviewSurface` materials, Y-up, metres).

No Apple `usdzconvert` / Reality Converter step was needed: Blender writes a USDZ that passes `usdchecker --arkit`. Final footprint: 0.56 × 0.35 × 1.75 m, confirmed by `<model-viewer>`'s `getDimensions()`.

The skeleton is removed deliberately. Static meshes are the most portable input for both viewers. Animated casualties (agonal breathing, seizure) are possible in both formats, but every animation is a content-authoring task (see Content cost).

## What was verified and what wasn't

| Check | Result | How |
|---|---|---|
| GLB and USDZ open and look right (pose, scale, colours, marker) | ✅ Verified | Re-imported each file into Blender and rendered it |
| USDZ meets ARKit packaging rules | ✅ Verified | `usdchecker --arkit` → Success |
| Test page renders the model, desktop and 375 px width, no horizontal scroll | ✅ Verified | In-app Chromium; `loaded: true`, dims 0.56 × 0.35 × 1.75 m |
| `<model-viewer>` offers AR on Android | ✅ Verified (emulated) | Chromium with Android UA: `canActivateAR: true`, AR button shown. This only checks feature detection; it does not launch Scene Viewer |
| iOS Safari hands off to AR Quick Look from the page | ✅ Verified up to the handoff | iOS 26.1 Simulator (iPhone 16e): tapping "View in your room" shows Apple's **"View in AR?"** prompt, then opens Quick Look |
| iOS: opening the `.usdz` URL directly (what the app's `Linking.openURL` does) | ✅ Verified up to the handoff | Simulator Safari shows **"View 3D Object?"** and opens Quick Look, *when the server sends `model/vnd.usdz+zip`* |
| Quick Look actually renders the patient in 3D / AR | ❌ Not verifiable here | The Simulator shows only a USDZ file icon (no RealityKit / ARKit camera). **Needs a real iPhone** |
| Android Scene Viewer launches and places the patient | ❌ Not verified | No ARCore-capable emulator with the Google app was set up within the timebox. **Needs a real Android phone** |
| App screen (`ar-spike.tsx`) | ⚠️ Typecheck + lint only | `tsc --noEmit` and `eslint` pass. The screen was not run: that needs a dev build, and dev/EAS builds were out of scope |
| SFSafariViewController (`WebBrowser.openBrowserAsync`) hands `.usdz` to Quick Look | ❌ Not verified | Offered as a second button for the device test |
| Android `Linking.openURL` with `https://arvr.google.com/scene-viewer/...` opens Scene Viewer rather than the browser | ❌ Not verified | The `intent://` form is a second button for the device test |

**Hosting requirement found during verification:** the server must send `model/vnd.usdz+zip` for `.usdz` (and should send `model/gltf-binary` for `.glb`). With Python's default `application/octet-stream`, Quick Look opened but showed "Zero KB". Any production host (Next.js `public/`, CDN, R2) needs these MIME types configured. For `public/ar-spike/` they are set in `next.config.ts`; `next dev` returns `model/vnd.usdz+zip` and `model/gltf-binary` (checked locally).

## iPhone vs Android

| | iPhone (AR Quick Look) | Android (Scene Viewer) |
|---|---|---|
| Format | USDZ (or `.reality`) | glTF / GLB |
| Native module needed | No; Safari / system Quick Look | No; Google app (`com.google.android.googlequicksearchbox`) |
| Device coverage | Quick Look AR needs an A9 chip or newer (iPhone 6s and later). The app's minimum is iOS 15.1, which already requires an A9 or newer, so **every iPhone that can install Imedica can use Quick Look AR** | Needs an **ARCore-certified device** with *Google Play Services for AR*. Many budget Android phones aren't certified; on those, Scene Viewer falls back to a 3D-only view (no camera). The app's minSdk is 24 (Android 7.0), the same floor as ARCore. Not available on phones without Google services (e.g. Huawei) |
| Real-world scale | `#allowsContentScaling=0` locks scale | `resizable=false` locks scale |
| Floor placement | Yes, automatic | Yes, automatic |
| Back to the app | User closes Quick Look and returns to Safari or the app | User closes Scene Viewer and returns |
| Custom UI inside AR | One banner with a call-to-action button (fires a DOM event in Safari only, not to a native app) | Title, a link and a sound; no buttons |
| Interaction | Look, walk around. With a `.reality` file built in Reality Composer, simple tap triggers (show/hide/animate) are possible, **iOS only, nothing reported back** | Look, walk around. None |

## Limits of the built-in viewers (the important part)

- **No in-AR decisions and no scoring.** The viewer is a separate system app. The scenario engine can't see what the user looks at or taps, and there's no callback with results. A decision has to happen *after* AR, back in the app ("You've looked at the casualty: what's your first action?").
- **No live state.** Vitals, deterioration over time, and the model reacting to treatment can't be driven from the app. Only pre-baked animations play.
- **Platform split.** Two formats, two pipelines, two device-coverage stories, and Android coverage is the weak side.
- **Network dependency.** Models are fetched by URL at open time (0.5 MB for this placeholder; a realistic textured patient is likely several MB).
- **UX friction on iOS.** Safari asks "View 3D Object?" / "View in AR?" before opening.

Even so, this is a real product feature: *"look at the scene before you act"* is cheap to add to a scenario intro and costs no App Store risk.

## Full in-app AR option: ViroReact (docs only, not integrated)

| Question | Finding |
|---|---|
| Package | `@reactvision/react-viro`, MIT, github.com/ReactVision/viro (~1.8k stars) |
| Expo 57 / RN 0.86 | **Yes.** Latest release v3.1.0 (2026-11-08) declares peers `expo >=57 <58` and `react-native >=0.86 <0.87`. The official `expo-starter-kit-typescript` pins `expo ^57.0.26` and `react-native 0.86.3`, the same as Imedica |
| New Architecture | RN 0.86 runs only on the New Architecture, so the current version has to support it. Open issue #593 ("Fabric unmount crash fix") shows Fabric-specific crash work is still in progress |
| Maintenance | Active: 12 releases since 2026-06-28 (v2.57.1 → v3.1.0), major v3 on 2026-09-20, last push today. Four main contributors |
| Expo Go | No. Needs a development build plus the config plugin (camera permission, ARCore metadata). **Changes the native binary, so it needs a new App Store / Play submission** |
| iOS Simulator | Builds and runs from v3.1.0 (simulator slice in the xcframework); AR itself still needs a device |
| What it adds | Interactive AR in the app's own React tree: tap targets on body regions (`onClick` on nodes), place the patient by plane detection, drive model state from scenario state, and **send each tap and decision straight into the existing scoring engine**. Also opens Quest / Vision Pro / web later |
| Risks seen in the tracker | Android camera/ARCore problems on recent Samsung devices (#568 A56/Android 16, #513 A54, #499 S24, all open); a camera crash on Android (#597); multi-skin GLB rigs lose joint rotations (#599), which matters for rigged human models. v3.1.0 adds a usage telemetry ping per navigator mount (turn off with `telemetry: false`), which must be checked against the privacy labels |

**Assessment:** viable for a v2 "interactive casualty", not for a quick win. Expect real-device QA on Samsung, a privacy-label review, and a separate store submission. Don't start this while iOS build 5 is in review.

## Content cost (the real cost)

The code is cheap. What costs money is the patients:

- **A clinically credible model** (realistic adult, clothing that can be cut away, visible injuries such as a femur deformity, an open wound, burns, cyanosis, a JVD/trachea cue) is custom 3D work. A stock base mesh plus injury sculpting and texturing: rough guess **1–3 weeks of a 3D artist per casualty archetype**, more for animated presentations (agonal breathing, seizure). This is an estimate, not a quote.
- **Each injury variant** is extra texture/geometry work and has to be produced in two formats (pipeline exists).
- **Physician review** of every visual (wound appearance, skin colour, posture) before release, following the same standard as the written scenarios. Budget a physician round per model, plus re-review on each revision.
- **Asset size and delivery**: textured models will be several MB each. Host them on a CDN with the right MIME types and cache headers.
- **Licensing**: CC0 bases (Quaternius, Poly Haven) are safe; Sketchfab models vary per model and need checking one by one.

## Recommended MVP and effort

**MVP: "Look before you act" (built-in viewers, no native change).**
On a scenario's intro card, add a "View the patient in your room" button for scenarios that have a model. It opens Quick Look / Scene Viewer through `Linking.openURL`. When the user returns, the scenario continues as today and the existing engine does the scoring. Models are hosted on the web app/CDN with correct MIME types.

| Task | Owner | Estimate |
|---|---|---|
| Model hosting + MIME + cache headers on the web side (or R2/CDN) | backend-developer | 0.5–1 day |
| Optional `arModel` field on scenarios (GLB + USDZ URLs) + API | database-engineer / backend-developer | 1 day |
| App button on scenario intro + platform switch + "AR not supported" fallback | ios-developer / android-developer | 1–2 days |
| Web scenario page: `<model-viewer>` embed (also covers desktop) | frontend-developer | 0.5–1 day |
| Real-device QA matrix (2 iPhones, 3 Androids incl. a non-ARCore one) | qa-lead | 1 day |
| **Engineering total** | | **≈ 4–6 days** (estimate) |
| First real casualty model + physician review | 3D artist + physician | **1–3 weeks** (dominant cost) |

This ships in a normal app update (JS + a button, no new native module). It must still go in a build **after** 1.0.0 (5) clears review.

**Later (v2): interactive AR with ViroReact.** Tap-to-assess body regions, decisions inside AR, scored by the existing engine. Rough estimate **3–5 weeks** of engineering for one scenario end to end, plus the content cost above, plus a store submission. Revisit after the MVP shows users actually open AR.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Android coverage gaps (non-ARCore phones get 3D only) | High | Show the 3D view anyway; label it "AR not available on this phone" |
| Wrong MIME type on host breaks iOS Quick Look | Medium | Set `model/vnd.usdz+zip` and test on device before release (found in this spike) |
| Clinical inaccuracy in visuals | Medium | Physician sign-off per model, same as scenarios |
| App Store: AR adds nothing native in the MVP, so no new review surface. ViroReact adds camera permission and telemetry | Low (MVP) / Medium (Viro) | Keep the MVP JS-only; do the privacy-label review before Viro |
| Model size on mobile data | Medium | Keep each model under 5 MB; Draco/meshopt for GLB; compress USDZ textures |
| Users skip AR (novelty) | Unknown | Measure open rate on the MVP before investing in Viro |
| Spike branch merged by mistake (deep-linkable throwaway screen) | Low | Only the web page ships; the spike branch stays local |
| Test page left on the live site | Medium | Delete `public/ar-spike/` and its three header rules once the device test is done or the MVP replaces it |

## 5-minute real-device checklist for Farjad

Test link (once deployed): **https://www.imedica.tech/ar-spike/index.html**. You need an iPhone, and ideally any Android phone.

**iPhone (Safari):**
1. Open the test link in **Safari** (not an in-app browser). The lying figure should appear and rotate with a finger. ☐
2. Tap **View in your room** → tap **View in AR** if asked. ☐
3. Point the camera at the floor and move the phone slowly until the figure appears on the floor. ☐
4. Walk around it: about 1.75 m long, lying on its back, red disc on its right thigh; pinching should *not* resize it. ☐
5. Close and try the second link, **iPhone: open AR Quick Look directly**. Does it behave the same? ☐
6. If anything fails, screenshot the **DIAGNOSTICS** box at the bottom of the page. ☐

**Android (Chrome):**
1. Open the test link in **Chrome**. Is the figure visible? ☐
2. Tap **View in your room**. Does Google Scene Viewer open (or ask to install *Google Play Services for AR*)? ☐
3. Point at the floor until it's placed. Real size? Is resize blocked? ☐
4. Go back and try **Android: open Scene Viewer directly**. ☐
5. Screenshot the DIAGNOSTICS box and note the phone model. ☐

Record for each phone: model, OS version, ✅/❌ per step, and how it felt (lighting, tracking, scale). That's enough to decide on the MVP.

# Physician review sheet: catastrophic limb haemorrhage casualty, v1 (revision 1.1)

**Status: DRAFT, not reviewed. Not for learners.** Not attached to the scenario. A physician attaches it in the editor's **3D model** tab, and a second physician approves it (two-person rule). Every clinical item below is a draft until both reviewers sign.

- Scenario: `catastrophic-limb-hemorrhage` (`src/server/scenarios/library/hemorrhage.ts`), `arrival` state: "On his back in the wood chips, a soaked towel on his **left** thigh with blood pulsing through it. Pale and talking, but slowly." Skin: "Pale, cold, clammy".
- Files under review: `public/models/catastrophic-limb-hemorrhage/v1/patient.usdz` (iPhone) and `patient.glb` (Android). Git SHA: ______ (fill in from the PR's merge commit).
- Spec: `docs/product/ar-model-brief.md` §2 (clinical) and §4 (this checklist), branch `feat/ar-model-brief`.

## Revision 1.1 (PM review, 2026-11-08): each change needs physician confirmation

| # | Change | Why | Physician confirms |
|---|---|---|---|
| 1 | Towel: smaller (24 × 20 cm), crumpled and folded, held over the **front** of the thigh; darkest at the centre, light-blue unsoaked cloth at the edges | v1 read as a red wrap/skirt around the thigh | ☐ Reads as a towel pressed on a wound and failing |
| 2 | Left hand pressing on the towel, fingers spread, blood on the fingers and over the towel between them | "Blood through the fingers" cue; v1 hand floated beside the towel | ☐ Plausible for a conscious patient at `arrival` ☐ doesn't suggest that pressure alone is controlling it |
| 3 | Pallor stronger (−52% saturation, slight cool shift, paler lips) and a **sweat sheen** on face, neck and hands (glossier skin with fine droplet breakup) | v1 looked calm and well-perfused | ☐ Pale and clammy, **not grey**. The brief (§2) keeps grey for the `shock` state. The PM asked for "a greyish tone"; we did **not** add grey. Please decide |
| 4 | Trousers: darker, wet runs down the back of the left thigh, on the inner and outer side, to the floor | Shows the pool comes from the leg | ☐ Plausible flow for a supine patient |
| 5 | Boots: foot skin pulled 1 cm inside the boot (v1 showed skin through the boot upper, which looked like sandal holes) | Closed footwear | ☐ Fine (they're closed black leather boots, not steel-toe work boots; a custom boot is possible later) |

Trade-off to judge on the phone: under neutral daylight the skin now reads very pale (hands almost white); under a warm lamp it still reads only mildly pale. Pallor that holds in every light would need a different technique (e.g. the app warning about lighting), not just a paler texture.

## How to review (10 minutes)

1. On a real phone, open the scenario's "Look before you act" button, or open the file directly:
   iPhone: `https://<staging>/models/catastrophic-limb-hemorrhage/v1/patient.usdz` in Safari; Android: Scene Viewer with `patient.glb`.
2. Place him on the floor. Stand **1.5 m** away, at standing eye height. Count five seconds, then answer section A **before** walking closer.
3. Repeat in three lights: daylight, a warm lamp, cool overhead light.
4. Then walk around him and answer B–D.

The renders in `renders/` show the same views (from the shipped GLB, neutral and warm light), for a first look before the phone test. They are not a substitute for it.

| Render | What it shows |
|---|---|
| `renders/ar_left_3q_neutral.jpg`, `_warm.jpg` | Standing 1.5 m from his left side, 1.6 m eye height (main view) |
| `renders/ar_feet_*.jpg`, `ar_right_3q_*.jpg`, `ar_head_*.jpg` | From the feet, from his right side, from the head end |
| `renders/top_*.jpg` | Straight down: pool size and position |
| `renders/thigh_close_*.jpg` | Dressing, trouser soak, left hand (about 1 m) |
| `renders/hand_close_*.jpg` | Hand pressing the towel, blood through the fingers |
| `renders/inner_thigh_*.jpg` | From his right/feet: wet run down the inner thigh to the floor |
| `renders/feet_close_*.jpg` | Boots |
| `renders/face_close_*.jpg` | Face: pallor, eyes open |

## The cues on this model, and what to check

Each value is a parameter in `build_stage2.py` (`CLIN`) or the named file; a change is a one-line edit and a rebuild (`build_all.sh`), then **both** reviewers look again.

| # | Cue (brief §2) | What we built | Check | Knob |
|---|---|---|---|---|
| 1 | Adult male, ~42, average build, 1.75 m | MakeHuman male, age 42, slightly above average weight; length 1.75 m | Real size on the floor; plausible build | `AGE_YEARS`, `HEIGHT_M` (build.py) |
| 2 | Supine, eyes open, head slightly turned, arms by the sides | Supine; head turned ~18° to his left; eyes open; mouth neutral, lips slightly parted; right arm by the side; **left hand pressing the towel** (v1.1) | Looks conscious and talking, not limp or dead | pose block in `build.py` |
| 3 | **Bleeding from the LEFT thigh** | Wound under the towel on the anterior-lateral **left** thigh, ~42% of the way from hip to knee | Side is right (patient's left); level is right | `wound_t`, `wound_dir` |
| 4 | **Dressing saturated / failing** | Crumpled light-blue hand towel (24 × 20 cm, cloth-simulated) on the front of the thigh, dark wet red at the centre, unsoaked edges | Reads as "soaked, not working" from 1.5 m | towel colour ramp, `sat` radius (`build_stage3.py`) |
| 5 | Blood on the body | Left trouser leg soaked from the wound to the knee; wet runs behind the thigh, inner and outer side, to the floor; left fingers bloodied | Plausible spread; not too much, not too little | `trouser_soak_down`, `trouser_soak_up`; hand mask |
| 6 | **Blood on the floor reads as life-threatening** | Opaque pool ~50 × 40 cm beside and under the left thigh, glossy, slightly domed (≤ 2.5 mm), five small satellite drops | **You set the size.** The brief proposes 40–60 cm; is that right for "catastrophic" at this moment? | `pool_size` |
| 7 | Pale, not grey (grey = `shock` state) | Skin desaturated 52%, lightened, slight cool shift; lips paler; sweat sheen on face, neck, hands | Pale in all three lights; **not grey**. Known weak spot: under warm lamp light the pallor fades (see `face_close_warm.jpg`) | `pallor_desat`, `pallor_lift`, `pallor_cool`, `lip_desat`, `sweat_roughness` |
| 8 | Clothing | Dark olive long-sleeve fleece/shirt, jeans (wet-darkened), black boots. No chainsaw chaps | Plausible for a man cutting wood at 4 °C | `build_stage2.py` shirt colour; clothing choice in `build.py` |
| 9 | Gore limit | No visible wound, bone, muscle or spray. The wound mesh exists under the clothes for v2 cut-away only | OK for a first-year student and an App Store screenshot | — |
| 10 | Things the scenario does **not** have | No fracture, no head injury, no amputation, no tourniquet, no chainsaw prop | Nothing suggests an extra finding | — |

## Checklist (brief §4, both reviewers, independently)

**Setup:** version (git SHA / file hash) ______. Phone and OS ______. Room light: ☐ daylight ☐ warm lamp ☐ cool overhead. Distance: 1–2 m.

**A. Readability at 1–2 m**
- ☐ Reads as a real adult lying supine, at real size
- ☐ Bleeding is clearly from the **left** thigh
- ☐ Dressing visibly saturated / failing
- ☐ Blood volume on the floor reads as life-threatening (not too little, not exaggerated)
- ☐ Skin reads as pale/unwell under all three lights, and not grey
- ☐ Conscious-looking (eyes open)

**B. Clinical accuracy**
- ☐ Wound location plausible for a chainsaw injury (size/appearance: hidden under the towel by design)
- ☐ Posture plausible for this patient at this moment
- ☐ Nothing suggests findings the scenario doesn't have (fracture, head injury, amputation)
- ☐ Matches the scenario text and `arrival` vitals (pale, cold, clammy; GCS 14)
- ☐ Consistent with the scenario's sources (Ontario BLS PCS — Trauma; Field Trauma Triage Guidelines)

**C. Teaching safety**
- ☐ The visual doesn't steer toward a wrong action (e.g. doesn't look as if pressure alone would do)
- ☐ Gore level fits learners; nothing gratuitous
- ☐ Nothing misleading out of context (App Store screenshot, social share)

**D. Representation**
- ☐ Skin tone, body type and clothing chosen deliberately; variants planned (v1 is one light-skinned male; the same pipeline takes other MakeHuman CC0 skins)

**Sign-off:** Reviewer A ______ date ______ ☐ approve ☐ changes. Reviewer B ______ date ______ ☐ approve ☐ changes. Changes requested → new version folder (`v2/`) → **both** re-review.

## Questions we'd like answered

1. Pool size: keep ~50 × 40 cm, or larger/smaller?
2. Left hand pressing the towel (v1.1): keep, or beside the body?
3. Is the warm-light pallor acceptable, or should the skin go paler (risk: grey under daylight)?
4. Jeans or work trousers? (Jeans are what the CC0 library has; work trousers would need a custom texture.)

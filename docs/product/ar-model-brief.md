# AR model brief: the first clinically credible 3D casualty

Status: draft for Farjad and the physician reviewers, 2026-11-08.
Owner: tech-lead session. Context: [`ar-spike.md`](ar-spike.md) (verdict: phone-only AR works through AR Quick Look and Scene Viewer; content is the real cost).
Feature: **"Look before you act"**. A button on the scenario intro opens the casualty at real size on the user's floor (iOS AR Quick Look, `.usdz`; Android Scene Viewer, `.glb`). The user walks around it, closes the viewer, and the scenario continues in the app. In v2, body regions become tappable inside the app with ViroReact.

This document is what we hand to whoever builds the model: an in-house generalist, a freelancer or a vendor. Every clinical statement in it is a **draft to be confirmed by a physician**. None of it is clinical fact until it has been signed off.

---

## 1. Decision: the first casualty

**Recommendation: `catastrophic-limb-hemorrhage`** ("Catastrophic bleeding from a chainsaw injury", `src/server/scenarios/library/hemorrhage.ts`).

| Candidate (slug) | Visual teaching value | Clinical risk if the visual is wrong | Modelling cost | Verdict |
|---|---|---|---|---|
| **Catastrophic limb haemorrhage** (`catastrophic-limb-hemorrhage`) | **Highest.** The scenario's first scored decision is a visual one: the `arrival` → `tq` rule (+30, `within: 90`, required) rewards recognising pulsatile bleeding through a dressing *before* the ABCs, and `survey` from `arrival` is HARMFUL. "Look before you act" is literally the learning goal | Medium. The key cue is volume and where the bleeding is (soaked towel, blood through the fingers, pooling), not fine wound anatomy, because the towel covers the wound. Risks: too little blood, so learners under-call it; or gore that reads as entertainment | **Lowest of the five.** Adult male, supine (the spike pipeline already lays a figure supine on the floor), one localised finding, a towel, a blood pool. Static pose, no animation needed for v1 | **First** |
| Adult VF arrest (`adult-bls-cardiac-arrest-vf`) | Low as a still: grey, supine, unresponsive. The real cue (agonal "snoring" gasps) needs animation and sound, which Quick Look can't drive from the scenario | Medium: a static body can't show gasping vs not breathing, the exact trap the scenario teaches ("Gasping is not breathing") | Low, because it **reuses the haemorrhage base mesh** (adult male, supine) with a skin-tone variant | **Second**: cheap once #1 exists |
| Inferior STEMI (`inferior-stemi-rv-involvement`) | Medium. Pallor and diaphoresis are real cues, but subtle | **High.** Pale/grey skin and sweat depend on the room's lighting in AR; a living-room lamp can make a "pale" model look healthy or ill at random. Teaching the wrong look is worse than none | Medium: seated against kitchen cupboards (needs posing and a contact surface), sweat sheen in the material | Later, after lighting tests |
| Anaphylaxis (`anaphylaxis-wasp-sting`) | Medium: urticaria and lip swelling are visible, but the dangerous cue is stridor (audio) | Medium-high: hives at 1–2 m are a fine texture detail that phone AR renders poorly; lip angioedema is easy to under- or over-draw | Medium-high: a new adult female base, seated on a bench, detailed skin textures | Later |
| Paediatric arrest / drowning (`paediatric-bls-arrest-two-rescuers`) | High emotional weight; cyanosis and mottling are the cues | **Highest.** Colour cues (cyanosis, mottling) are lighting-dependent, and a dead child is the most sensitive image we could ship. Needs the most careful physician and ethics review | High: separate paediatric base mesh, proportions, skin | Last |

**Why haemorrhage wins:** the one thing the learner must see (a lot of blood coming from the leg, through a dressing) is big, easy to read at 1–2 m in any lighting, and maps one-to-one to the scenario's first and most heavily weighted decision. It's also the cheapest to build and gives us the adult male base for the VF arrest.

**Scenario facts the model must match** (from `hemorrhage.ts`; the sources are the scenario's own, *Ontario BLS Patient Care Standards — Trauma* and *Field Trauma Triage Guidelines*, status `IN_REVIEW`):
- 42-year-old male, chainsaw injury, rural property.
- "On his back in the wood chips, a soaked towel on his **left** thigh with blood pulsing through it. Pale and talking, but slowly. It's 4°C and drizzling."
- Skin at `arrival`: "Pale, cold, clammy".

> ⚠️ The spike placeholder put its red marker on the patient's **right** thigh. The scenario says **left**. The proof of concept in this PR fixes that (§6), and every later model must follow the scenario.

The scenario itself is still `IN_REVIEW`. The model's clinical sign-off should happen in the same review round, or after it.

---

## 2. Clinical visual spec (all items: *to be confirmed by physician*)

Draft for the `arrival` state only. One model, one state: the AR view is "what you see when you walk up". It does not change with the user's actions.

| Area | Draft spec | Why it matters to the scenario | Status |
|---|---|---|---|
| **Body** | Adult male, ~42, average build, 1.75 m. Neutral, non-stylised proportions | Credibility; matches dispatch | To be confirmed by physician |
| **Posture** | Supine, head slightly turned toward the viewer, eyes open, legs straight, arms by the sides. Left knee may be slightly flexed. Optional (v1.1): right hand pressing the towel | "On his back"; he's talking, so not limp | To be confirmed by physician |
| **Skin** | Pale (face, lips, hands), with a cool, slightly moist sheen on the face. Not grey: grey is the `shock` state, not `arrival` | "Pale, cold, clammy". Must not drift toward the `shock` look ("Grey, cold") | To be confirmed by physician |
| **Wound** | Hidden under the towel. If any edge shows: an irregular laceration, mid/upper anterior-lateral left thigh, through the trousers. **No** visible bone or deformity unless the physician wants it (the scenario does not describe a fracture) | The cue is the bleeding, not the wound's anatomy. Hiding the wound lowers both clinical risk and gore | To be confirmed by physician |
| **Towel** | Hand towel folded over the wound, **saturated**: dark red through most of it, glossy wet areas, drips at the edges | "A soaked towel… blood pulsing through it": the dressing has failed, which is the trigger for the tourniquet | To be confirmed by physician |
| **Blood on the body** | Left trouser leg darkened from the wound down to the knee and around the back of the thigh; blood on the right hand if it's pressing | Shows the volume | To be confirmed by physician |
| **Blood on the floor** | A pool under and beside the left thigh, roughly 40–60 cm across, irregular, part of the model (a flat mesh at y ≈ 2 mm, opaque) | Biggest single "this is catastrophic" cue at 1–2 m. The size has to read as life-threatening without exaggeration; **the physician sets the size** | To be confirmed by physician |
| **Pulsation** | Not shown in v1 (static model). Optional v1.1: a short looping animation of the towel's wet area spreading. Pulsatile flow is taught in the narrative ("blood pulsing through it") | A static model can't show pulsing. Don't fake it with transparency or texture swaps (see §3) | To be confirmed by physician |
| **Clothing** | Work clothes: long-sleeve shirt or fleece, work trousers, boots. **Chainsaw chaps: no** (if he'd been wearing them, the injury is less plausible; ask the reviewer). Wet-looking (drizzle) | Realism; "remove wet clothing" is the `warm` action | To be confirmed by physician |
| **Cut-away readiness** | Trousers and shirt are **separate meshes** (`clothing_trousers`, `clothing_shirt`) over a full skinned body, so v2 can hide clothing to expose the thigh or chest. Skin under the clothing must be modelled and textured, including the wound | v2 "expose and assess"; tourniquet placement needs the thigh visible | Technical requirement |
| **Environment** | None. No wood chips, no rain, no chainsaw: the model sits on the user's own floor. A chainsaw prop is optional and should be a separate node (`prop_chainsaw`) so it can be removed | Keeps size down; the narrative sets the scene | Product decision |
| **Gore limit** | Realistic but not gratuitous: no exposed muscle, bone or arterial spray. The image should be fine for a first-year paramedic student and in an App Store screenshot | App Store 1.1 (objectionable content) and learner wellbeing | To be confirmed by physician + Farjad |

**What must be readable from 1–2 m in a typical living room (acceptance test):**
1. He is a person lying on his back, at real size.
2. The bleeding is coming from the **left thigh**.
3. The dressing is soaked; it isn't working.
4. There is a lot of blood on the floor: this is life-threatening.
5. He looks pale (unwell), but is conscious (eyes open).

If a reviewer standing 1.5 m away on a real phone can't call all five within ~5 seconds, the model fails, however good it looks up close.

---

## 3. Technical spec (mandatory, so v2 needs no rework)

### 3.1 Units, axes, origin
- **Metres**, real-world scale. Adult total length lying = 1.75 m ± 2 cm.
- **Y-up** in GLB and USDZ (Blender's exporters do this from a Z-up scene).
- **Origin on the floor**: the lowest point of the model (including the blood pool) sits at y = 0. Origin centred under the body, so AR places it where the user taps.
- One root node named `casualty`. No scale or rotation on the root in the exported file (apply transforms).
- Patient's left / right are **anatomical** (the patient's own). In the source `.blend`: supine, head toward +Y, face toward +Z, so the patient's left is +X.

### 3.2 Named nodes (the contract with the app and the backend)

Every body region and every finding is a **separate mesh node with a stable name**. That name is the key the backend's `ScenarioArModel.hotspots[].node` points at. Renaming a node later is a breaking change.

**Naming rules**
- Lowercase `snake_case`, ASCII, `^[a-z][a-z0-9_]*$`. No spaces, dots or Blender's `.001` suffixes (they become `_001` in USD and break the match).
- Body region: `<region>[_<side>]`, e.g. `thigh_left`.
- Finding: `<finding>_<region>[_<side>]`, e.g. `wound_thigh_left`, `blood_pool`, `dressing_thigh_left`.
- Clothing: `clothing_<item>`; props: `prop_<item>`.
- Side is always `left` / `right` = the **patient's** side.
- Mesh and object share the same name (USD writes `Xform "x"` → `Mesh "x"`; the glTF node name is the object name).

**Body regions (every casualty model has all of these)**

| Node | Covers |
|---|---|
| `head` | Skull, face, eyes, mouth |
| `airway` | Neck, anterior throat (airway / trachea / JVD cues later) |
| `chest` | Thorax, front and back |
| `abdomen` | Abdomen to the iliac crests |
| `pelvis` | Pelvis, groin, buttocks |
| `arm_left`, `arm_right` | Shoulder to fingertips (split into `upper_arm_*` / `forearm_*` / `hand_*` only if a scenario needs it) |
| `thigh_left`, `thigh_right` | Hip joint to knee |
| `lower_leg_left`, `lower_leg_right` | Knee to ankle |
| `foot_left`, `foot_right` | Ankle down |

**Findings for the haemorrhage casualty**

| Node | What |
|---|---|
| `wound_thigh_left` | The laceration (on the skin, under the dressing and trousers) |
| `dressing_thigh_left` | The soaked towel |
| `blood_pool` | Floor pool |
| `blood_trousers_left` | Optional: if the blood soak is geometry, not just the trouser texture |
| `clothing_shirt`, `clothing_trousers`, `clothing_boots` | Removable clothing |

The proof of concept (§6) already ships with the 13 body-region nodes and `wound_thigh_left`, and checks the names survive both exporters.

### 3.3 Rig: single skeleton, single skin, or none
- **MVP export: no rig.** Bake the pose into static meshes (what the spike pipeline does). Static meshes are the most portable input for Quick Look and Scene Viewer, and the pose never changes in the MVP.
- **Source `.blend` keeps the rig**: **one armature**, and every body and clothing mesh skinned to that one armature. In glTF this exports as **one `skin`** shared by all part meshes. Never one armature per part, and never a second rig for clothing.
- Reason: ViroReact (the v2 path) has an open bug where **multi-skin GLB rigs lose joint rotations** (ReactVision/viro #599). One skeleton plus one skin avoids it. Splitting a skinned body into region meshes doesn't add skins, as long as they all point at the same armature.
- Bone names: a standard humanoid set (Mixamo / Rigify-style, `spine`, `upper_arm.L` …) so animations can be retargeted later.
- Shape keys: allowed in the source (for example chest rise), not exported in the MVP.

### 3.4 Budget and materials (mobile)

| Item | Limit | Note |
|---|---|---|
| File size | **< 5 MB per format** (target 3 MB) | Fetched on mobile data at open time |
| Triangles | **≤ 60k** total (body ~35k, clothing ~15k, findings + pool ~10k) | Quick Look and Scene Viewer handle more, but low-end Android struggles |
| Textures | **2048² max** for body; 1024² for clothing and findings; ≤ 6 texture sets total | Base colour, normal, ORM (occlusion/roughness/metallic) |
| GLB compression | **Draco or meshopt** geometry; **KTX2/Basis** textures, or JPEG for base colour and PNG only where needed | Scene Viewer supports Draco; check KTX2 on Scene Viewer before relying on it, with JPEG/PNG as the fallback |
| USDZ textures | JPEG for base colour, PNG for normal/ORM, sized as above | USDZ has no Draco; keep the triangle budget |
| Materials | **PBR metallic-roughness** only: glTF core + `UsdPreviewSurface`. Wet blood = low roughness, not a special shader | Quick Look supports only `UsdPreviewSurface` |
| Transparency | **None.** No alpha-blended blood, sweat, hair cards or decals. Use opaque geometry and texture. Alpha **mask** (cutout) only if unavoidable, and test it in Quick Look | Alpha blending sorts badly and renders inconsistently in Quick Look and Scene Viewer |
| Lighting | No baked lighting in base colour (the AR viewer lights it); a light AO bake is fine | Pallor has to survive the user's room light (test in warm and cold light) |
| Animation | None in v1 | Each animation is a separate content task |

### 3.5 Deliverables (per casualty)

| File | Requirement |
|---|---|
| `<slug>.blend` | Source: rig, separate named meshes, clothing, findings, materials with packed or relative textures. Blender 5.2 LTS |
| `<slug>.glb` | Static pose, named nodes, < 5 MB, opens in `<model-viewer>` and the glTF Validator with no errors |
| `<slug>.usdz` | Same named prims, < 5 MB, **passes `usdchecker --arkit`** |
| `<slug>-poster.png` | 1200×900, transparent background, three-quarter view from standing height; used as the intro card image and `<model-viewer>` poster |
| `<slug>-hotspots.json` | One entry per tappable node: `{ node, label, region, action?, anchor, radius }` (format in §5). Every `node` must exist in both files |
| `LICENSE.md` | Licence of every input (base mesh, textures, HDRIs, scan data), the artist's IP assignment, and a statement that no AI-generated or scraped content is included (or which parts are, and under what terms) |
| `REVIEW.md` | Filled-in physician checklist (§4) with names, dates and the version reviewed |

Hosting: served with `model/vnd.usdz+zip` and `model/gltf-binary` (found in the spike: the wrong MIME type makes Quick Look show "Zero KB").

### 3.6 Pipeline
The spike's headless Blender pipeline (`prototypes/ar-spike/pipeline/build_patient.py`, on the unmerged branch `myca/ar-spike-b6e555`) still applies for **pose → bake → scale → floor → GLB + USDZ export**. The proof of concept adds `prototypes/ar-model/pipeline/build_regions.py`, which splits a mesh into the named region nodes, writes `hotspots.json` and exports both formats with the names intact.

For a commissioned model, the artist delivers the `.blend` with the parts already separate and named, and the pipeline's job shrinks to: validate names against this spec → bake pose → export → `usdchecker --arkit` → size check. Add those checks as a script before the first real model lands.

---

## 4. Physician review checklist

Mirrors the scenario review: **two people, independent**. Reviewer A (author-side clinician) and Reviewer B (independent physician) each fill it in on a **real phone in AR**, not just a screenshot. A model is approved only if both sign every line, and it is re-reviewed after any change to a clinical item.

**Setup:** model version (git SHA / file hash) ______. Phone and OS ______. Room lighting: ☐ daylight ☐ warm lamp ☐ cool overhead. Distance: 1–2 m.

**A. Readability at 1–2 m** (§2's acceptance test)
- ☐ Reads as a real adult lying supine, at real size
- ☐ Bleeding is clearly from the **left** thigh
- ☐ Dressing visibly saturated / failing
- ☐ Blood volume on the floor reads as life-threatening (not too little, not exaggerated)
- ☐ Skin reads as pale/unwell under all three lighting conditions, and not grey (grey = `shock`)
- ☐ Conscious-looking (eyes open)

**B. Clinical accuracy**
- ☐ Wound location, size and appearance plausible for a chainsaw injury
- ☐ Posture plausible for this patient at this moment
- ☐ Nothing on the model suggests findings the scenario doesn't have (fracture, head injury, amputation)
- ☐ Matches the scenario text and vitals at `arrival` (pale, cold, clammy; GCS 14)
- ☐ Consistent with the scenario's sources (Ontario BLS PCS — Trauma; Field Trauma Triage Guidelines)

**C. Teaching safety**
- ☐ The visual doesn't steer toward a wrong action (e.g. looks like it would stop with pressure alone)
- ☐ Gore level fits learners; nothing gratuitous
- ☐ Nothing that would mislead if seen out of context (App Store screenshot, social share)

**D. Representation**
- ☐ Skin tone, body type and clothing chosen deliberately; plan for variants recorded

**Sign-off:** Reviewer A ______ date ______ ☐ approve ☐ changes. Reviewer B ______ date ______ ☐ approve ☐ changes. Changes requested → new version → **both** re-review.

---

## 5. Hotspot plan (v2, ViroReact)

In the MVP nothing is tappable (Quick Look and Scene Viewer can't report taps). The hotspot list is still delivered now, so the v2 work needs no change to the model.

**Data shape** (aligned with the backend's `ScenarioArModel.hotspots: { node, label, region, action? }[]`; `anchor` and `radius` are proposed additions):

```json
{ "node": "wound_thigh_left", "label": "Bleeding wound, left thigh", "region": "leg",
  "action": "pressure", "anchor": [0.087, 0.234, 0.167], "radius": 0.055 }
```

- `node`: exact mesh node name (§3.2).
- `label`: learner-facing text.
- `region`: coarse region for grouping and analytics: `head | airway | chest | abdomen | pelvis | arm | leg`.
- `action` (optional): a key from the scenario's `actions[]`. Tapping offers that action; without it, tapping only reveals an assessment finding.
- `anchor`, `radius` (proposed): node centre in model space (metres, Y-up) and a hit radius. **Why:** ViroReact's `onClick` fires on a `Viro3DObject` as a whole; per-sub-node hit testing on a GLB isn't something we've confirmed. The safe v2 plan is invisible tap targets (spheres/boxes) placed at these anchors over one model. Confirm against ViroReact before v2; `anchor` costs nothing to ship now and is generated by the pipeline.

**Haemorrhage scenario mapping** (action keys from `hemorrhage.ts`)

| Node | Label | Region | `action` | Taps lead to |
|---|---|---|---|---|
| `wound_thigh_left` / `dressing_thigh_left` | Bleeding wound, left thigh | leg | `pressure` | Direct pressure (ACCEPTABLE at `arrival`) |
| `thigh_left` | Left thigh, above the wound | leg | `tq` | Tourniquet high and tight (the CORRECT, required action) |
| `chest`, `abdomen`, `head` | — | chest / abdomen / head | — | Assessment findings only. Tapping the torso first, before the bleeding is controlled, maps to `survey` in analytics (HARMFUL at `arrival`) |
| `clothing_shirt`, `clothing_trousers` | Wet clothing | chest / leg | `warm` | Remove wet clothing, blankets |
| `arm_left` / `arm_right` | Arm (IV access) | arm | `fluid` | IV fluid bolus (SUBOPTIMAL, teaches the lethal triad) |
| `lower_leg_left` | Left lower leg | leg | `elevate` | Elevate the leg (SUBOPTIMAL) |
| `airway`, `pelvis`, others | — | — | — | Assessment only |

Transport actions (`trauma`, `nearest`) stay as buttons, not body hotspots.

Open question for v2 design: should a tap *perform* an action, or only *select* the region and then show the action list? Perform-on-tap is faster but makes misclicks scoreable. Recommendation: tap selects, then confirm, so the scoring engine only sees deliberate actions.

---

## 6. Proof of concept (option a, placeholder only)

**Built and committed in this PR**, in `prototypes/ar-model/`. **Not for learners. Not clinical content.**

- Input: the spike's placeholder (`public/ar-spike/models/placeholder-casualty.glb`), derived from Quaternius *Ultimate Modular Men* `Casual.glb`, **CC0-1.0** (licence confirmed on quaternius.com: "CC0", "free to use in personal and commercial projects").
- `pipeline/build_regions.py` splits the figure into the **13 body-region nodes** from §3.2 by face position, removes the old right-thigh marker, adds a deliberately non-photoreal **orange disc with a white ring** as `wound_thigh_left` on the **left** thigh, and writes `hotspots.json` with anchors.
- Output (`prototypes/ar-model/out/`):

| File | Size | Check |
|---|---|---|
| `poc-casualty-regions.glb` | 486 KB | 15 nodes: `casualty` + 14 named parts; 0 skins |
| `poc-casualty-regions.usdz` | 503 KB | `usdchecker --arkit` → Success; same 14 names as prims |
| `hotspots.json` | 3 KB | 14 entries, every `node` present in both files |
| `poc-casualty-regions-preview.png` | — | Poster render |
| `poc-casualty-regions-debug.png` | — | Top-down render, one colour per region, to check the splits and the left side |

Measured footprint: 0.56 × 0.35 × 1.75 m (x × y × length), floor at 0.

What it proves: the naming convention survives **both** exporters unchanged; region splitting and hotspot generation are scriptable; the left/right convention is right. What it doesn't prove: anything clinical, and it hasn't been opened on a phone (same pipeline and checks as the spike's file, which Farjad's iPhone opened).

Reproduce:
```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
  --python prototypes/ar-model/pipeline/build_regions.py -- \
  public/ar-spike/models/placeholder-casualty.glb prototypes/ar-model/out
```

Limits of the split: it uses straight cuts by position, so the shoulder seam is rough (part of the shoulder sits in `chest`). A real model should have the regions modelled as separate meshes by the artist, along natural seams.

---

## 7. Sourcing options (all figures are estimates, not quotes)

| | a) CC0 base mesh + in-house injury work | b) Commissioned freelance 3D artist | c) Paid medical / stock model | d) AI 3D generation |
|---|---|---|---|---|
| What | Realistic CC0 human (MakeHuman / MPFB core assets), then posing, clothing, wound, blood and textures done by us | Artist builds to this brief, usually on a CC0 base | Buy a realistic or "injured" human from TurboSquid / CGTrader / Sketchfab Store, then modify | Text/image-to-3D (Blender MCP `generate_3d`, Rodin, Tripo, Meshy) |
| Licence | **Clean.** MakeHuman core assets are CC0 ("free to do as you see fit with the asset or derivates", makehumancommunity.org). Check each non-core skin/clothing asset separately. Quaternius: CC0, but stylised low-poly, too cartoonish for this. Poly Haven: CC0, but has almost no human models | **Clean if the contract says so**: work-for-hire / full IP assignment to Ashavid Inc., and a list of every input asset with its licence | **Risky.** Standard "royalty-free" stock licences usually allow models embedded in an app, but often forbid distributing them in a form users can extract. Ours are **raw `.glb`/`.usdz` files at a public URL**, which is extraction by design. Needs the specific licence read and probably an extended/editorial licence. "Medical" models are mostly anatomy (organs, skeletons), not casualties | **Unclear.** Terms vary per provider and plan (some give commercial rights only on paid tiers); copyright in purely AI output is uncertain, and training-data provenance is unknown. Not something to put a physician's sign-off on |
| Quality | Body: good. Injury, blood, clothing: depends on who does it. We have no 3D artist in-house | **Highest control**: sculpted wound, proper topology, named parts, single rig to spec | Body: often high (scan-based). The injury is still custom work | Poor for anatomy: melted hands, merged clothing, no separate parts, no rig, messy topology. OK for a prop (towel, chainsaw) |
| Meets §3 (named parts, single skin) | Yes, with effort | Yes, if it's in the contract | Only after rework (re-split, re-rig) | **No**: one fused mesh |
| Cost | Base: $0. Labour: 60–120 h of someone learning sculpting and texturing | **≈ US$1,500–4,000** per casualty (≈ 40–80 h at $35–60/h for a mid-level character artist; senior realistic-character artists charge $60–100+/h). VF-arrest variant on the same base: ≈ $400–1,000 | Model $100–600 + licence upgrade + 20–40 h of rework | Credits only; then a full rebuild |
| Time | 3–6 weeks (learning curve) | **2–4 weeks** including two physician review rounds | 1–3 weeks, plus the licence question | Hours to generate; unusable as the casualty |
| Where | — | ArtStation (jobs / direct), Upwork (filter "realistic character", "medical"), Fiverr Pro; medical-sim studios for a higher-end quote | TurboSquid, CGTrader, Sketchfab Store | — |

### Recommendation: **(b) a commissioned freelance artist, building on a CC0 MakeHuman base that we specify**

- It's the only option that delivers §3 (named parts, one skin, cut-away clothing) as a contract term rather than hoping for it.
- Clean IP: CC0 base plus a work-for-hire assignment. No stock-licence extraction risk.
- About **US$1,500–4,000 and 2–4 weeks** for the haemorrhage casualty (estimate). The base mesh and rig are then reused for the VF arrest for a fraction of that.
- Use (d) only for small props if at all, and (c) only if a specific model's licence explicitly allows distributing the raw file.

**How to commission (first step):** post this brief (§2, §3, §4 deliverables) on ArtStation and Upwork, asking for a paid test (≈ 4–6 h: block out the posed, named-part body from the MakeHuman base and export it through our checks). Pick the artist whose test passes `usdchecker`, keeps the names and holds the size budget. Fixed price with milestones: (1) posed base + named parts + rig, (2) clothing + wound + blood, (3) physician-review fixes. The contract must include the IP assignment, the input-asset licence list, and no AI-generated or scraped assets without disclosure.

---

## 8. Open items

| Item | Owner |
|---|---|
| Physician confirms every row of §2 (blood volume, skin, gore level, chaps or not) **before** the artist starts milestone 2 | Farjad → physician reviewers |
| Confirm budget and approve commissioning | Farjad |
| Backend: agree on `anchor` / `radius` as optional hotspot fields, and `region` as the coarse enum in §5 | ar-mvp-backend session |
| Add a name and size validation script to the pipeline before the first real model lands | tech-lead / backend-developer |
| Test pallor under warm and cold room light on a real phone (also the gate for the STEMI casualty) | QA with Farjad |
| ViroReact: confirm whether per-node tap on a GLB works, or whether invisible colliders are needed (§5) | v2 spike |
| Remove `public/ar-spike/` once the MVP replaces it (from the spike doc) | frontend-developer |

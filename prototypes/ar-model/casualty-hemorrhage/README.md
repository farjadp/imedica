# AR casualty v1: catastrophic limb haemorrhage (draft, awaiting physician review)

The first real "look before you act" casualty for `catastrophic-limb-hemorrhage`, built in-house in Blender 5.2 LTS from CC0 MakeHuman data, by script. Spec: `docs/product/ar-model-brief.md` (branch `feat/ar-model-brief`). Hosting: `docs/architecture/data-ar-model.md` (branch `feat/ar-mvp-backend`).

**Not attached to the scenario.** A physician attaches it in the editor's 3D model tab; a second physician approves it ([REVIEW.md](REVIEW.md)).

## Shipped files: `public/models/catastrophic-limb-hemorrhage/v1/`

| File | Size | Notes |
|---|---|---|
| `patient.glb` | 0.94 MB | Draco geometry, JPEG textures, 19 named mesh nodes under root `casualty`, no skin |
| `patient.usdz` | 3.48 MB | `usdchecker --arkit`: Success. Same 19 names as Xform + Mesh prims, Y-up, metres |
| `poster.webp` | 0.12 MB | 1200×900, transparent, three-quarter view from standing height |

41,272 triangles (budget 60k). Length 1.75 m. Floor at y = 0, origin centred under the body. Patient's left = +X.

## Nodes (brief §3.2)

Regions: `head`, `airway`, `chest`, `abdomen`, `pelvis`, `arm_left`, `arm_right`, `thigh_left`, `thigh_right`, `lower_leg_left`, `lower_leg_right`, `foot_left`, `foot_right` (split along the skeleton's weight boundaries, with normals taken from the whole body so the seams don't show).
Findings: `wound_thigh_left` (on the skin, under clothes and towel), `dressing_thigh_left` (soaked towel), `blood_pool`.
Clothing: `clothing_shirt`, `clothing_trousers`, `clothing_boots` (separate meshes over a full body, ready for v2 cut-away).

- `hotspots.json`: exactly the backend shape (`{node, label, region}`, regions from `BODY_REGIONS`), ready to paste in the admin tab. `action` is left out: the backend expects a `ScenarioAction` **database id**, which only exists in the target DB.
- `hotspots-v2.json`: the same plus scenario action **keys** (`tq`, `pressure`, `warm`, `fluid`, `elevate`) and `anchor`/`radius` for v2 tap targets (brief §5).

## Rebuild (one command, ~25 s plus the first download)

```bash
prototypes/ar-model/casualty-hemorrhage/build_all.sh
```

Steps: `fetch_assets.sh` (downloads the two CC0 packs, checks SHA-256, extracts data files only) → `build.py` (+ `build_stage2.py`, `build_stage3.py`: body, morph, single skeleton, clothing fit, pose, textures, region split, wound, towel cloth sim, blood pool → `casualty.blend`) → `export.py` (static bake → GLB + USDZ + hotspots) → `validate.py` → `usdchecker --arkit` → `render.py` (review renders from the shipped GLB, neutral and warm light, plus the poster).

Clinical parameters (pallor, pool size, soak extent, wound position) are in `CLIN` at the top of `build_stage2.py`.

`casualty.blend` is the source: one armature (`casualty_rig`, MakeHuman default rig, 163 bones), every body and clothing mesh skinned to it, towel parented to the left thigh bone, textures packed.

## Validation output (2026-11-08)

```
validate.py: NOTE extensionsUsed=['KHR_draco_mesh_compression'] extensionsRequired=['KHR_draco_mesh_compression']
             NOTE glb: 19 mesh nodes, 8 materials, 9 images
             VALIDATE_OK: no errors
usdchecker --arkit patient.usdz: Success!
```

The Khronos glTF-Validator has **not** been run (fetching it with `npx` was blocked in the build session). Run `npx gltf-validator public/models/catastrophic-limb-hemorrhage/v1/patient.glb` before attaching. The GLB re-imports cleanly in Blender (the review renders are made from it).

## Not done / known limits

- Not opened on a phone yet. Quick Look and Scene Viewer are the real test (REVIEW.md, step 1).
- MIME headers for `/models/*.usdz` come with the AR MVP backend PR (`src/lib/model-headers.ts`). Until that's merged, Quick Look may show "Zero KB" for this path.
- Fidelity: a clean serious-game look, not photoreal. Generic MakeHuman face, no pores or subsurface detail, hair and eyebrows painted on (no hair cards: the brief forbids transparency), jeans rather than work trousers, the towel reads as a red cloth more than as terry.
- Pallor fades under warm lamp light (the brief's known risk; see `renders/face_close_warm.jpg`).

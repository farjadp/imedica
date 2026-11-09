# AR model proof of concept (placeholder, not for learners)

Named body-region nodes + a non-photoreal wound marker on the left thigh, exported to GLB and USDZ.
Spec and context: `docs/product/ar-model-brief.md` (§3 technical spec, §6 this proof of concept).

- Source: Quaternius "Ultimate Modular Men" `Casual.glb`, **CC0-1.0** (https://quaternius.com/packs/ultimatemodularcharacters.html), via the spike's `public/ar-spike/models/placeholder-casualty.glb`.
- Not clinical content. Not served by the app (nothing under `public/`).

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
  --python prototypes/ar-model/pipeline/build_regions.py -- \
  public/ar-spike/models/placeholder-casualty.glb prototypes/ar-model/out
usdchecker --arkit prototypes/ar-model/out/poc-casualty-regions.usdz
```

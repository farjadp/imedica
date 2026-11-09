# Licences of every input: catastrophic-limb-hemorrhage casualty, v1

Checked 2026-11-08. All inputs are CC0 1.0. No AI-generated, scanned, scraped or paid stock content.

| Input | Used for | Source | Licence | Evidence |
|---|---|---|---|---|
| MakeHuman base mesh `hm08` (`data/3dobjs/base.obj`) | Body | MPFB 2.0.18 extension, data folder: <https://extensions.blender.org/add-ons/mpfb/> (zip SHA-256 `c075b3e9…2a2dad`) | CC0 1.0 | File header: "explicitly released as CC0 in september 2020". MPFB `LICENSE.md` §C (<https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md>): base mesh, targets, rigs, poses, JSON mesh data "released under CC0 1.0 Universal" |
| Macro targets (`caucasian-male-young/old`, `universal-male-*-maxweight`), mouth targets (`mouth-angles-down`, `mouth-lowerlip-middle-down`) | Age 42 male shape, neutral mouth | MPFB data folder (as above) | CC0 1.0 | MPFB `LICENSE.md` §C |
| Rig `rig.default.json` + `weights.default.json` | Single skeleton and skin weights | MPFB data folder (as above) | CC0 1.0 | `"license": "CC0"` in the weights file; MPFB `LICENSE.md` §C |
| Skin `middleage_caucasian_male` | Skin colour texture (made paler in the build) | MakeHuman system assets, <https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip> (SHA-256 `b542127a…028a0107`) | CC0 1.0 | `.mhmat` header: "explicitly released as CC0 in september 2020"; MakeHuman `LICENSE.md` §C (<https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md>) |
| Clothes `male_casualsuit02` (shirt + jeans), `shoes03` (boots) | Clothing meshes, jeans texture, cloth normal map, boot texture | MakeHuman system assets (as above) | CC0 1.0 | `.mhclo` / `.mhmat` headers (CC0, Sept 2020) |
| Eyes `low-poly` + material `brown` | Eyes | MakeHuman system assets (as above) | CC0 1.0 | Headers (CC0) |

**Not used:** MPFB's Python code (GPL-3.0-or-later). The build reads only MPFB's data files with our own scripts; nothing from MPFB's code is installed, run or redistributed. MakeHuman FAQ: output made from the CC0 assets is CC0 and carries no restriction (<https://static.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html>).

**Made in-house (Ashavid Inc.), by script:** pose, pallor, hair and eyebrow colouring, the shirt recolour (the source shirt's logo is removed), blood on the trousers and hand, the wound, the towel (cloth simulation), the blood pool, materials, region split, export. All in `build*.py` / `export.py` in this folder.

Suggested `licence` / `source` fields for the admin "3D model" tab:
- licence: `CC0-1.0 (MakeHuman assets) + Ashavid Inc.`
- source: `MakeHuman hm08 + system assets (CC0); built in-house, prototypes/ar-model/casualty-hemorrhage`

#!/usr/bin/env bash
# Download and verify the CC0 inputs for build.py. Nothing here is executed:
# only data files (OBJ, targets, rig/weight JSON, textures, MHCLO) are extracted.
#
#   prototypes/ar-model/casualty-hemorrhage/fetch_assets.sh <assets_dir>
#
# Licences (checked 2026-11-08, see LICENSE.md):
# - MakeHuman system assets: CC0 1.0 ("explicitly released as CC0 in september 2020").
# - MPFB 2.0.18 data folder (base mesh hm08, targets, rigs, weights): CC0 1.0 per
#   each file's header / the "license" field in the JSON. MPFB's Python code is
#   GPL-3.0-or-later; we do not install, run or redistribute it.
set -euo pipefail
DEST="${1:?usage: fetch_assets.sh <assets_dir>}"
mkdir -p "$DEST/dl" "$DEST/mpfb" "$DEST/mh"

MPFB_URL="https://extensions.blender.org/download/sha256:c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad/add-on-mpfb-v2.0.18.zip"
MPFB_SHA="c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad"
MH_URL="https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip"
MH_SHA="b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107"

fetch() {  # url sha out
  if [ ! -f "$3" ] || [ "$(shasum -a 256 "$3" | cut -d' ' -f1)" != "$2" ]; then
    curl -fL --retry 3 -o "$3" "$1"
  fi
  got="$(shasum -a 256 "$3" | cut -d' ' -f1)"
  [ "$got" = "$2" ] || { echo "SHA-256 mismatch for $3: $got" >&2; exit 1; }
}
fetch "$MPFB_URL" "$MPFB_SHA" "$DEST/dl/mpfb-2.0.18.zip"
fetch "$MH_URL" "$MH_SHA" "$DEST/dl/makehuman_system_assets_cc0.zip"

# MPFB: data only (no .py)
unzip -qo "$DEST/dl/mpfb-2.0.18.zip" \
  'data/3dobjs/*' 'data/targets/macrodetails/*' 'data/targets/mouth/*' \
  'data/rigs/standard/*' 'data/mesh_metadata/*' -d "$DEST/mpfb"
# MakeHuman system assets used by the build
unzip -qo "$DEST/dl/makehuman_system_assets_cc0.zip" \
  'clothes/male_casualsuit02/*' 'clothes/shoes03/*' 'eyes/low-poly/*' 'eyes/materials/brown*' \
  'skins/middleage_caucasian_male/*' -d "$DEST/mh"
echo "assets ready in $DEST"

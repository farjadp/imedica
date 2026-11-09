#!/usr/bin/env bash
# One command from CC0 sources to the shipped files:
#   prototypes/ar-model/casualty-hemorrhage/build_all.sh [work_dir]
# Writes public/models/catastrophic-limb-hemorrhage/v1/{patient.glb,patient.usdz,poster.webp}
# and refreshes the sources/renders in prototypes/ar-model/casualty-hemorrhage/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
WORK="${1:-$HERE/.work}"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
PUB="$REPO/public/models/catastrophic-limb-hemorrhage/v1"
mkdir -p "$WORK" "$PUB" "$HERE/renders"

"$HERE/fetch_assets.sh" "$WORK/assets"
"$BLENDER" -b --factory-startup --python "$HERE/build.py" -- "$WORK/assets" "$WORK/build"
"$BLENDER" -b "$WORK/build/casualty.blend" --python "$HERE/export.py" -- "$WORK/export"
python3 "$HERE/validate.py" "$WORK/export" "$WORK/export/hotspots.json"
usdchecker --arkit "$WORK/export/patient.usdz" 2>/dev/null | tail -2

IMP="import bpy;bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath='$WORK/export/patient.glb')"
"$BLENDER" -b --factory-startup --python-expr "$IMP" --python "$HERE/render.py" -- "$WORK/renders" \
  ar_left_3q,ar_feet,ar_right_3q,ar_head,top,thigh_close,face_close neutral,warm
"$BLENDER" -b --factory-startup --python-expr "$IMP" --python "$HERE/render.py" -- "$WORK/renders" "" poster

cp "$WORK/export/patient.glb" "$WORK/export/patient.usdz" "$WORK/renders/poster.webp" "$PUB/"
cp "$WORK/export/hotspots.json" "$WORK/export/hotspots-v2.json" "$WORK/export/_export_report.json" "$HERE/"
mv "$HERE/_export_report.json" "$HERE/export-report.json"
cp "$WORK/build/casualty.blend" "$HERE/casualty.blend"
for f in "$WORK"/renders/*_neutral.png "$WORK"/renders/*_warm.png; do
  sips -s format jpeg -s formatOptions 82 "$f" --out "$HERE/renders/$(basename "${f%.png}").jpg" >/dev/null
done
ls -l "$PUB"

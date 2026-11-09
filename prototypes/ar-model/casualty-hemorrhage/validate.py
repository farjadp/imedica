"""Check the exported files against the brief's technical spec (section 3).

  python3 validate.py <dir with patient.glb, patient.usdz> <hotspots.json>

Checks: GLB container + JSON structure (buffer views/accessors in range, every
mesh referenced, required extensions declared), node names (regex, expected
set, root `casualty`, no transform on the root), sizes < 5 MB, the same names as
USD prims (via usdcat), and that every hotspot node exists in both files.
This is not the Khronos glTF-Validator; run that too when it's available
(npx gltf-validator patient.glb).
"""
import json, os, re, struct, subprocess, sys

d, hs_path = sys.argv[1], sys.argv[2]
glb, usdz = os.path.join(d, "patient.glb"), os.path.join(d, "patient.usdz")
NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")
EXPECTED = {"head", "airway", "chest", "abdomen", "pelvis", "arm_left", "arm_right", "thigh_left",
            "thigh_right", "lower_leg_left", "lower_leg_right", "foot_left", "foot_right",
            "wound_thigh_left", "dressing_thigh_left", "blood_pool",
            "clothing_shirt", "clothing_trousers", "clothing_boots"}
errors, notes = [], []

raw = open(glb, "rb").read()
magic, ver, length = struct.unpack_from("<4sII", raw, 0)
if magic != b"glTF" or ver != 2 or length != len(raw):
    errors.append(f"GLB header: magic={magic} version={ver} length={length}/{len(raw)}")
jlen, jtype = struct.unpack_from("<I4s", raw, 12)
gj = json.loads(raw[20:20 + jlen])
blen, btype = struct.unpack_from("<I4s", raw, 20 + jlen)
if jtype != b"JSON" or btype != b"BIN\x00":
    errors.append("GLB chunk types")
bin_len = blen
for i, bv in enumerate(gj.get("bufferViews", [])):
    if bv.get("byteOffset", 0) + bv["byteLength"] > bin_len:
        errors.append(f"bufferView {i} out of range")
for i, a in enumerate(gj.get("accessors", [])):
    if "bufferView" in a and a["bufferView"] >= len(gj["bufferViews"]):
        errors.append(f"accessor {i} bad bufferView")
used = set(gj.get("extensionsUsed", [])); req = set(gj.get("extensionsRequired", []))
draco = any("KHR_draco_mesh_compression" in p.get("extensions", {})
            for m in gj["meshes"] for p in m["primitives"])
if draco and "KHR_draco_mesh_compression" not in req:
    errors.append("Draco used but not in extensionsRequired")
notes.append(f"extensionsUsed={sorted(used)} extensionsRequired={sorted(req)}")
nodes = gj["nodes"]
names = [n.get("name") for n in nodes]
roots = gj["scenes"][gj.get("scene", 0)]["nodes"]
if [names[i] for i in roots] != ["casualty"]:
    errors.append(f"root nodes: {[names[i] for i in roots]}")
r = nodes[roots[0]]
if any(k in r for k in ("matrix", "rotation", "scale", "translation")):
    errors.append(f"root has a transform: { {k: r[k] for k in r if k in ('matrix','rotation','scale','translation')} }")
mesh_nodes = {n["name"] for n in nodes if "mesh" in n}
if mesh_nodes != EXPECTED:
    errors.append(f"GLB mesh nodes differ: missing={EXPECTED - mesh_nodes} extra={mesh_nodes - EXPECTED}")
for n in mesh_nodes:
    if not NAME_RE.match(n):
        errors.append(f"bad name {n}")
mesh_names = {m.get("name") for m in gj["meshes"]}
if mesh_names != EXPECTED:
    errors.append(f"glTF mesh names != node names: {sorted(mesh_names ^ EXPECTED)}")
if gj.get("skins"):
    errors.append("skins present (MVP export must be static)")
for m in gj["materials"]:
    if m.get("alphaMode", "OPAQUE") != "OPAQUE":
        errors.append(f"material {m.get('name')} alphaMode={m['alphaMode']}")
for img in gj.get("images", []):
    if img.get("mimeType") not in ("image/jpeg", "image/png"):
        errors.append(f"image mime {img.get('mimeType')}")
notes.append(f"glb: {len(mesh_nodes)} mesh nodes, {len(gj['materials'])} materials, {len(gj.get('images', []))} images")

usd = subprocess.run(["usdcat", usdz], capture_output=True, text=True).stdout
xforms = set(re.findall(r'def Xform "([^"]+)"', usd))
meshes = set(re.findall(r'def Mesh "([^"]+)"', usd))
if not EXPECTED <= xforms:
    errors.append(f"USD Xforms missing {EXPECTED - xforms}")
if meshes != EXPECTED:
    errors.append(f"USD Mesh prims != node names: {sorted(meshes ^ EXPECTED)}")
if 'upAxis = "Y"' not in usd:
    errors.append("USD upAxis is not Y")
if "metersPerUnit = 1" not in usd:
    errors.append("USD metersPerUnit is not 1")

for p in (glb, usdz):
    if os.path.getsize(p) >= 5 * 1024 * 1024:
        errors.append(f"{os.path.basename(p)} is {os.path.getsize(p)} bytes (>= 5 MB)")

hs = json.load(open(hs_path))
for h in (hs["hotspots"] if isinstance(hs, dict) else hs):
    if h["node"] not in mesh_nodes or h["node"] not in meshes:
        errors.append(f"hotspot node {h['node']} not in both files")

print("\n".join("NOTE " + n for n in notes))
print("\n".join("ERROR " + e for e in errors) or "VALIDATE_OK: no errors")
sys.exit(1 if errors else 0)

"""Export casualty.blend -> patient.glb + patient.usdz + poster + hotspots.json.

  Blender -b <build>/casualty.blend --python export.py -- <out_dir>

Static pose (brief 3.3: MVP export has no rig): every mesh is evaluated
(armature, solidify), its world transform applied, and re-parented to an
identity root `casualty`. Body-region meshes get custom normals taken from the
whole body, so the region seams don't show. Y-up, metres, floor at y = 0.
"""
import sys, os, json, re
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
scene = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()

REGIONS = ["head", "airway", "chest", "abdomen", "pelvis", "arm_left", "arm_right",
           "thigh_left", "thigh_right", "lower_leg_left", "lower_leg_right", "foot_left", "foot_right"]
FINDINGS = ["wound_thigh_left", "dressing_thigh_left", "blood_pool"]
CLOTHING = ["clothing_shirt", "clothing_trousers", "clothing_boots"]
EXPECTED = REGIONS + FINDINGS + CLOTHING
NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")

src = {o.name: o for o in scene.objects if o.type == "MESH" and not o.name.startswith("_")}
missing = set(EXPECTED) - set(src); extra = set(src) - set(EXPECTED)
assert not missing and not extra, (missing, extra)

baked = {}
for name in EXPECTED:
    o = src[name]
    e = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(e, preserve_all_data_layers=False, depsgraph=dg)
    me.transform(o.matrix_world)
    for a in [a.name for a in me.attributes if a.name in ("rest", "hair", "brow", "lips", "soak", "core",
                                                           "sat", "handblood")]:
        me.attributes.remove(me.attributes[a])
    baked[name] = me

# Seamless normals across body regions: vertex normals from the welded body.
bm = bmesh.new()
for r in REGIONS:
    bm.from_mesh(baked[r])
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.normal_update()
kd = KDTree(len(bm.verts))
for v in bm.verts:
    kd.insert(v.co, v.index)
kd.balance()
wn = [v.normal.copy() for v in bm.verts]
bm.free()
for r in REGIONS:
    me = baked[r]
    me.normals_split_custom_set_from_vertices([wn[kd.find(v.co)[1]] for v in me.vertices])

# Fresh scene: identity root + baked meshes only.
for o in list(scene.objects):
    bpy.data.objects.remove(o, do_unlink=True)
keep = set(baked.values())
for m in list(bpy.data.meshes):          # free the names: USD/glTF mesh == node name
    if m not in keep:
        bpy.data.meshes.remove(m)
root =bpy.data.objects.new("casualty", None); scene.collection.objects.link(root)
tris = {}
for name, me in baked.items():
    me.name = name
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    ob.parent = root
    tris[name] = sum(len(p.vertices) - 2 for p in me.polygons)
bpy.context.view_layer.update()

pts = np.vstack([np.array([v.co for v in o.data.vertices]) for o in root.children])
mn, mx = pts.min(0), pts.max(0)
dims = (mx - mn)
report = {
    "nodes": sorted(o.name for o in root.children),
    "triangles_total": int(sum(tris.values())), "triangles": tris,
    "dims_m_blender_xyz": [round(float(x), 3) for x in dims],
    "min_z": round(float(mn[2]), 4),
    "body_length_m": round(float(pts[:, 1].max() - pts[:, 1].min()), 3),
}
for n in report["nodes"]:
    assert NAME_RE.match(n), n
print("REPORT", json.dumps(report))

# --------------------------------------------------------------------- GLB
glb = os.path.join(OUT, "patient.glb")
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kw = dict(filepath=glb, export_format="GLB", export_yup=True, export_apply=True,
          export_animations=False, export_skins=False, export_morph=False,
          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
          export_draco_position_quantization=14, export_draco_normal_quantization=10,
          export_draco_texcoord_quantization=12, export_image_format="JPEG",
          export_jpeg_quality=85)
kw = {k: v for k, v in kw.items() if k in props or k == "filepath"}
bpy.ops.export_scene.gltf(**kw)

# Uncompressed copy for validators/viewers without Draco (not shipped).
glb_raw = os.path.join(OUT, "_patient.nodraco.glb")
kw2 = dict(kw); kw2["filepath"] = glb_raw; kw2["export_draco_mesh_compression_enable"] = False
bpy.ops.export_scene.gltf(**kw2)

# -------------------------------------------------------------------- USDZ
usdz = os.path.join(OUT, "patient.usdz")
uprops = bpy.ops.wm.usd_export.get_rna_type().properties.keys()
ukw = dict(filepath=usdz, export_materials=True, export_animation=False)
for k, v in (("generate_preview_surface", True), ("convert_orientation", True),
             ("export_global_forward_selection", "NEGATIVE_Z"), ("export_global_up_selection", "Y"),
             ("root_prim_path", "/root"), ("export_armatures", False), ("export_shapekeys", False),
             ("export_textures", True), 
             ("export_normals", True), ("export_uvmaps", True), ("triangulate_meshes", True)):
    if k in uprops:
        ukw[k] = v
bpy.ops.wm.usd_export(**ukw)

# ---------------------------------------------------------------- hotspots
# hotspots.json: exactly the backend shape (src/lib/validators/ar-model.ts,
# strict {node, label, region, action?}; region from BODY_REGIONS). `action` is
# left out on purpose: the backend wants the ScenarioAction *database id*, which
# only exists in the target DB. hotspots-v2.json carries the scenario action
# *keys* plus anchor/radius (brief section 5) for the v2 tap targets.
HS = [  # node, label, backend region, scenario action key (brief section 5)
    ("dressing_thigh_left", "Soaked towel over the wound, left thigh", "left_leg", "pressure"),
    ("wound_thigh_left", "Bleeding wound, left thigh", "left_leg", "pressure"),
    ("thigh_left", "Left thigh, above the wound", "left_leg", "tq"),
    ("blood_pool", "Blood on the floor", "scene", None),
    ("head", "Head and face", "head", None),
    ("airway", "Airway and neck", "airway", None),
    ("chest", "Chest", "chest", None),
    ("abdomen", "Abdomen", "abdomen", None),
    ("pelvis", "Pelvis", "pelvis", None),
    ("arm_left", "Left arm", "left_arm", "fluid"),
    ("arm_right", "Right arm", "right_arm", "fluid"),
    ("thigh_right", "Right thigh", "right_leg", None),
    ("lower_leg_left", "Left lower leg", "left_leg", "elevate"),
    ("lower_leg_right", "Right lower leg", "right_leg", None),
    ("foot_left", "Left foot", "left_leg", None),
    ("foot_right", "Right foot", "right_leg", None),
    ("clothing_shirt", "Wet clothing (shirt)", "chest", "warm"),
    ("clothing_trousers", "Wet, blood-soaked trousers", "left_leg", "warm"),
]
v1, v2 = [], []
for node, label, region, action in HS:
    ob = bpy.data.objects[node]
    ps = np.array([v.co for v in ob.data.vertices]); a, b = ps.min(0), ps.max(0); c = (a + b) / 2
    v1.append({"node": node, "label": label, "region": region})
    h = {"node": node, "label": label, "region": region,
         "anchor": [round(float(c[0]), 3), round(float(c[2]), 3), round(float(-c[1]), 3)],
         "radius": round(float(max(b - a)) / 2, 3)}
    if action:
        h["action"] = action
    v2.append(h)
json.dump(v1, open(os.path.join(OUT, "hotspots.json"), "w"), indent=2)
json.dump({"model": "catastrophic-limb-hemorrhage/v1", "units": "m", "up": "Y",
           "action_is": "scenario action key (map to ScenarioAction.id when attaching)",
           "hotspots": v2}, open(os.path.join(OUT, "hotspots-v2.json"), "w"), indent=2)

report["bytes"] = {os.path.basename(p): os.path.getsize(p) for p in (glb, usdz)}
json.dump(report, open(os.path.join(OUT, "_export_report.json"), "w"), indent=1)
print("SIZES", report["bytes"])
print("EXPORT_OK")

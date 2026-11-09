"""AR model brief, proof of concept: split the CC0 placeholder casualty into
separately selectable body-region nodes, add a clearly non-photoreal wound
marker on the LEFT thigh (catastrophic-limb-hemorrhage scenario), and export
GLB + USDZ + hotspots.json.

PLACEHOLDER ONLY - not clinical content, not for learners.
Input: public/ar-spike/models/placeholder-casualty.glb (output of the spike
pipeline, itself derived from Quaternius "Ultimate Modular Men" Casual.glb, CC0-1.0).

Run headless (Blender 5.2):
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python prototypes/ar-model/pipeline/build_regions.py -- <in.glb> <out_dir>

Conventions (see docs/product/ar-model-brief.md, "Technical spec"):
- Blender: metres, Z-up, patient supine, head toward +Y, face toward +Z, so the
  patient's LEFT is +X. Exported glTF/USD are Y-up, metres, origin on the floor.
- Node names: lowercase snake_case, <region>[_<side>] or <finding>_<region>[_<side>];
  side is always the PATIENT's left/right.
"""
import sys, os, json
import bpy, bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out_dir = argv[0], argv[1]
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = "METRIC"
bpy.ops.import_scene.gltf(filepath=src)
scene = bpy.context.scene

# Old spike marker sat on the patient's RIGHT thigh; the scenario wound is LEFT.
for o in list(scene.objects):
    if "Marker" in o.name:
        bpy.data.objects.remove(o, do_unlink=True)

old_root = next(o for o in scene.objects if o.type == "EMPTY")
meshes = [o for o in scene.objects if o.type == "MESH"]
for o in meshes:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    with bpy.context.temp_override(selected_editable_objects=[o], object=o, active_object=o):
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.data.objects.remove(old_root, do_unlink=True)

def side(x):
    return "left" if x > 0 else "right"   # patient's left is +X (see docstring)

def label_for(obj_name, c):
    """Region node name for a face centre c (Blender coords, metres)."""
    x, y = c.x, c.y
    if "Head" in obj_name:
        return "head"
    if "Feet" in obj_name:
        return f"foot_{side(x)}"
    if "Body" in obj_name:
        if abs(x) > 0.165 and y < 0.50:
            return f"arm_{side(x)}"
        if y > 0.50:
            return "airway"        # neck / anterior throat
        if y > 0.22:
            return "chest"
        return "abdomen"
    if "Legs" in obj_name:
        if y > -0.05:
            return "pelvis"
        if y > -0.42:
            return f"thigh_{side(x)}"
        return f"lower_leg_{side(x)}"
    raise ValueError(obj_name)

parts = {}
for o in meshes:
    labels = sorted({label_for(o.name, o.matrix_world @ p.center) for p in o.data.polygons})
    for lab in labels:
        dup = o.copy(); dup.data = o.data.copy(); scene.collection.objects.link(dup)
        bm = bmesh.new(); bm.from_mesh(dup.data)
        kill = [f for f in bm.faces if label_for(o.name, f.calc_center_median()) != lab]
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(dup.data); bm.free()
        if lab in parts:   # same region from two source meshes (e.g. chest skin + shirt): join
            with bpy.context.temp_override(active_object=parts[lab], selected_editable_objects=[parts[lab], dup]):
                bpy.ops.object.join()
        else:
            dup.name = lab; dup.data.name = lab
            parts[lab] = dup
    bpy.data.objects.remove(o, do_unlink=True)

def bounds(o):
    ps = [o.matrix_world @ v.co for v in o.data.vertices]
    return (Vector([min(p[i] for p in ps) for i in range(3)]),
            Vector([max(p[i] for p in ps) for i in range(3)]))

# Wound marker: flat orange disc + white ring, deliberately non-anatomical.
th = parts["thigh_left"]
mn, mx = bounds(th)
cy = mn.y + 0.65 * (mx.y - mn.y)                 # upper/mid thigh
band = [th.matrix_world @ v.co for v in th.data.vertices if abs((th.matrix_world @ v.co).y - cy) < 0.03]
cx = sum(p.x for p in band) / len(band)
top = max(p.z for p in band)
def disc(name, r, depth, z, rgb):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=depth, location=(cx, cy, z))
    d = bpy.context.active_object; d.name = name; d.data.name = name
    m = bpy.data.materials.new(name + "_mat"); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.6
    d.data.materials.append(m)
    return d
ring = disc("ring_tmp", 0.055, 0.006, top + 0.004, (0.95, 0.95, 0.95))
dot = disc("wound_thigh_left", 0.042, 0.008, top + 0.006, (1.0, 0.35, 0.0))
with bpy.context.temp_override(active_object=dot, selected_editable_objects=[dot, ring]):
    bpy.ops.object.join()
parts["wound_thigh_left"] = dot

# Root at the floor, centred.
root = bpy.data.objects.new("casualty", None); scene.collection.objects.link(root)
for o in parts.values():
    o.parent = root
bpy.context.view_layer.update()
allp = [o.matrix_world @ v.co for o in parts.values() for v in o.data.vertices]
mn = Vector([min(p[i] for p in allp) for i in range(3)])
mx = Vector([max(p[i] for p in allp) for i in range(3)])
root.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
bpy.context.view_layer.update()

# Hotspots: anchor = node bounding-box centre, converted to glTF/USD Y-up (x, z, -y).
LABELS = {
    "head": ("Head and face", "head", None),
    "airway": ("Airway and neck", "airway", None),
    "chest": ("Chest", "chest", None),
    "abdomen": ("Abdomen", "abdomen", None),
    "pelvis": ("Pelvis", "pelvis", None),
    "arm_left": ("Left arm", "arm", None),
    "arm_right": ("Right arm", "arm", None),
    "thigh_left": ("Left thigh, above the wound", "leg", "tq"),
    "thigh_right": ("Right thigh", "leg", None),
    "lower_leg_left": ("Left lower leg", "leg", None),
    "lower_leg_right": ("Right lower leg", "leg", None),
    "foot_left": ("Left foot", "leg", None),
    "foot_right": ("Right foot", "leg", None),
    "wound_thigh_left": ("Bleeding wound, left thigh", "leg", "pressure"),
}
hotspots = []
for name, o in sorted(parts.items()):
    a, b = bounds(o); c = (a + b) / 2
    label, region, action = LABELS[name]
    h = {"node": name, "label": label, "region": region,
         "anchor": [round(c.x, 3), round(c.z, 3), round(-c.y, 3)],
         "radius": round(max(b - a) / 2, 3)}
    if action:
        h["action"] = action
    hotspots.append(h)
with open(os.path.join(out_dir, "hotspots.json"), "w") as f:
    json.dump({"model": "poc-casualty-regions", "placeholder": True,
               "scenario": "catastrophic-limb-hemorrhage", "units": "m", "up": "Y",
               "hotspots": hotspots}, f, indent=2)

dims = [round(mx[i] - mn[i], 3) for i in range(3)]
print("DIMS_M", dims, "NODES", sorted(parts))

glb = os.path.join(out_dir, "poc-casualty-regions.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_yup=True,
                          export_apply=True, export_animations=False)
usdz = os.path.join(out_dir, "poc-casualty-regions.usdz")
props = bpy.ops.wm.usd_export.get_rna_type().properties.keys()
kw = dict(filepath=usdz, export_materials=True, export_animation=False)
for k, v in (("generate_preview_surface", True), ("convert_orientation", True),
             ("export_global_forward_selection", "NEGATIVE_Z"),
             ("export_global_up_selection", "Y"), ("root_prim_path", "/root"),
             ("export_armatures", False), ("export_shapekeys", False)):
    if k in props:
        kw[k] = v
bpy.ops.wm.usd_export(**kw)
for f in (glb, usdz):
    print("OUT", f, os.path.getsize(f))

"""Reviewer renders from AR viewing distance, in neutral and warm indoor light.

  Blender -b <file.blend> --python render.py -- <out_dir> [views] [lights] [engine]

views:  comma list of ar_left_3q, ar_feet, ar_right_3q, ar_head, top, thigh_close, hand_close, inner_thigh, feet_close, face_close
        (default: all). lights: neutral,warm (default both).
engine: EEVEE (default) or CYCLES.

Viewer eye height 1.6 m (standing adult), 1.0-2.0 m horizontal distance from
the body: brief section 2 acceptance test ("1-2 m, typical living room").
"""
import sys, os, math
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = os.path.abspath(argv[0]) if argv else "/tmp"
os.makedirs(out, exist_ok=True)
VIEWS = {
    # name: (camera location, look-at) in metres; body centre at origin,
    # head toward +Y, patient's left = +X, floor z = 0.
    "ar_left_3q":  ((1.35, -0.75, 1.6), (0.05, -0.05, 0.1)),
    "ar_feet":     ((0.25, -2.25, 1.6), (0.0, 0.0, 0.1)),
    "ar_right_3q": ((-1.35, -0.6, 1.6), (0.05, -0.05, 0.1)),
    "ar_head":     ((0.4, 2.0, 1.6), (0.05, -0.1, 0.1)),
    "top":         ((0.0, 0.0, 3.2), (0.0, 0.0, 0.0)),
    "thigh_close": ((0.75, -0.55, 0.85), (0.1, -0.2, 0.12)),
    "hand_close":  ((0.55, -0.35, 0.65), (0.14, -0.1, 0.2)),
    "inner_thigh": ((-0.35, -0.75, 0.55), (0.08, -0.15, 0.08)),
    "feet_close":  ((0.55, -1.45, 0.6), (0.0, -0.8, 0.08)),
    "face_close":  ((0.45, 1.05, 0.75), (0.02, 0.76, 0.08)),
}
views = argv[1].split(",") if len(argv) > 1 and argv[1] else list(VIEWS)
lights = argv[2].split(",") if len(argv) > 2 and argv[2] else ["neutral", "warm"]
engine = argv[3] if len(argv) > 3 else "EEVEE"

sc = bpy.context.scene
for o in [o for o in sc.objects if o.type in ("CAMERA", "LIGHT") or o.name.startswith("_floor")]:
    bpy.data.objects.remove(o, do_unlink=True)

# Floor: light oak-ish neutral grey-beige, like a living-room floor.
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.0005))
floor = bpy.context.active_object; floor.name = "_floor"
fm = bpy.data.materials.new("_floor_mat"); fm.use_nodes = True
fb = next(n for n in fm.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
fb.inputs["Base Color"].default_value = (0.42, 0.36, 0.30, 1)
fb.inputs["Roughness"].default_value = 0.55
floor.data.materials.append(fm)

cam = bpy.data.objects.new("_cam", bpy.data.cameras.new("_cam"))
sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 26  # roughly a phone's main camera FOV

world = bpy.data.worlds.get("_world") or bpy.data.worlds.new("_world")
sc.world = world; world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")

key = bpy.data.objects.new("_key", bpy.data.lights.new("_key", "AREA"))
sc.collection.objects.link(key)
key.data.size = 1.5
key.location = (0.6, 0.4, 2.4)
key.rotation_euler = (0.15, 0.1, 0)

LIGHTS = {
    # neutral: daylight-ish, cool white overhead; warm: one 2700 K lamp + dim warm room
    "neutral": dict(world=(0.80, 0.82, 0.85), world_s=0.6, key=(1.0, 1.0, 1.0), key_w=70),
    "warm":    dict(world=(1.00, 0.72, 0.45), world_s=0.3, key=(1.0, 0.70, 0.42), key_w=60),
}

if engine == "CYCLES":
    try:
        sc.render.engine = "CYCLES"
    except TypeError:
        pass
    sc.cycles.samples = 64
else:
    sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 1200, 900
sc.view_settings.view_transform = "AgX" if "AgX" in [i.identifier for i in
    bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "Standard"

if lights == ["poster"]:
    # 1200x900 transparent poster (brief 3.5), shadow kept via a shadow catcher;
    # saved as WebP for public/models/... (hosting convention, data-ar-model.md).
    sc.render.engine = "CYCLES"; sc.cycles.samples = 96
    sc.render.film_transparent = True
    floor.is_shadow_catcher = True
    L = LIGHTS["neutral"]
    bg.inputs[0].default_value = (*L["world"], 1); bg.inputs[1].default_value = L["world_s"]
    key.data.energy = L["key_w"]
    loc, tgt = VIEWS["ar_left_3q"]
    cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 34
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
    png = os.path.join(out, "poster.png")
    sc.render.filepath = png
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(png)
    sc.render.image_settings.file_format = "WEBP"; sc.render.image_settings.quality = 82
    img.save_render(os.path.join(out, "poster.webp"), scene=sc)
    print("POSTER", os.path.join(out, "poster.webp"))
    lights = []

for lname in lights:
    L = LIGHTS[lname]
    bg.inputs[0].default_value = (*L["world"], 1); bg.inputs[1].default_value = L["world_s"]
    key.data.color = L["key"]; key.data.energy = L["key_w"]
    for v in views:
        loc, tgt = VIEWS[v]
        cam.location = loc
        cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(out, f"{v}_{lname}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDER", sc.render.filepath)

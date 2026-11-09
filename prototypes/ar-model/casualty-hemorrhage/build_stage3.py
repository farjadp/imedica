# Stage 3 of build.py: region nodes, wound, towel (dressing), blood pool, root,
# save casualty.blend. DRAFT CLINICAL CONTENT.
from mathutils.bvhtree import BVHTree

bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()

def posed_coords(ob):
    e = ob.evaluated_get(dg); m = e.to_mesh()
    a = np.zeros((len(m.vertices), 3)); m.vertices.foreach_get("co", a.ravel())
    e.to_mesh_clear()
    return (np.c_[a, np.ones(len(a))] @ np.array(ob.matrix_world).T)[:, :3]

body_posed = posed_coords(body)
P = Vector(body_posed[wound_vi])
thigh_b = arm.pose.bones["upperleg02.L"]
A = (arm.matrix_world @ thigh_b.tail - arm.matrix_world @ thigh_b.head).normalized()  # hip -> knee
print("WOUND_POSED", tuple(round(x, 3) for x in P), "THIGH_AXIS", tuple(round(x, 3) for x in A))

# ------------------------------------------------------------------ regions
REGION_BONES = {
    "head": ["head", "jaw", "eye.", "oculi", "orbicularis", "oris", "risorius", "temporalis",
             "levator", "special0", "tongue"],
    "airway": ["neck0"],
    "chest": ["spine01", "spine02", "clavicle", "breast"],
    "abdomen": ["spine03", "spine04"],
    "pelvis": ["spine05", "root", "pelvis."],
    "arm": ["shoulder01", "upperarm", "lowerarm", "wrist", "metacarpal", "finger"],
    "thigh": ["upperleg"],
    "lower_leg": ["lowerleg"],
    "foot": ["foot.", "toe"],
}
def bone_region(b):
    for r, keys in REGION_BONES.items():
        if any(b.startswith(k) for k in keys):
            if r in ("arm", "thigh", "lower_leg", "foot"):
                return f"{r}_{'left' if b.endswith('.L') else 'right'}"
            return r
    raise ValueError(b)
regions = sorted({bone_region(b) for b in bones})
Rw = np.zeros((nbody, len(regions)), np.float32)
for bi, b in enumerate(bones):
    Rw[:, regions.index(bone_region(b))] += W[bi, :nbody]
face_region = {}
for p in body.data.polygons:
    face_region[p.index] = regions[int(np.argmax(Rw[list(p.vertices)].sum(0)))]

parts = {}
for r in regions:
    keep_faces = {i for i, rr in face_region.items() if rr == r}
    dup = body.copy(); dup.data = body.data.copy(); scene.collection.objects.link(dup)
    b = bmesh.new(); b.from_mesh(dup.data)
    bmesh.ops.delete(b, geom=[f for f in b.faces if f.index not in keep_faces], context="FACES")
    b.to_mesh(dup.data); b.free()
    dup.name = r; dup.data.name = r
    parts[r] = dup
    print("REGION", r, len(dup.data.polygons))

# ------------------------------------------------------------------- wound
# Laceration on the skin under trousers and towel (hidden in the MVP view; there
# for v2 cut-away). Transverse-oblique slash, ~9 x 2.5 cm, no bone, no deformity.
wb = bmesh.new(); wb.from_mesh(body.data); wb.verts.ensure_lookup_table()
axis_dir = (kneeL - hipL) / np.linalg.norm(kneeL - hipL)
def in_wound(c):
    d = np.array(c) - wound_rest
    along = d @ axis_dir
    across = np.linalg.norm(d - along * axis_dir)
    return (along / 0.035) ** 2 + (across / 0.06) ** 2 < 1
bmesh.ops.delete(wb, geom=[f for f in wb.faces if not in_wound(f.calc_center_median())], context="FACES")
for v in wb.verts:
    v.co += v.normal * 0.0012
wound = bpy.data.objects.new("wound_thigh_left", bpy.data.meshes.new("wound_thigh_left"))
wb.to_mesh(wound.data); wb.free()
scene.collection.objects.link(wound)
for vg in body.vertex_groups:
    wound.vertex_groups.new(name=vg.name)
# copy weights via the region copy approach: simplest is a data transfer from body
dt = wound.modifiers.new("wt", "DATA_TRANSFER"); dt.object = body
dt.use_vert_data = True; dt.data_types_verts = {"VGROUP_WEIGHTS"}
dt.vert_mapping = "NEAREST"
bpy.context.view_layer.objects.active = wound
with bpy.context.temp_override(object=wound, active_object=wound):
    bpy.ops.object.modifier_apply(modifier="wt")
wm_ = wound.modifiers.new("Armature", "ARMATURE"); wm_.object = arm
wound.parent = arm
wound.data.materials.append(M["wound"])
print("WOUND_FACES", len(wound.data.polygons))

# -------------------------------------------------------- towel (dressing)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
def bvh_of(obs):
    verts, polys = [], []
    for o in obs:
        e = o.evaluated_get(dg); m = e.to_mesh()
        off = len(verts)
        mw = o.matrix_world
        verts += [mw @ v.co for v in m.vertices]
        polys += [[off + i for i in p.vertices] for p in m.polygons]
        e.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)
surf = bvh_of([trousers, shirt, body])

TL, TW, NU, NV = 0.24, 0.20, 34, 28       # folded hand towel held on the front of the thigh (v1.1)
side = Vector((0, 0, 1)).cross(A).normalized()   # across the thigh, horizontal
centre = P + A * 0.01
top_z = max((surf.ray_cast(Vector(((centre + side * k).x, (centre + side * k).y, 1.0)),
                            Vector((0, 0, -1)))[0] or Vector((0, 0, 0))).z
            for k in np.linspace(-0.1, 0.1, 9))
grid = np.zeros((NU + 1, NV + 1, 3))
for i in range(NU + 1):
    for j in range(NV + 1):
        q = centre + A * ((i / NU - 0.5) * TL) + side * ((j / NV - 0.5) * TW)
        hit = surf.ray_cast(Vector((q.x, q.y, 1.0)), Vector((0, 0, -1)))[0]
        hz = hit.z if hit is not None else 0.0
        # start just above the leg surface (or level with the thigh top beyond it)
        u_, v_ = i / NU, j / NV
        # crumpled: several fold frequencies, strongest toward the middle
        wrinkle = (0.010 * np.sin(u_ * 13 + 3.0 * v_) * np.sin(v_ * 9 + 1.0)
                   + 0.006 * np.sin(u_ * 29 + v_ * 17) + 0.004 * np.sin(v_ * 31 - u_ * 5)
                   + 0.008 * np.exp(-((u_ - 0.55) ** 2 + (v_ - 0.45) ** 2) / 0.03))
        grid[i, j] = (q.x, q.y, max(hz + 0.007, top_z - 0.035) + abs(wrinkle) + 0.004)
tv = [tuple(grid[i, j]) for i in range(NU + 1) for j in range(NV + 1)]
tf = [(i * (NV + 1) + j, (i + 1) * (NV + 1) + j, (i + 1) * (NV + 1) + j + 1, i * (NV + 1) + j + 1)
      for i in range(NU) for j in range(NV)]
towel = make_mesh("dressing_thigh_left", tv, tf)
uvl = towel.data.uv_layers.new(name="UVMap")
uvs = []
for f in tf:
    for vi in f:
        i, j = divmod(vi, NV + 1); uvs += [j / NV, i / NU]
uvl.data.foreach_set("uv", np.array(uvs, np.float32))
for p in towel.data.polygons:
    p.use_smooth = True
# Drape the towel with Blender's cloth solver (deterministic for fixed settings):
# collides with the posed trousers and the floor; heavy and stiff like a wet,
# folded terry hand towel.
bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
_floor = bpy.context.active_object; _floor.name = "_sim_floor"
for o in (trousers, _floor):
    c = o.modifiers.new("Collision", "COLLISION")
    o.collision.thickness_outer = 0.003; o.collision.cloth_friction = 40
# Pin a strip along the top of the thigh: the towel is held there (by the
# patient / bystander before EMS arrived); the sides drape freely.
pin = towel.vertex_groups.new(name="pin")
for k in range(len(towel.data.vertices)):
    i, j = divmod(k, NV + 1)
    a_ = abs(j / NV - 0.5)
    b_ = abs(i / NU - 0.5)
    if a_ < 0.26 and b_ < 0.42:   # held over the front of the thigh; edges fall free
        pin.add([k], 1.0 - a_ / 0.26 * 0.7, "REPLACE")
cl = towel.modifiers.new("Cloth", "CLOTH")
cs = cl.settings
cs.vertex_group_mass = "pin"; cs.pin_stiffness = 1.0
cs.quality = 10; cs.mass = 0.25; cs.air_damping = 2.0
cs.tension_stiffness = 30; cs.compression_stiffness = 2; cs.shear_stiffness = 5
cs.bending_stiffness = 4.0
cl.collision_settings.distance_min = 0.004
cl.collision_settings.use_self_collision = False
scene.frame_start, scene.frame_end = 1, 50
cl.point_cache.frame_start, cl.point_cache.frame_end = 1, 50
for f in range(1, 51):
    scene.frame_set(f)
bpy.context.view_layer.objects.active = towel
with bpy.context.temp_override(object=towel, active_object=towel):
    bpy.ops.object.modifier_apply(modifier="Cloth")
scene.frame_set(1)
for o in (trousers,):
    o.modifiers.remove(o.modifiers["Collision"])
bpy.data.objects.remove(_floor, do_unlink=True)
# rest attr for noise = towel-local (u, v) in metres
ra = towel.data.attributes.new("rest", "FLOAT_VECTOR", "POINT")
rv = np.array([[ (j / NV - 0.5) * TW, (i / NU - 0.5) * TL, 0] for i in range(NU + 1) for j in range(NV + 1)], np.float32)
ra.data.foreach_set("vector", rv.ravel())
# wound position in towel space ~ centre; soak radius covers most of the towel
d_w = np.linalg.norm(rv[:, :2] - np.array([0.0, -0.01]), axis=1)
sat = np.clip(1.18 - d_w / 0.115, 0, 1)   # darkest at the centre, dry-ish edges.astype(np.float32)
a = towel.data.attributes.new("sat", "FLOAT", "POINT"); a.data.foreach_set("value", sat)

TOWEL_DRY = (0.30, 0.42, 0.60, 1)   # light-blue hand towel (linear): reads as a towel, contrasts with blood
def towel_builder(nt, bsdf):
    s = nt.nodes.new("ShaderNodeAttribute"); s.attribute_name = "sat"
    nz = noise_node(nt, 14, 10)
    sub = nt.nodes.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = 0.5
    nt.links.new(nz.outputs["Fac"], sub.inputs[0])
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"
    add.inputs[1].default_value = 0.9
    nt.links.new(sub.outputs[0], add.inputs[0]); nt.links.new(s.outputs["Fac"], add.inputs[2])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.30
    mr.inputs["From Max"].default_value = 0.42
    nt.links.new(add.outputs[0], mr.inputs["Value"])
    # fringe: diluted pink-red edge where blood wicks into dry terry
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = TOWEL_DRY
    ramp.color_ramp.elements[1].color = (0.075, 0.004, 0.004, 1)
    e = ramp.color_ramp.elements.new(0.18); e.color = (0.42, 0.10, 0.10, 1)
    e = ramp.color_ramp.elements.new(0.45); e.color = (0.17, 0.012, 0.012, 1)
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    # terry speckle
    nz2 = noise_node(nt, 600, 2)
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.25
    nt.links.new(ramp.outputs["Color"], mix.inputs[6]); nt.links.new(nz2.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
towel_path = bake_color(towel, towel_builder, "towel_basecolor.jpg", 1024)

def towel_rough_builder(nt, bsdf):
    s = nt.nodes.new("ShaderNodeAttribute"); s.attribute_name = "sat"
    nz = noise_node(nt, 14, 10)
    sub = nt.nodes.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = 0.5
    nt.links.new(nz.outputs["Fac"], sub.inputs[0])
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"; add.inputs[1].default_value = 0.9
    nt.links.new(sub.outputs[0], add.inputs[0]); nt.links.new(s.outputs["Fac"], add.inputs[2])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.42
    mr.inputs["From Max"].default_value = 0.70
    mr.inputs["To Min"].default_value = 0.92; mr.inputs["To Max"].default_value = 0.30
    nt.links.new(add.outputs[0], mr.inputs["Value"])
    comb = nt.nodes.new("ShaderNodeCombineColor"); comb.inputs[0].default_value = 1.0; comb.inputs[2].default_value = 0.0
    nt.links.new(mr.outputs["Result"], comb.inputs[1]); nt.links.new(comb.outputs[0], bsdf.inputs["Base Color"])
towel_mr_path = bake_color(towel, towel_rough_builder, "towel_mr.jpg", 512)
M["towel"] = pbr("towel", towel_path, mr_path=towel_mr_path)
towel.data.materials.append(M["towel"])
sol = towel.modifiers.new("thickness", "SOLIDIFY"); sol.thickness = 0.008; sol.offset = -1

# ------------------------------------------------------------- blood pool
# Flat, opaque, slightly domed mesh on the floor beside and under the left
# thigh (brief: 40-60 cm, irregular, part of the model, y ~ 2 mm).
def blob(cx, cy, rx, ry, seed, n=120, rings=4, h=0.0025, lobes=((3, .10), (5, .07), (9, .04), (17, .02))):
    r_ = np.random.default_rng(seed)
    ph = r_.uniform(0, 2 * np.pi, len(lobes))
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    rr = 1 + sum(a * np.sin(k * th + p) for (k, a), p in zip(lobes, ph))
    verts = [(cx, cy, h)]
    for ring in range(1, rings + 1):
        f = ring / rings
        zz = h * (1 - f ** 4) + 0.0004
        for t_, r1 in zip(th, rr):
            verts.append((cx + np.cos(t_) * rx * r1 * f, cy + np.sin(t_) * ry * r1 * f, zz))
    faces = [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]
    for ring in range(rings - 1):
        a0, b0 = 1 + ring * n, 1 + (ring + 1) * n
        faces += [(a0 + k, b0 + k, b0 + (k + 1) % n, a0 + (k + 1) % n) for k in range(n)]
    return verts, faces

pool_c = P + side * (0.0)
# Lateral side of the left thigh is +X; the pool spreads out from under the thigh.
cx, cy = P.x + 0.13, P.y - 0.04
rx, ry = CLIN["pool_size"][1] / 2, CLIN["pool_size"][0] / 2
pv, pf = blob(cx, cy, rx, ry, 3)
for k, (dx, dy, r_) in enumerate(((0.30, 0.10, 0.025), (0.27, -0.22, 0.018), (0.05, -0.33, 0.022),
                                  (0.33, -0.08, 0.012), (-0.06, 0.27, 0.015))):
    v2, f2 = blob(cx + dx, cy + dy, r_, r_ * 0.8, 20 + k, n=24, rings=2, h=0.0008)
    off = len(pv); pv += v2; pf += [tuple(off + i for i in f) for f in f2]
pool = make_mesh("blood_pool", pv, pf)
for p in pool.data.polygons:
    p.use_smooth = True
pool.data.materials.append(M["blood_wet"])

# ---------------------------------------------- left hand pressing the towel (v1.1)
# Two-bone IK: wrist placed on the towel just above the wound (toward the hip),
# fingers pointing toward the knee, palm down, thumb medial, fingers spread.
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
tbvh = bvh_of([towel])
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
pb = arm.pose.bones
MW = arm.matrix_world; MWi = MW.inverted()
def wpos(v): return MW @ v
def hit_z(x, y):
    h = tbvh.ray_cast(Vector((x, y, 1.0)), Vector((0, 0, -1)))[0]
    return h.z if h is not None else None
# top of the thigh (the wound is antero-lateral, so step medially toward the crest)
tw = np.array([towel.matrix_world @ v.co for v in towel.data.vertices])
crest_x = float(tw[np.argsort(tw[:, 2])[-40:], 0].mean())
palm_xy = P - A * 0.035
palm_xy.x = crest_x
wrist_xy = palm_xy - A * 0.075
# rest on the highest towel folds under the hand footprint (palm + fingers)
foot = [np.linalg.norm(tw[:, :2] - np.array([c.x, c.y]), axis=1) < 0.05
        for c in (wrist_xy, palm_xy, palm_xy + A * 0.06)]
zt = float(max(tw[m, 2].max() for m in foot if m.any()))
T = Vector((wrist_xy.x, wrist_xy.y, zt + 0.012))       # wrist bone just above the folds (pressing in)
S = wpos(pb["upperarm01.L"].head)
E0 = wpos(pb["lowerarm01.L"].head); W0 = wpos(pb["wrist.L"].head)
L1, L2 = (E0 - S).length, (W0 - E0).length
d = min((T - S).length, L1 + L2 - 0.004)
u = (T - S).normalized(); T = S + u * d
a_ = (L1 ** 2 - L2 ** 2 + d ** 2) / (2 * d); h_ = max(L1 ** 2 - a_ ** 2, 0) ** 0.5
pole = Vector((1.0, 0.0, -0.35)); pole = (pole - u * pole.dot(u)).normalized()   # elbow out, toward the floor
E = S + u * a_ + pole * h_
def align_ws(bname, target_ws):
    b = pb[bname]; bpy.context.view_layer.update()
    head = b.head.copy()
    tgt_as = MWi @ target_ws
    q = (b.tail - head).normalized().rotation_difference((tgt_as - head).normalized())
    b.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ b.matrix
    bpy.context.view_layer.update()
for bn in ("upperarm01.L", "upperarm02.L"):
    align_ws(bn, E)
for bn in ("lowerarm01.L", "lowerarm02.L"):
    align_ws(bn, T)
hand_dir = (A + Vector((0, 0, -0.12))).normalized()
align_ws("wrist.L", wpos(pb["wrist.L"].head) + hand_dir * 0.1)
# roll the hand about its own axis: palm plane horizontal, thumb medial (-X)
def palm_score():
    bpy.context.view_layer.update()
    k = [wpos(pb[f"metacarpal{i}.L"].tail) for i in (1, 4)]
    w = wpos(pb["wrist.L"].head); tip = wpos(pb["metacarpal2.L"].tail)
    n = (k[1] - k[0]).cross(tip - w).normalized()
    thumb = wpos(pb["finger1-2.L"].head)
    centre = (k[0] + k[1]) / 2
    return abs(n.z) + (0.5 if thumb.x < centre.x else -0.5)
best = (-9, 0)
b = pb["wrist.L"]
base = b.matrix.copy()
for deg in range(0, 360, 10):
    ax = (b.tail - b.head).normalized()
    R = Matrix.Rotation(np.radians(deg), 4, ax)
    b.matrix = Matrix.Translation(base.translation) @ R @ Matrix.Translation(-base.translation) @ base
    sc_ = palm_score()
    if sc_ > best[0]:
        best = (sc_, deg)
ax = (b.tail - b.head).normalized()
b.matrix = Matrix.Translation(base.translation) @ Matrix.Rotation(np.radians(best[1]), 4, ax) @ Matrix.Translation(-base.translation) @ base
bpy.context.view_layer.update()
# spread the fingers a little (about the palm normal) and flatten them onto the towel
k1, k4 = wpos(pb["metacarpal1.L"].tail), wpos(pb["metacarpal4.L"].tail)
nrm_ = (k4 - k1).cross(wpos(pb["metacarpal2.L"].tail) - wpos(pb["wrist.L"].head)).normalized()
if nrm_.z < 0:
    nrm_ = -nrm_
for f_, ang in (("finger2-1.L", -9), ("finger3-1.L", -3), ("finger4-1.L", 4), ("finger5-1.L", 10)):
    bb = pb[f_]; hd = bb.head.copy()
    R = Matrix.Rotation(np.radians(ang), 4, (MWi.to_3x3() @ nrm_).normalized())
    bb.matrix = Matrix.Translation(hd) @ R @ Matrix.Translation(-hd) @ bb.matrix
    bpy.context.view_layer.update()
# straighten the fingers along the hand, curving slightly onto the thigh
for fn in (2, 3, 4, 5):
    for seg, tilt in ((1, 0.10), (2, 0.25), (3, 0.40)):
        bb = pb[f"finger{fn}-{seg}.L"]
        par = bb.parent
        spread = {2: -0.16, 3: -0.05, 4: 0.06, 5: 0.17}[fn]
        if seg > 1:
            dvec = (par.tail - par.head).normalized()
        else:
            hd_ws = (hand_dir + nrm_.cross(hand_dir).normalized() * spread).normalized()
            dvec = (MWi.to_3x3() @ hd_ws).normalized()
        dvec = (dvec - (MWi.to_3x3() @ nrm_).normalized() * tilt).normalized()
        hd = bb.head.copy()
        q = (bb.tail - hd).normalized().rotation_difference(dvec)
        bb.matrix = Matrix.Translation(hd) @ q.to_matrix().to_4x4() @ Matrix.Translation(-hd) @ bb.matrix
        bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode="OBJECT")
print("HAND_IK reach", round(d, 3), "of", round(L1 + L2, 3), "roll", best)

# --------------------------------------------------------------- hierarchy
head_obj = parts["head"]
eyes = proxy_objs["eyes"]
with bpy.context.temp_override(active_object=head_obj, selected_editable_objects=[head_obj, eyes]):
    bpy.ops.object.join()
bpy.data.objects.remove(body, do_unlink=True)

root = bpy.data.objects.new("casualty", None); scene.collection.objects.link(root)
arm.parent = root
for ob in (towel, pool):
    mw = ob.matrix_world.copy(); ob.parent = arm; ob.matrix_world = mw
# Towel follows the left thigh bone in the rig.
mw = towel.matrix_world.copy()
towel.parent = arm; towel.parent_type = "BONE"; towel.parent_bone = "upperleg02.L"
bpy.context.view_layer.update(); towel.matrix_world = mw

meta = dict(wound_posed=list(P), thigh_axis=list(A), clin=CLIN, regions=regions)
json.dump(meta, open(os.path.join(OUT, "build_meta.json"), "w"), indent=1, default=float)
for img in list(bpy.data.images):
    if img.users == 0:
        bpy.data.images.remove(img)
bpy.ops.file.pack_all()          # self-contained source .blend (textures packed)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "casualty.blend"), relative_remap=True)
print("NODES", sorted(o.name for o in scene.objects))
print("BUILD_OK")

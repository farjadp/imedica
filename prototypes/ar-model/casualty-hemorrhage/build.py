"""Build the catastrophic-limb-hemorrhage AR casualty (v1) from CC0 MakeHuman data.

DRAFT CLINICAL CONTENT: not for learners until two physicians sign REVIEW.md.

Run headless (Blender 5.2 LTS), after fetch_assets.sh:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python prototypes/ar-model/casualty-hemorrhage/build.py -- \
    <assets_dir> <out_dir>

Writes <out_dir>/casualty.blend (source: one armature, every body/clothing mesh
skinned to it, named region nodes). export.py turns that into GLB + USDZ.

Inputs (all CC0-1.0, see LICENSE.md): MakeHuman hm08 base mesh, macro targets,
"default" rig + weights (from the MPFB 2.0.18 extension's data folder; MPFB's
*code* is GPL and is not used or redistributed), and the MakeHuman system asset
pack (skin, clothes, boots, eyes).

Conventions (docs/product/ar-model-brief.md section 3): metres, patient supine,
head toward +Y, face toward +Z, so the patient's LEFT is +X. MakeHuman's own
axes (x = character's left, y = up, z = forward) map 1:1 onto that lying frame,
so the base mesh is used as-is and only scaled from decimetres.
"""
import sys, os, json, gzip, math
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
ASSETS, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
os.makedirs(OUT, exist_ok=True)
MPFB = os.path.join(ASSETS, "mpfb", "data")
MH = os.path.join(ASSETS, "mh")

HEIGHT_M = 1.75          # brief 3.1: 1.75 m +/- 2 cm
AGE_YEARS = 42           # scenario: 42-year-old male

# ---------------------------------------------------------------- base mesh
def load_obj(path):
    V, VT, F, FT, G = [], [], [], [], []
    group = None
    with open(path) as f:
        for line in f:
            t = line.split()
            if not t:
                continue
            if t[0] == "v":
                V.append([float(x) for x in t[1:4]])
            elif t[0] == "vt":
                VT.append([float(x) for x in t[1:3]])
            elif t[0] == "g":
                group = t[1] if len(t) > 1 else None
            elif t[0] == "f":
                vs, ts = [], []
                for c in t[1:]:
                    p = c.split("/")
                    vs.append(int(p[0]) - 1)
                    ts.append(int(p[1]) - 1 if len(p) > 1 and p[1] else -1)
                F.append(vs); FT.append(ts); G.append(group)
    return np.array(V, dtype=np.float64), np.array(VT) if VT else None, F, FT, G

def load_target(path):
    idx, d = [], []
    with gzip.open(path, "rt") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            p = line.split()
            idx.append(int(p[0])); d.append([float(x) for x in p[1:4]])
    return np.array(idx, dtype=np.int64), np.array(d)

V, VT, F, FT, G = load_obj(os.path.join(MPFB, "3dobjs", "base.obj"))

# MakeHuman macro model: age 0.5 = 25 y, 1.0 = 90 y. Race = caucasian.
age_v = 0.5 + (AGE_YEARS - 25) / (90 - 25) * 0.5
w_old = (age_v - 0.5) / 0.5
w_young = 1 - w_old
macro = os.path.join(MPFB, "targets", "macrodetails")
for name, w in (("caucasian-male-young", w_young), ("caucasian-male-old", w_old),
                # slightly above average weight for a 42-y labourer
                ("universal-male-young-averagemuscle-maxweight", 0.15 * w_young),
                ("universal-male-old-averagemuscle-maxweight", 0.15 * w_old)):
    i, d = load_target(os.path.join(macro, name + ".target.gz"))
    V[i] += w * d

# Face: MakeHuman's neutral mouth reads as a faint smile. Pull the corners down
# and part the lips a little (he is talking, slowly; in pain).
for rel, w in (("mouth/mouth-angles-down", 1.0), ("mouth/mouth-lowerlip-middle-down", 0.25)):
    i, d = load_target(os.path.join(MPFB, "targets", rel + ".target.gz"))
    V[i] += w * d

vgroups = json.load(open(os.path.join(MPFB, "mesh_metadata", "basemesh_vertex_groups.json")))
def group_idx(name):
    out = []
    for a, b in vgroups[name]:
        out.extend(range(a, b + 1))
    return out

# ------------------------------------------------------------- proxies (mhclo)
def load_mhclo(path):
    refs, wts, offs, scale, delete = [], [], [], {}, []
    mode = None
    with open(path) as f:
        for line in f:
            t = line.split()
            if not t or t[0].startswith("#"):
                continue
            if t[0] in ("x_scale", "y_scale", "z_scale"):
                scale[t[0][0]] = (int(t[1]), int(t[2]), float(t[3]))
            elif t[0] == "verts":
                mode = "verts"; continue
            elif t[0] == "delete_verts":
                mode = "delete"; continue
            elif t[0] == "obj_file":
                obj = t[1]
            elif mode == "verts" and t[0][0].isdigit() or (mode == "verts" and t[0][0] == "-"):
                if len(t) == 1:
                    refs.append([int(t[0])] * 3); wts.append([1, 0, 0]); offs.append([0, 0, 0])
                elif len(t) >= 9:
                    refs.append([int(x) for x in t[0:3]])
                    wts.append([float(x) for x in t[3:6]])
                    offs.append([float(x) for x in t[6:9]])
                else:
                    mode = None
            elif mode == "delete":
                toks = t
                k = 0
                while k < len(toks):
                    if k + 2 < len(toks) and toks[k + 1] == "-":
                        delete.extend(range(int(toks[k]), int(toks[k + 2]) + 1)); k += 3
                    elif toks[k].lstrip("-").isdigit():
                        delete.append(int(toks[k])); k += 1
                    else:
                        mode = None; break
            elif mode is not None and not t[0][0].isdigit():
                mode = None
    return dict(refs=np.array(refs), wts=np.array(wts), offs=np.array(offs),
                scale=scale, delete=sorted(set(delete)),
                obj=os.path.join(os.path.dirname(path), obj))

def fit_proxy(p, base):
    s = np.ones(3)
    for k, ax in (("x", 0), ("y", 1), ("z", 2)):
        if k in p["scale"]:
            a, b, ref = p["scale"][k]
            s[ax] = abs(base[a, ax] - base[b, ax]) / ref
    r, w = p["refs"], p["wts"]
    pos = (base[r[:, 0]] * w[:, 0:1] + base[r[:, 1]] * w[:, 1:2] + base[r[:, 2]] * w[:, 2:3])
    return pos + p["offs"] * s

# --------------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
SCALE = 0.1  # MakeHuman decimetres -> metres (rescaled to HEIGHT_M below)

def make_mesh(name, verts, faces, face_uvs=None, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    if uvs is not None and face_uvs is not None:
        uvl = me.uv_layers.new(name="UVMap")
        flat = [uvs[i] for fu in face_uvs for i in fu]
        uvl.data.foreach_set("uv", np.array(flat, dtype=np.float32).ravel())
    me.validate(); me.update()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob

# Body: only the "body" group (vertices 0..13379); helpers are dropped.
body_faces = [i for i, g in enumerate(G) if g == "body"]
nbody = 13380
body = make_mesh("body", V[:nbody] * SCALE, [F[i] for i in body_faces],
                 [FT[i] for i in body_faces], VT)
for p in body.data.polygons:
    p.use_smooth = True

# Proxies: clothing, boots, eyes.
PROXIES = {
    "clothing_suit": os.path.join(MH, "clothes", "male_casualsuit02", "male_casualsuit02.mhclo"),
    "clothing_boots": os.path.join(MH, "clothes", "shoes03", "shoes03.mhclo"),
    "eyes": os.path.join(MH, "eyes", "low-poly", "low-poly.mhclo"),
}
proxy_data, proxy_objs = {}, {}
for name, path in PROXIES.items():
    p = load_mhclo(path)
    pv, pvt, pf, pft, _ = load_obj(p["obj"])
    assert len(pv) == len(p["refs"]), (name, len(pv), len(p["refs"]))
    fitted = fit_proxy(p, V) * SCALE
    ob = make_mesh(name, fitted, pf, pft, pvt)
    for poly in ob.data.polygons:
        poly.use_smooth = True
    proxy_data[name], proxy_objs[name] = p, ob

# Skin under clothing stays modelled (brief: cut-away readiness) but is pulled in
# 3 mm where MakeHuman would delete it, so it never pokes through the cloth.
hidden = {}
for n, depth in (("clothing_suit", 0.003), ("clothing_boots", 0.010)):
    for i in proxy_data[n]["delete"]:
        if i < nbody:
            hidden[i] = max(hidden.get(i, 0), depth)   # feet sit deeper: no skin through the boot
body.data.update()
nrm = np.zeros((nbody, 3))
body.data.vertices.foreach_get("normal", nrm.ravel())
co = np.zeros((nbody, 3))
body.data.vertices.foreach_get("co", co.ravel())
hid = np.array(sorted(hidden), dtype=np.int64)
co[hid] -= nrm[hid] * np.array([hidden[i] for i in hid])[:, None]
body.data.vertices.foreach_set("co", co.ravel())
body.data.update()

# ---------------------------------------------------------------------- rig
rig = json.load(open(os.path.join(MPFB, "rigs", "standard", "rig.default.json")))
weights = json.load(open(os.path.join(MPFB, "rigs", "standard", "weights.default.json")))["weights"]

def joint(spec):
    s = spec["strategy"]
    if s == "CUBE":
        return V[group_idx(spec["cube_name"])].mean(axis=0) * SCALE
    if s == "VERTEX":
        return V[spec["vertex_index"]] * SCALE
    if s == "MEAN":
        return V[spec["vertex_indices"]].mean(axis=0) * SCALE
    raise ValueError(s)

arm_data = bpy.data.armatures.new("casualty_rig")
arm = bpy.data.objects.new("casualty_rig", arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for bname, b in rig.items():
    eb = arm_data.edit_bones.new(bname)
    eb.head = Vector(joint(b["head"])); eb.tail = Vector(joint(b["tail"]))
    eb.roll = b.get("roll", 0.0)
for bname, b in rig.items():
    if b["parent"]:
        arm_data.edit_bones[bname].parent = arm_data.edit_bones[b["parent"]]
        arm_data.edit_bones[bname].use_connect = b.get("use_connect", False)
bpy.ops.object.mode_set(mode="OBJECT")

# Dense base weights (bones x base verts), used for body and, through the
# proxy barycentric refs, for clothing: one skeleton, every mesh skinned to it.
bones = list(rig.keys())
W = np.zeros((len(bones), len(V)), dtype=np.float32)
for bi, bname in enumerate(bones):
    for vi, w in weights.get(bname, []):
        W[bi, vi] = w

def skin(ob, wmat):
    for bi, bname in enumerate(bones):
        col = wmat[bi]
        nz = np.nonzero(col > 1e-4)[0]
        if len(nz) == 0:
            continue
        vg = ob.vertex_groups.new(name=bname)
        for vi in nz:
            vg.add([int(vi)], float(col[vi]), "REPLACE")
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    ob.parent = arm

skin(body, W[:, :nbody])
for name, ob in proxy_objs.items():
    p = proxy_data[name]
    r, w = p["refs"], p["wts"]
    wm = W[:, r[:, 0]] * w[:, 0] + W[:, r[:, 1]] * w[:, 1] + W[:, r[:, 2]] * w[:, 2]
    skin(ob, wm)

# --------------------------------------------------------------------- pose
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
pb = arm.pose.bones

def rotate_world(bname, axis, deg):
    """Rotate a pose bone about a world axis through its head."""
    b = pb[bname]
    bpy.context.view_layer.update()
    m = b.matrix.copy()
    R = Matrix.Rotation(math.radians(deg), 4, Vector(axis))
    head = m.translation.copy()
    new = Matrix.Translation(head) @ R @ Matrix.Translation(-head) @ m
    b.matrix = new
    bpy.context.view_layer.update()

def align(bname, target):
    """Rotate a pose bone (about its head) so it points along `target`."""
    b = pb[bname]
    bpy.context.view_layer.update()
    d = (b.tail - b.head).normalized()
    q = d.rotation_difference(Vector(target).normalized())
    m = b.matrix.copy()
    head = m.translation.copy()
    b.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()

def angle_to_down(bname):
    b = pb[bname]
    d = (b.tail - b.head).normalized()
    return math.degrees(math.atan2(d.x, -d.y))  # 0 = straight toward the feet

# Arms by the sides (rotate in the coronal plane = about the anterior axis +Z),
# leaving ~8 degrees of abduction so the hands rest beside the thighs.
for side, sgn in (("L", 1), ("R", -1)):
    a = angle_to_down(f"upperarm01.{side}")
    rotate_world(f"upperarm01.{side}", (0, 0, 1), -(a - sgn * 13))
    # MakeHuman's rest pose bends the elbow ~45 deg forward (+Z here, i.e. up
    # off the floor). Lay the forearm on the floor beside the thigh, elbow
    # barely flexed and the hand angled slightly in toward the thigh.
    align(f"lowerarm01.{side}", (sgn * 0.10, -1.0, -0.02))
# Head turned slightly toward the patient's left (the wound side / the viewer).
rotate_world("neck02", (0, 1, 0), 8)
rotate_world("head", (0, 1, 0), 10)
bpy.ops.object.mode_set(mode="OBJECT")
bpy.context.view_layer.update()

# ------------------------------------------------- scale to height + floor
def world_coords(obs):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in obs:
        e = o.evaluated_get(dg)
        m = e.to_mesh()
        a = np.zeros((len(m.vertices), 3)); m.vertices.foreach_get("co", a.ravel())
        pts.append((np.c_[a, np.ones(len(a))] @ np.array(o.matrix_world).T)[:, :3])
        e.to_mesh_clear()
    return np.vstack(pts)

meshes = [body] + list(proxy_objs.values())
pts = world_coords(meshes)
length = pts[:, 1].max() - pts[:, 1].min()
s = HEIGHT_M / length
arm.scale = (s, s, s)
bpy.context.view_layer.update()
pts = world_coords(meshes)
arm.location = (-(pts[:, 0].min() + pts[:, 0].max()) / 2,
                -(pts[:, 1].min() + pts[:, 1].max()) / 2,
                -pts[:, 2].min())
bpy.context.view_layer.update()
pts = world_coords(meshes)
print("BODY_DIMS_M", np.round(pts.max(0) - pts.min(0), 3), "MIN", np.round(pts.min(0), 3))

exec(compile(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_stage2.py")).read(),
             "build_stage2.py", "exec"))

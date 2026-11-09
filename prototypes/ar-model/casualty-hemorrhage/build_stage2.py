# Stage 2 of build.py (exec'd in its namespace): clothing split, textures and
# clinical cues, region nodes, findings, props. DRAFT CLINICAL CONTENT.
#
# Clinical parameters (all "to be confirmed by physician", brief section 2) are
# collected here so a reviewer's change is a one-line edit + rebuild.
CLIN = dict(
    pallor_desat=0.52,        # skin saturation removed (0..1): "pale" (v1.1: stronger, holds under warm light)
    pallor_lift=0.07,         # skin value lift: pale, not grey (grey = shock state, brief section 2)
    pallor_cool=0.025,        # small cool shift (less red, a touch more blue), still not grey
    lip_desat=0.65,           # lips paler than the rest
    skin_roughness=0.50,      # body skin
    sweat_roughness=0.26,     # face, neck, hands: sweat sheen ("clammy")
    wound_t=0.42,             # wound along hip->knee (0 = hip): mid/upper thigh
    wound_dir=(0.55, 0.0, 0.84),  # anterior-lateral (MH axes: +x left, +z anterior)
    pool_size=(0.50, 0.40),   # blood pool, metres (brief: 40-60 cm across)
    trouser_soak_down=0.42,   # blood soak from the wound toward the knee (m)
    trouser_soak_up=0.08,
)
TEX = os.path.join(OUT, "textures")
os.makedirs(TEX, exist_ok=True)

def rest_m(idx):
    """Rest-pose base vertex positions in metres (MakeHuman axes = lying frame)."""
    return V[idx] * SCALE

J = lambda name: V[group_idx(name)].mean(axis=0) * SCALE
hipL, kneeL = J("joint-l-upper-leg"), J("joint-l-knee")
eyeL, eyeR = J("joint-l-eye"), J("joint-r-eye")
head_c = J("joint-head-2") if "joint-head-2" in vgroups else J("joint-head")
mouth = J("joint-mouth")

# ------------------------------------------------ wound centre (rest, body vertex)
axis_pt = hipL + CLIN["wound_t"] * (kneeL - hipL)
wdir = np.array(CLIN["wound_dir"]); wdir /= np.linalg.norm(wdir)
body_rest = V[:nbody] * SCALE
cand = np.nonzero((body_rest[:, 0] > 0.02) &
                  (np.abs(body_rest[:, 1] - axis_pt[1]) < 0.02))[0]
proj = (body_rest[cand] - axis_pt) @ wdir
wound_vi = int(cand[np.argmax(proj)])
wound_rest = body_rest[wound_vi]
print("WOUND_REST", np.round(wound_rest, 3), "vi", wound_vi)

# ------------------------------------------------ split the suit: shirt / trousers
suit = proxy_objs["clothing_suit"]
bm = bmesh.new(); bm.from_mesh(suit.data); bm.verts.ensure_lookup_table()
suit_rest = fit_proxy(proxy_data["clothing_suit"], V) * SCALE
seen, comps = set(), []
for v in bm.verts:
    if v.index in seen:
        continue
    stack, comp = [v], []
    seen.add(v.index)
    while stack:
        x = stack.pop(); comp.append(x.index)
        for e in x.link_edges:
            o = e.other_vert(x)
            if o.index not in seen:
                seen.add(o.index); stack.append(o)
    comps.append(comp)
bm.free()
waist_y = J("joint-pelvis")[1] if "joint-pelvis" in vgroups else hipL[1] + 0.08
shirt_v = set()
for c in comps:
    if suit_rest[c, 1].mean() > waist_y:
        shirt_v.update(c)
print("SUIT_COMPONENTS", len(comps), "shirt verts", len(shirt_v), "of", len(suit_rest))

def split_by_verts(ob, keep, new_name):
    """Duplicate ob keeping faces whose verts are all in `keep`; remove them from ob."""
    dup = ob.copy(); dup.data = ob.data.copy(); scene.collection.objects.link(dup)
    for o, inside in ((dup, True), (ob, False)):
        b = bmesh.new(); b.from_mesh(o.data)
        kill = [f for f in b.faces if (all(v.index in keep for v in f.verts)) != inside]
        bmesh.ops.delete(b, geom=kill, context="FACES")
        b.to_mesh(o.data); b.free()
    dup.name = new_name; dup.data.name = new_name
    return dup

shirt = split_by_verts(suit, shirt_v, "clothing_shirt")
trousers = suit; trousers.name = "clothing_trousers"; trousers.data.name = "clothing_trousers"
boots = proxy_objs["clothing_boots"]

# bmesh delete keeps vertex order of survivors, so rest positions can be looked
# up again by matching. Store rest positions as an attribute before anything else.
def store_rest(ob, rest_positions):
    a = ob.data.attributes.new("rest", "FLOAT_VECTOR", "POINT")
    a.data.foreach_set("vector", np.asarray(rest_positions, dtype=np.float32).ravel())

# Re-derive rest positions for the split meshes from their (unposed) mesh coords:
# mesh data is still rest pose (armature is a modifier), so .co == rest.
for ob in (body, shirt, trousers, boots, proxy_objs["eyes"]):
    co = np.zeros((len(ob.data.vertices), 3)); ob.data.vertices.foreach_get("co", co.ravel())
    store_rest(ob, co)

# ------------------------------------------------------------- texture helpers
def load_px(path, size=None):
    img = bpy.data.images.load(path)
    if size and tuple(img.size) != (size, size):
        img.scale(size, size)
    w, h = img.size
    a = np.zeros(w * h * 4, dtype=np.float32); img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(h, w, 4)

def save_px(arr, name, fmt="JPEG", quality=88):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=False)
    img.pixels.foreach_set(np.ascontiguousarray(arr, dtype=np.float32).ravel())
    path = os.path.join(TEX, name)
    img.filepath_raw = path; img.file_format = fmt
    scene.render.image_settings.quality = quality
    img.save(filepath=path, quality=quality) if fmt == "JPEG" else img.save()
    bpy.data.images.remove(img)
    return path

def srgb_to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

# ------------------------------------------------------------ Cycles bake setup
try:
    scene.render.engine = "CYCLES"
except TypeError as e:
    print("ENGINES", e)
scene.cycles.samples = 4
scene.cycles.device = "CPU"

def bake_color(ob, mat_builder, out_name, size):
    """Bake the base colour of a procedural material into a texture on ob's UVs."""
    img = bpy.data.images.new(out_name, size, size, alpha=False)
    mat = bpy.data.materials.new("_bake_" + out_name); mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    mat_builder(nt, bsdf)
    tgt = nt.nodes.new("ShaderNodeTexImage"); tgt.image = img
    nt.nodes.active = tgt; tgt.select = True
    old = list(ob.data.materials)
    ob.data.materials.clear(); ob.data.materials.append(mat)
    for o in scene.objects:
        o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=8, use_clear=True)
    path = os.path.join(TEX, out_name)
    img.filepath_raw = path; img.file_format = "JPEG"
    img.save(filepath=path, quality=88)
    ob.data.materials.clear()
    for m in old:
        ob.data.materials.append(m)
    bpy.data.materials.remove(mat); bpy.data.images.remove(img)
    return path

def noise_node(nt, scale, detail=6, coord="rest"):
    attr = nt.nodes.new("ShaderNodeAttribute"); attr.attribute_name = coord
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale; nz.inputs["Detail"].default_value = detail
    nt.links.new(attr.outputs["Vector"], nz.inputs["Vector"])
    return nz

# ---------------------------------------------------------------- skin texture
skin_src = os.path.join(MH, "skins", "middleage_caucasian_male", "middleage_lightskinned_male_diffuse.png")
px = load_px(skin_src, 2048)
rgb = px[..., :3]
lum = (rgb * np.array([0.30, 0.59, 0.11])).sum(-1, keepdims=True)
rgb = rgb + (lum - rgb) * CLIN["pallor_desat"]
rgb = np.clip(rgb + CLIN["pallor_lift"], 0, 1)
rgb = np.clip(rgb + np.array([-1.0, 0.0, 0.6]) * CLIN["pallor_cool"], 0, 1)
px[..., :3] = rgb
pale_skin_path = save_px(px, "_skin_pale_tmp.png", "PNG")

# Masks from rest positions (metres): scalp hair, eyebrows, lips. Computed per
# vertex, broken up with noise in the shader, baked into the colour texture so
# the export has no hair cards and no transparency (brief 3.4).
br = body_rest
hy_front = eyeL[1] + 0.065           # frontal hairline ~6.5 cm above the eyes
hy_back = J("joint-neck")[1] + 0.03 if "joint-neck" in vgroups else eyeL[1] - 0.06
zmin, zmax = br[br[:, 1] > eyeL[1] - 0.12][:, 2].min(), eyeL[2]
t = np.clip((br[:, 2] - zmin) / max(zmax - zmin, 1e-6), 0, 1)   # 0 = back of head, 1 = face
ear_top = eyeL[1] + 0.012
line = np.interp(t, [0.0, 0.28, 0.40, 0.66, 0.74, 0.86, 1.0],
                    [hy_back, ear_top - 0.01, ear_top, eyeL[1] - 0.005, ear_top + 0.02, hy_front, hy_front])
ear_zone = (np.abs(br[:, 0]) > abs(eyeL[0]) + 0.035) & (br[:, 1] < eyeL[1] + 0.03) & (br[:, 2] > zmin + 0.06)
hair = ((br[:, 1] > line) & (br[:, 1] > eyeL[1] - 0.13) & ~ear_zone).astype(np.float32)
brow = np.zeros(nbody, np.float32)
for e in (eyeL, eyeR):
    dx = (br[:, 0] - (e[0] + np.sign(e[0]) * 0.006)) / 0.030
    dy = (br[:, 1] - (e[1] + 0.022 + 0.004 * (1 - dx ** 2))) / 0.0085
    dz = (br[:, 2] > e[2] - 0.004)
    brow = np.maximum(brow, ((dx ** 2 + dy ** 2) < 1).astype(np.float32) * dz)
lips = np.clip(1 - np.linalg.norm((br - mouth) / np.array([0.028, 0.012, 0.03]), axis=1), 0, 1)
lips = (lips > 0.15).astype(np.float32) * (br[:, 2] > mouth[2] - 0.01)
# Left hand: lies beside / against the soaked towel, so it is bloodied (palm,
# fingers). Brief: "blood on the hand if it's pressing".
wristL = J("joint-l-hand")
hand_blood = ((br[:, 0] > 0) & (br[:, 1] < wristL[1] + 0.02) & (br[:, 1] > wristL[1] - 0.25) &
              (np.abs(br[:, 0] - wristL[0]) < 0.12)).astype(np.float32)
for nm, arr in (("hair", hair), ("brow", brow), ("lips", lips), ("handblood", hand_blood)):
    a = body.data.attributes.new(nm, "FLOAT", "POINT"); a.data.foreach_set("value", arr)

def brow_mask(nt):
    """Per-pixel eyebrow mask: two tilted ellipses on the interpolated rest position."""
    rest = nt.nodes.new("ShaderNodeAttribute"); rest.attribute_name = "rest"
    acc = None
    for e in (eyeL, eyeR):
        sx = np.sign(e[0])
        c = (e[0] + sx * 0.004, e[1] + 0.021, e[2] + 0.004)
        sub = nt.nodes.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = c
        nt.links.new(rest.outputs["Vector"], sub.inputs[0])
        # slight arch: lift the outer half
        div = nt.nodes.new("ShaderNodeVectorMath"); div.operation = "DIVIDE"
        div.inputs[1].default_value = (0.026, 0.0046, 0.04)
        nt.links.new(sub.outputs[0], div.inputs[0])
        ln = nt.nodes.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"
        nt.links.new(div.outputs[0], ln.inputs[0])
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["From Min"].default_value = 0.75; mr.inputs["From Max"].default_value = 1.0
        mr.inputs["To Min"].default_value = 1.0; mr.inputs["To Max"].default_value = 0.0
        nt.links.new(ln.outputs["Value"], mr.inputs["Value"])
        if acc is None:
            acc = mr.outputs["Result"]
        else:
            mx = nt.nodes.new("ShaderNodeMath"); mx.operation = "MAXIMUM"
            nt.links.new(acc, mx.inputs[0]); nt.links.new(mr.outputs["Result"], mx.inputs[1])
            acc = mx.outputs[0]
    return acc

def skin_builder(nt, bsdf):
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(pale_skin_path)
    out = tex.outputs["Color"]
    # lips: paler (drain the red)
    lip = nt.nodes.new("ShaderNodeAttribute"); lip.attribute_name = "lips"
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = 1 - CLIN["lip_desat"]; hsv.inputs["Value"].default_value = 1.08
    nt.links.new(out, hsv.inputs["Color"])
    m1 = nt.nodes.new("ShaderNodeMix"); m1.data_type = "RGBA"
    nt.links.new(lip.outputs["Fac"], m1.inputs["Factor"]); nt.links.new(out, m1.inputs[6]); nt.links.new(hsv.outputs["Color"], m1.inputs[7])
    out = m1.outputs[2]
    # cropped dark-brown hair with a fine noise breakup; eyebrows
    for attr, col, nscale, lo, hi in (("hair", (0.045, 0.030, 0.020, 1), 900, 0.22, 0.42),
                                      ("brow", (0.04, 0.028, 0.02, 1), 1400, 0.25, 0.5)):
        if attr == "brow":
            a_out = brow_mask(nt)
        else:
            a = nt.nodes.new("ShaderNodeAttribute"); a.attribute_name = attr
            a_out = a.outputs["Fac"]
        nz = noise_node(nt, nscale, 8)
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["From Min"].default_value = lo; mr.inputs["From Max"].default_value = hi
        nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
        mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
        nt.links.new(a_out, mul.inputs[0]); nt.links.new(mr.outputs["Result"], mul.inputs[1])
        # soften coverage so scalp skin shows through a little (short crop)
        cov = nt.nodes.new("ShaderNodeMath"); cov.operation = "MULTIPLY"; cov.inputs[1].default_value = 0.97
        nt.links.new(mul.outputs[0], cov.inputs[0])
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
        mx.inputs[7].default_value = col
        nt.links.new(cov.outputs[0], mx.inputs["Factor"]); nt.links.new(out, mx.inputs[6])
        out = mx.outputs[2]
    hb = nt.nodes.new("ShaderNodeAttribute"); hb.attribute_name = "handblood"
    nz = noise_node(nt, 9, 4)
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.30
    mr.inputs["From Max"].default_value = 0.44
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    nt.links.new(hb.outputs["Fac"], mul.inputs[0]); nt.links.new(mr.outputs["Result"], mul.inputs[1])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    mx.inputs[7].default_value = (0.14, 0.008, 0.008, 1)
    nt.links.new(mul.outputs[0], mx.inputs["Factor"]); nt.links.new(out, mx.inputs[6])
    out = mx.outputs[2]
    nt.links.new(out, bsdf.inputs["Base Color"])

skin_path = bake_color(body, skin_builder, "skin_basecolor.jpg", 2048)

SWEAT_BONES = ("head", "jaw", "oculi", "orbicularis", "oris", "risorius", "levator", "special0",
               "temporalis", "neck0", "wrist", "metacarpal", "finger")
sweat = np.zeros(nbody, np.float32)
for bi, b in enumerate(bones):
    if b.startswith(SWEAT_BONES):
        sweat += W[bi, :nbody]
sweat = np.clip(sweat, 0, 1) * (1 - hair)          # not on the hair
a = body.data.attributes.new("sweat", "FLOAT", "POINT"); a.data.foreach_set("value", sweat)

def skin_rough_builder(nt, bsdf):
    sw = nt.nodes.new("ShaderNodeAttribute"); sw.attribute_name = "sweat"
    nz = noise_node(nt, 260, 3)      # fine droplet breakup
    beads = nt.nodes.new("ShaderNodeMapRange")
    beads.inputs["From Min"].default_value = 0.45; beads.inputs["From Max"].default_value = 0.65
    beads.inputs["To Min"].default_value = CLIN["sweat_roughness"] + 0.08
    beads.inputs["To Max"].default_value = CLIN["sweat_roughness"] - 0.10
    nt.links.new(nz.outputs["Fac"], beads.inputs["Value"])
    mx = nt.nodes.new("ShaderNodeMapRange")
    mx.inputs["To Min"].default_value = CLIN["skin_roughness"]
    nt.links.new(sw.outputs["Fac"], mx.inputs["Value"])
    nt.links.new(beads.outputs["Result"], mx.inputs["To Max"])
    comb = nt.nodes.new("ShaderNodeCombineColor"); comb.inputs[0].default_value = 1.0; comb.inputs[2].default_value = 0.0
    nt.links.new(mx.outputs["Result"], comb.inputs[1]); nt.links.new(comb.outputs[0], bsdf.inputs["Base Color"])
skin_mr_path = bake_color(body, skin_rough_builder, "skin_mr.jpg", 1024)

# --------------------------------------------------------------- clothing textures
suit_dir = os.path.join(MH, "clothes", "male_casualsuit02")
suit_normal = load_px(os.path.join(suit_dir, "male_casualsuit02_normal.png"), 1024)
save_px(suit_normal, "suit_normal.jpg", "JPEG", 90)

# Trouser blood mask (rest positions, metres). Lying supine, blood from an
# anterior-lateral wound runs laterally and posteriorly (to the floor) and wicks
# toward the knee: brief section 2 "Blood on the body".
def trouser_blood(rest):
    d = rest - wound_rest
    along = d[:, 1]                                     # + toward hip, - toward knee
    on_left = rest[:, 0] > 0.015
    # lateral (+x) and posterior (-z) of the thigh axis: where blood runs to the floor
    lat_post = np.clip(np.maximum((rest[:, 0] - axis_pt[0]) / 0.06, (axis_pt[2] - rest[:, 2]) / 0.05), 0, 1)
    ext_down = CLIN["trouser_soak_down"] * (0.55 + 0.45 * lat_post)
    ext_up = CLIN["trouser_soak_up"] * (0.6 + 0.8 * lat_post)
    s = np.where(along < 0, -along / ext_down, along / ext_up)
    soak = np.clip(1.15 - s, 0, 1) * on_left
    core = np.clip(1 - np.linalg.norm(d, axis=1) / 0.09, 0, 1)   # wettest near the wound
    # v1.1: wet runs down the back of the thigh, on the inner (medial, -x) and
    # outer side, toward the floor: shows the pool comes from the leg.
    post = np.clip((axis_pt[2] - rest[:, 2]) / 0.05, 0, 1)
    band = np.clip(1 - np.abs(along + 0.05) / 0.11, 0, 1)
    medial = np.clip((axis_pt[0] - rest[:, 0]) / 0.05, 0, 1)
    lateral = np.clip((rest[:, 0] - axis_pt[0]) / 0.05, 0, 1)
    run = band * on_left * np.clip(post * 1.4 + 0.6 * np.maximum(medial, lateral) * post, 0, 1)
    core = np.maximum(core, run * 0.95)
    soak = np.maximum(soak, run)
    return soak.astype(np.float32), core.astype(np.float32)

trest = np.zeros((len(trousers.data.vertices), 3)); trousers.data.vertices.foreach_get("co", trest.ravel())
soak, core = trouser_blood(trest)
for nm, arr in (("soak", soak), ("core", core)):
    a = trousers.data.attributes.new(nm, "FLOAT", "POINT"); a.data.foreach_set("value", arr)

suit_diffuse = os.path.join(suit_dir, "male_casualsuit02_diffuse.png")
BLOOD_DRY = (0.16, 0.012, 0.010, 1)    # soaked fabric, linear RGB
BLOOD_WET = (0.10, 0.004, 0.004, 1)

def trousers_builder(nt, bsdf):
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(suit_diffuse)
    # wet (drizzle) denim: a bit darker
    dark = nt.nodes.new("ShaderNodeHueSaturation"); dark.inputs["Value"].default_value = 0.72
    nt.links.new(tex.outputs["Color"], dark.inputs["Color"])
    sk = nt.nodes.new("ShaderNodeAttribute"); sk.attribute_name = "soak"
    nz = noise_node(nt, 18, 10)
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
    nt.links.new(sk.outputs["Fac"], add.inputs[0])
    sub = nt.nodes.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = 0.5
    nt.links.new(nz.outputs["Fac"], sub.inputs[0])
    sc_ = nt.nodes.new("ShaderNodeMath"); sc_.operation = "MULTIPLY"; sc_.inputs[1].default_value = 0.7
    nt.links.new(sub.outputs[0], sc_.inputs[0]); nt.links.new(sc_.outputs[0], add.inputs[1])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.42
    mr.inputs["From Max"].default_value = 0.55
    nt.links.new(add.outputs[0], mr.inputs["Value"])
    # blood colour keeps a little of the weave luminance
    mulc = nt.nodes.new("ShaderNodeMix"); mulc.data_type = "RGBA"; mulc.blend_type = "MULTIPLY"
    mulc.inputs["Factor"].default_value = 0.35
    mulc.inputs[6].default_value = BLOOD_DRY; nt.links.new(tex.outputs["Color"], mulc.inputs[7])
    cr = nt.nodes.new("ShaderNodeAttribute"); cr.attribute_name = "core"
    wet = nt.nodes.new("ShaderNodeMix"); wet.data_type = "RGBA"
    nt.links.new(cr.outputs["Fac"], wet.inputs["Factor"]); nt.links.new(mulc.outputs[2], wet.inputs[6])
    wet.inputs[7].default_value = BLOOD_WET
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    nt.links.new(mr.outputs["Result"], mx.inputs["Factor"])
    nt.links.new(dark.outputs["Color"], mx.inputs[6]); nt.links.new(wet.outputs[2], mx.inputs[7])
    nt.links.new(mx.outputs[2], bsdf.inputs["Base Color"])

trousers_path = bake_color(trousers, trousers_builder, "trousers_basecolor.jpg", 1024)

# Roughness for the trousers: soaked areas glossy. Bake the mask as a grey map,
# packed as glTF metallic-roughness (G = roughness, B = metallic = 0).
def trousers_rough_builder(nt, bsdf):
    sk = nt.nodes.new("ShaderNodeAttribute"); sk.attribute_name = "soak"
    nz = noise_node(nt, 18, 10)
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
    sub = nt.nodes.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = 0.5
    nt.links.new(nz.outputs["Fac"], sub.inputs[0])
    sc_ = nt.nodes.new("ShaderNodeMath"); sc_.operation = "MULTIPLY"; sc_.inputs[1].default_value = 0.7
    nt.links.new(sub.outputs[0], sc_.inputs[0])
    nt.links.new(sk.outputs["Fac"], add.inputs[0]); nt.links.new(sc_.outputs[0], add.inputs[1])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.42
    mr.inputs["From Max"].default_value = 0.55
    mr.inputs["To Min"].default_value = 0.82; mr.inputs["To Max"].default_value = 0.38
    nt.links.new(add.outputs[0], mr.inputs["Value"])
    comb = nt.nodes.new("ShaderNodeCombineColor")
    comb.inputs[0].default_value = 1.0; comb.inputs[2].default_value = 0.0
    nt.links.new(mr.outputs["Result"], comb.inputs[1])
    nt.links.new(comb.outputs[0], bsdf.inputs["Base Color"])

trousers_mr_path = bake_color(trousers, trousers_rough_builder, "trousers_mr.jpg", 512)

# Shirt: plain dark olive work fleece (the source shirt has a logo; replaced by a
# flat colour + the source normal map for folds).
shirt_px = np.ones((512, 512, 4), np.float32)
rng = np.random.default_rng(7)
base = np.array([0.150, 0.165, 0.120])      # sRGB, dark olive
grain = rng.normal(0, 0.012, (512, 512, 1))
shirt_px[..., :3] = np.clip(base + grain, 0, 1)
shirt_path = save_px(shirt_px, "shirt_basecolor.jpg")

boots_dir = os.path.join(MH, "clothes", "shoes03")
boots_px = load_px(os.path.join(boots_dir, "shoes03_diffuse.png"), 1024)
boots_path = save_px(boots_px, "boots_basecolor.jpg")

eyes_px = load_px(os.path.join(MH, "eyes", "materials", "brown_eye.png"), 512)
eyes_path = save_px(eyes_px, "eyes_basecolor.jpg")

# ------------------------------------------------------------- final materials
def pbr(name, color_path=None, color=None, rough=0.6, normal_path=None, mr_path=None,
        normal_strength=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    if color_path:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(color_path)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    else:
        b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = 0.0
    if mr_path:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(mr_path)
        t.image.colorspace_settings.name = "Non-Color"
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(t.outputs["Color"], sep.inputs[0])
        nt.links.new(sep.outputs[1], b.inputs["Roughness"]); nt.links.new(sep.outputs[2], b.inputs["Metallic"])
    if normal_path:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(normal_path)
        t.image.colorspace_settings.name = "Non-Color"
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(t.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m

M = {
    "skin": pbr("skin", skin_path, mr_path=skin_mr_path),
    "trousers": pbr("trousers", trousers_path, mr_path=trousers_mr_path,
                    normal_path=os.path.join(TEX, "suit_normal.jpg")),
    "shirt": pbr("shirt", shirt_path, rough=0.85, normal_path=os.path.join(TEX, "suit_normal.jpg")),
    "boots": pbr("boots", boots_path, rough=0.45),
    "eyes": pbr("eyes", eyes_path, rough=0.15),
    "blood_wet": pbr("blood_wet", color=(0.085, 0.003, 0.003, 1), rough=0.08),
    "wound": pbr("wound", color=(0.22, 0.015, 0.012, 1), rough=0.25),
}
for ob, key in ((body, "skin"), (trousers, "trousers"), (shirt, "shirt"), (boots, "boots"),
                (proxy_objs["eyes"], "eyes")):
    ob.data.materials.clear(); ob.data.materials.append(M[key])

exec(compile(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_stage3.py")).read(),
             "build_stage3.py", "exec"))

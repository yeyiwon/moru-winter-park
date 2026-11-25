"""DINO suit asset for WINTERLIGHT.

Builds a low-poly garment with UVs and a detailed high-poly twin (gathers, seams, stitches,
quilting, stuffed spikes), bakes colour, object-space normals and ambient occlusion from the
high-poly onto the low-poly in Blender, and writes a small JS mesh module plus two WebP textures.

Coordinates are Moru's body space: y up, +z is the face, the body is a ball of radius ~0.74.
"""
import base64, json, math, os, sys
import numpy as np
import bpy

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/dino'
SIZE = int(os.environ.get('DINO_SIZE', 1024))
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

SAGE = np.array([0.38, 0.53, 0.33]); SAGE_LIGHT = np.array([0.44, 0.59, 0.38]); THREAD = np.array([0.80, 0.88, 0.70])
CREAM = np.array([1.0, 0.90, 0.62]); TOOTH = np.array([1.0, 0.99, 0.94]); SPIKE = np.array([1.0, 0.80, 0.40])

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def shell(d):
    """Distance from the body centre to just outside the fur along unit direction d."""
    return 1 / np.sqrt((d[..., 0] / .805) ** 2 + (d[..., 1] / .805) ** 2 + (d[..., 2] / .735) ** 2)

def unit(v): return v / np.linalg.norm(v, axis=-1, keepdims=True)

def noise(p, f, seed=0):
    """Cheap smooth value noise from a few rotated sines; enough for cloth unevenness."""
    r = np.random.default_rng(seed); out = 0
    for k in range(5):
        w = r.normal(size=3); w /= np.linalg.norm(w); out = out + np.sin((p @ w) * f * (1 + .37 * k) + r.uniform(0, 6.28)) / (1 + .6 * k)
    return out / 2.2

# ---- garment landmarks ----
FACE = unit(np.array([0, .09, 1.]))            # the opening looks slightly up, like the face
FX = np.array([1., 0, 0]); FY = unit(np.cross(FACE, FX))

def open_rho(alpha):
    """Angular radius of the face opening: wide, taller above the eyes than below the mouth."""
    up = smooth(np.sin(alpha), -.5, .5); rv = .335 + .095 * up
    return 1 / np.sqrt((np.cos(alpha) / .66) ** 2 + (np.sin(alpha) / rv) ** 2)

def face_polar(d):
    z = np.clip(d @ FACE, -1, 1); rho = np.arccos(z); alpha = np.arctan2(d @ FY, d @ FX); return alpha, rho

def crease_y(theta):
    """Height of the neck gather: high at the nape, dipping under the chin (theta=0 is the back)."""
    return -.12 - .2 * np.sin(np.abs(theta) / 2) ** 3

def theta_of(d): return np.arctan2(d[..., 0], -d[..., 2])

def hood_puff(d):
    """How far the hood stands off the head. It is its own volume: fuller at the crown and nape."""
    theta = theta_of(d); back = np.cos(theta) * .5 + .5
    return .06 + .075 * back * smooth(d[..., 1], -.35, .45) + .03 * smooth(d[..., 1], .2, .9)

# ---- detail fields used only by the high-poly ----
def cloth(p): return .0035 * noise(p, 9, 1) + .0018 * noise(p, 23, 2)

def gathers(d, edge, reach, count, seed):
    """Radial pleats that fade away from a gathered edge."""
    theta = theta_of(d); r = np.random.default_rng(seed)
    wob = sum(np.sin(theta * k + r.uniform(0, 6.28)) / k for k in (3, 5, 8))
    return np.exp(-np.maximum(edge, 0) / reach) * (.011 * np.sin(theta * count + 1.7 * wob) + .006 * np.sin(theta * count * 1.9 + wob))

def stitch(dist, along, pitch, width=.0085):
    """Dashes of thread running `dist` away from a seam; returns (height, mask)."""
    m = np.exp(-(dist / width) ** 2) * (np.mod(along / pitch, 1) < .62)
    return .005 * m, m

class Chart:
    """A parametric patch. `f(u,v,high)` returns position, colour and (optionally) extra height."""
    def __init__(self, name, f, rect, low, high, wrap_u=False, group='suit', keep=None):
        self.name, self.f, self.rect, self.low, self.high, self.wrap_u, self.group, self.keep = name, f, rect, low, high, wrap_u, group, keep

    def grid(self, nu, nv, high):
        u, v = np.meshgrid(np.linspace(0, 1, nu + 1), np.linspace(0, 1, nv + 1), indexing='xy')
        def displaced(u, v):
            p, col, h = self.f(u, v, high)
            return p, col, h
        p, col, h = displaced(u, v)
        if high:
            e = 1e-3
            pu = self.f(np.clip(u + e, 0, 1), v, high)[0] - self.f(np.clip(u - e, 0, 1), v, high)[0]
            pv = self.f(u, np.clip(v + e, 0, 1), high)[0] - self.f(u, np.clip(v - e, 0, 1), high)[0]
            n = np.cross(pu, pv); n = unit(n + 1e-12)
            flip = np.sign(np.sum(n * (p - self.centre(p)), axis=-1, keepdims=True)); flip[flip == 0] = 1
            p = p + n * flip * h[..., None]
        x0, y0, x1, y1 = self.rect
        uv = np.stack([x0 + u * (x1 - x0), y0 + v * (y1 - y0)], -1)
        idx = np.arange((nu + 1) * (nv + 1)).reshape(nv + 1, nu + 1)
        quads = np.stack([idx[:-1, :-1], idx[:-1, 1:], idx[1:, 1:], idx[1:, :-1]], -1).reshape(-1, 4)
        tri = p.reshape(-1, 3)[quads]; fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 3] - tri[:, 0])
        if np.sum(fn * (tri.mean(1) - self.centre(p))) < 0: quads = quads[:, ::-1]
        if self.keep is not None:
            ok = self.keep(u, v).reshape(-1); quads = quads[ok[quads].any(1)]
        return p.reshape(-1, 3), uv.reshape(-1, 2), col.reshape(-1, 3), quads

    def centre(self, p): return getattr(self, 'origin', np.zeros(3))

# ---- hood cap: crown, sides and nape, down to a rolled lip over the neck gather ----
CLOUD = [(0, 0, .075), (.085, .012, .055), (-.085, .008, .052), (.025, -.05, .05)]

def hood_cap(u, v, high):
    theta = (u * 2 - 1) * np.pi; yc = crease_y(theta)
    # v runs from the crown to the collar; the last stretch is a stuffed hem that overhangs the body
    w = np.clip((v - .86) / .14, 0, 1)
    ymax = .865; ang1 = np.arccos(np.clip(yc / ymax, -1, 1)); ang = np.minimum(v / .86, 1) * ang1
    d = np.stack([np.sin(theta) * np.sin(ang), np.cos(ang), -np.cos(theta) * np.sin(ang)], -1)
    puff = hood_puff(d) * (1 - smooth(w, .5, 1.)) + .016 * np.sin(np.pi * w) + .002
    r = shell(d) + puff
    p = d * r[..., None]
    p[..., 1] -= w * .07 * (1 + .18 * np.sin(theta * 7 + 1.3))     # the hem hangs unevenly, like cloth
    if not high:
        # game mesh only: tuck the edge that runs under the face frame onto a ring below its crest,
        # so the coarse boundary can never poke through the padding
        alpha, rho = face_polar(d); ring = open_rho(alpha) + .09; under = rho < ring
        d2 = np.cos(ring)[..., None] * FACE + np.sin(ring)[..., None] * (np.cos(alpha)[..., None] * FX + np.sin(alpha)[..., None] * FY)
        p = np.where(under[..., None], d2 * (shell(d2) + .02)[..., None], p)
    h = np.zeros_like(r); col = np.broadcast_to(SAGE, p.shape).copy()
    # stitched cloud patch on one side of the hood
    ca = (theta - 2.05) * np.sin(ang) * r; cb = (ang - .98) * r
    sdf = np.min(np.stack([np.hypot(ca - x, cb - y) - rad for x, y, rad in CLOUD]), 0)
    col[sdf < 0] = CREAM
    if high:
        edge = (.86 - np.minimum(v, .86)) * 1.5
        h = cloth(p) + gathers(d, edge, .2, 22, 3) * (1 - .6 * w)
        h -= .007 * np.exp(-((v - .86) / .012) ** 2)                # seam where the hem is turned
        seam = np.abs(np.sin(theta)) * np.sin(ang) * r
        back = (np.cos(theta) > 0) | (ang < .5)
        h -= .006 * np.exp(-(seam / .009) ** 2) * back
        st, m = stitch(np.abs(seam) - .024, ang * r, .055); h += st * back; col = col + (THREAD - col) * (m * back)[..., None]
        h += .009 * smooth(-sdf, 0, .022) - .005 * np.exp(-(sdf / .006) ** 2)
        st, m = stitch(sdf + .016, np.arctan2(cb, ca) * .08, .05); h += st; col = col + (TOOTH * .96 - col) * (m * .9)[..., None]
    return p, col, h

def hood_keep(u, v):
    theta = (u * 2 - 1) * np.pi; ang1 = np.arccos(np.clip(crease_y(theta) / .865, -1, 1)); ang = np.minimum(v / .86, 1) * ang1
    d = np.stack([np.sin(theta) * np.sin(ang), np.cos(ang), -np.cos(theta) * np.sin(ang)], -1)
    alpha, rho = face_polar(d); return rho > open_rho(alpha) + .13          # hidden under the face frame

# ---- face frame: a padded facing sewn round the opening, wider across the brow ----
def frame_width(alpha): return .17 + .1 * smooth(np.sin(alpha), .0, .9)

def face_frame(u, v, high):
    alpha = u * 2 * np.pi - np.pi / 2                # the seam of this chart sits under the chin
    r0 = open_rho(alpha); w = frame_width(alpha)
    # v: 0 inner edge against the face, then the crest of the roll, 1 outer edge stitched to the hood
    t = np.clip((v - .12) / .88, 0, 1); rho = r0 - .03 * (1 - smooth(v, 0, .12)) + w * t
    d = np.cos(rho)[..., None] * FACE + np.sin(rho)[..., None] * (np.cos(alpha)[..., None] * FX + np.sin(alpha)[..., None] * FY)
    brow = smooth(np.sin(alpha), .15, .85)
    roll = np.sin(np.pi * np.clip(t, 0, 1) ** .6) ** .75          # pillow section, crest near the inner edge
    inner = smooth(v, 0, .12)                                      # dives in towards the face
    puff = hood_puff(d) * smooth(t, .0, .9) + .014 + (.055 + .06 * brow) * roll
    r = shell(d) + puff * inner - .02 * (1 - inner)
    p = d * r[..., None]
    h = np.zeros_like(r); col = np.broadcast_to(SAGE_LIGHT, p.shape).copy()
    if high:
        h = cloth(p) * .8
        h -= .006 * np.exp(-((t - .965) / .03) ** 2)
        st, m = stitch(np.abs(t - .84) * w, alpha * .7, .06); h += st; col = col + (THREAD - SAGE_LIGHT) * m[..., None]
        ribs = np.abs(np.sin(alpha * 11)) ** 16 * np.sin(np.pi * t) * .007; h -= ribs
    return p, col, h

# ---- body: snug below the gather, a little pear shaped, gathered again at the hem ----
def body(u, v, high):
    theta = -(u * 2 - 1) * np.pi                     # reversed so the surface faces outward
    yc = crease_y(theta); y0 = yc + .06; y1 = -.64
    y = y0 + (y1 - y0) * v
    rr = np.sqrt(np.clip(1 - (y / .805) ** 2, 0, 1))
    d = unit(np.stack([np.sin(theta) * rr, y / .805, -np.cos(theta) * rr], -1))
    hem = smooth(v, .86, 1.)
    r = shell(d) + .006 + .03 * np.sin(np.pi * np.clip(v, 0, 1)) ** 1.3 - .05 * hem ** 2 - .02 * (1 - smooth(v, 0, .2))
    p = d * r[..., None]
    h = np.zeros_like(r); col = np.broadcast_to(SAGE, p.shape).copy()
    # cream belly panel, sewn on the front
    bx = p[..., 0] / .37; by = (p[..., 1] + .5) / .155; front = p[..., 2] > 0
    oval = np.sqrt(bx ** 2 + by ** 2); panel = (oval < 1) & front
    col[panel] = CREAM
    if high:
        h = cloth(p) + gathers(d, v, .1, 30, 5) * .9 + gathers(d, 1 - v, .1, 34, 6)
        edge = (oval - 1) * .22
        h += .014 * smooth(1 - oval, 0, .35) * front                                    # the panel is padded
        h -= .006 * np.exp(-(edge / .008) ** 2) * front
        st, m = stitch(np.abs(edge + .022), np.arctan2(by, bx) * .25, .05); h += st * front; col = col + (TOOTH - col) * (m * front * .85)[..., None]
        for k in (-.38, .3):                                                           # quilted ribs
            line = np.exp(-((by - k - .12 * bx ** 2) / .09) ** 2) * (oval < .9) * front; h -= .008 * line
        seam = np.abs(np.sin(theta)) * rr * r; back = np.cos(theta) > 0
        h -= .005 * np.exp(-(seam / .008) ** 2) * back
    return p, col, h

# ---- stuffed parts: teeth, spikes and the tail ----
def pillow(base, axis, side, length, width, thick, colour, a=1.5, b=.75):
    """A stuffed cushion sewn on at its base. Width follows (1 - s^a)^b: a=3,b=.5 is a round tooth,
    a=1.5,b=.75 a plump rounded spike."""
    axis = unit(np.array(axis, float)); side = unit(np.array(side, float)); out = unit(np.cross(side, axis))
    def f(u, v, high):
        ang = u * 2 * np.pi; sv = v
        w = np.clip(1 - sv ** a, 0, 1) ** b; tuck = (.35 + .65 * smooth(sv, 0, .16))           # pulled in at the seam
        x = np.cos(ang) * width * .5 * w * tuck; z = np.sin(ang) * thick * .5 * w ** .75 * tuck
        p = np.array(base, float) + axis * (sv * length)[..., None] + side * x[..., None] + out * z[..., None]
        h = np.zeros_like(sv); col = np.broadcast_to(np.array(colour), p.shape).copy()
        if high:
            h = cloth(p) * .7 - .004 * np.exp(-(np.sin(ang) / .1) ** 2)                # seam round the edge
        return p, col, h
    return f

TAIL0 = np.array([0, -.4, -.54]); TAIL_L = .56

def tail_axis(sv): return np.stack([np.zeros_like(sv), .2 * sv ** 1.7, -sv * TAIL_L], -1) + TAIL0

def tail_rad(sv): return (.2 * (1 - sv) ** .8 + .055 * (1 - sv ** 3)) * np.sin(np.pi * np.clip(sv * .5 + .5, 0, 1)) ** .22

def tail(u, v, high):
    a = u * 2 * np.pi; sv = v; rad = tail_rad(sv)
    p = tail_axis(sv) + np.stack([np.cos(a) * rad, np.sin(a) * rad * .92, np.zeros_like(a)], -1)
    h = np.zeros_like(sv); col = np.broadcast_to(SAGE, p.shape).copy()
    if high:
        h = cloth(p) + gathers(unit(p), sv, .1, 14, 9) * .8 - .005 * np.exp(-(np.cos(a) / .06) ** 2) * (np.sin(a) > 0)
    return p, col, h

def build_charts():
    charts = [
        Chart('hood', hood_cap, (.004, .53, .996, .996), (54, 22), (1000, 420), group='suit', keep=hood_keep),
        Chart('frame', face_frame, (.004, .40, .996, .52), (60, 9), (1200, 170), group='suit'),
        Chart('body', body, (.004, .15, .996, .39), (50, 9), (1000, 300), group='suit'),
        Chart('tail', tail, (.69, .004, .996, .14), (16, 9), (260, 200), group='tail'),
    ]
    charts[3].origin = np.array([0, -.3, -.85])
    tiles = []
    # small rounded teeth hang from the padded brow, slightly uneven like hand-cut felt
    for k in range(-3, 4):
        alpha = np.pi / 2 - k * .27
        rho = open_rho(alpha) + .035
        d = np.cos(rho) * FACE + np.sin(rho) * (np.cos(alpha) * FX + np.sin(alpha) * FY)
        brow = float(smooth(np.sin(alpha), .15, .85))
        base = d * (shell(d) + .05 + .05 * brow); down = unit(-FY + FACE * .5 - FX * .12 * k / 3)
        size = 1 - .06 * abs(k) + .05 * rng.uniform(-1, 1)
        side = unit(np.cross(d, down))
        tiles.append((f'tooth{k}', pillow(base - down * .02, down, side, .12 * size, .125 * size, .075, TOOTH, 3., .5), base + down * .05, (10, 5), (90, 70)))
    # plump stuffed spikes down the centre seam, largest on the crown
    for i, (ang, size) in enumerate([(-.42, .78), (.02, 1.), (.48, .96), (.92, .84), (1.3, .68)]):
        d = np.array([0, math.cos(ang), -math.sin(ang)]); base = d * (shell(d) + hood_puff(d) - .035)
        tiles.append((f'spike{i}', pillow(base, d, [0, -math.sin(ang), -math.cos(ang)], .25 * size, .3 * size, .21 * size, SPIKE, 1.6, .7), base + d * .1, (12, 6), (130, 100)))
    for i, sv in enumerate([.3, .62]):
        c = tail_axis(np.array(sv)); base = c + np.array([0, float(tail_rad(np.array(sv))) * .92 - .03, 0]); up = np.array([0, 1, -.35]); k = 1 - .28 * i
        tiles.append((f'tailspike{i}', pillow(base, up, [0, .35, 1.], .15 * k, .18 * k, .13 * k, SPIKE, 1.6, .7), base + unit(up) * .05, (10, 5), (100, 80)))
    cols = 8
    for i, (name, f, origin, low, high) in enumerate(tiles):
        cx, cy = i % cols, i // cols
        rect = (.004 + cx * .085, .004 + cy * .07, .004 + cx * .085 + .079, .004 + cy * .07 + .064)
        c = Chart(name, f, rect, low, high, group='tail' if name.startswith('tailspike') else 'suit'); c.origin = origin; charts.append(c)
    return charts

def assemble(charts, high):
    P, UV, C, Q, G = [], [], [], [], []; n = 0
    for c in charts:
        nu, nv = c.high if high else c.low
        p, uv, col, quads = c.grid(nu, nv, high)
        P.append(p); UV.append(uv); C.append(col); Q.append(quads + n); G.append(np.full(len(quads), 0 if c.group == 'suit' else 1)); n += len(p)
    return np.concatenate(P), np.concatenate(UV), np.clip(np.concatenate(C), 0, 1), np.concatenate(Q), np.concatenate(G)

def to_object(name, P, UV, C, Q):
    mesh = bpy.data.meshes.new(name)
    mesh.vertices.add(len(P)); mesh.vertices.foreach_set('co', P.astype(np.float32).ravel())
    mesh.loops.add(Q.size); mesh.loops.foreach_set('vertex_index', Q.astype(np.int32).ravel())
    mesh.polygons.add(len(Q)); mesh.polygons.foreach_set('loop_start', np.arange(0, Q.size, 4, dtype=np.int32)); mesh.polygons.foreach_set('loop_total', np.full(len(Q), 4, np.int32))
    mesh.update(calc_edges=True); mesh.validate()
    uv = mesh.uv_layers.new(name='UVMap'); uv.data.foreach_set('uv', UV[Q.ravel()].astype(np.float32).ravel())
    col = mesh.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    col.data.foreach_set('color', np.concatenate([C, np.ones((len(C), 1))], 1).astype(np.float32).ravel())
    mesh.polygons.foreach_set('use_smooth', np.ones(len(Q), bool))
    obj = bpy.data.objects.new(name, mesh); bpy.context.scene.collection.objects.link(obj); return obj

def bake(obj, kind, **kw):
    """Bake straight onto the detailed mesh through its own UVs: no ray transfer, so no cross-talk."""
    image = bpy.data.images.new(kind, SIZE, SIZE, alpha=False, float_buffer=True); image.colorspace_settings.name = 'Non-Color'
    mat = obj.data.materials[0]; node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = image; mat.node_tree.nodes.active = node
    for o in bpy.context.scene.objects: o.select_set(False)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type=kind, use_selected_to_active=False, margin=64, **kw)
    px = np.array(image.pixels[:], np.float32).reshape(SIZE, SIZE, 4)[::-1, :, :3]
    mat.node_tree.nodes.remove(node); return px

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene; scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = int(os.environ.get('DINO_SAMPLES', 48))
    charts = build_charts()
    lp, luv, lc, lq, lg = assemble(charts, False); hp, huv, hc, hq, hg = assemble(charts, True)
    low = to_object('low', lp, luv, lc, lq); high = to_object('high', hp, huv, hc, hq)
    hm = bpy.data.materials.new('high'); hm.use_nodes = True; bsdf = hm.node_tree.nodes['Principled BSDF']; attr = hm.node_tree.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
    hm.node_tree.links.new(attr.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 1; high.data.materials.append(hm)
    # a stand-in for the body so occlusion knows the suit is worn, not hollow
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=40); ball = bpy.context.object; ball.scale = (.775, .775, .705)
    lm = bpy.data.materials.new('low'); lm.use_nodes = True; low.data.materials.append(lm)
    low.hide_render = True
    normal = bake(high, 'NORMAL', normal_space='OBJECT')
    scene.render.bake.use_pass_direct = False; scene.render.bake.use_pass_indirect = False; scene.render.bake.use_pass_color = True
    colour = bake(high, 'DIFFUSE')
    scene.world = bpy.data.worlds.new('w'); ao = bake(high, 'AO')[..., 0]
    from PIL import Image
    shade = .68 + .32 * np.clip(ao, 0, 1) ** 1.2
    srgb = np.clip(colour * shade[..., None], 0, 1) ** (1 / 2.2)
    Image.fromarray((srgb * 255).astype(np.uint8)).resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(f'{OUT}/dino-color.webp', quality=86, method=6)
    Image.fromarray((np.clip(normal, 0, 1) * 255).astype(np.uint8)).save(f'{OUT}/dino-normal.webp', quality=int(os.environ.get('DINO_NQ', 86)), method=6)
    Image.fromarray((srgb * 255).astype(np.uint8)).save(f'{OUT}/dino-color.png'); Image.fromarray((np.clip(normal, 0, 1) * 255).astype(np.uint8)).save(f'{OUT}/dino-normal.png')
    # ---- game mesh: quantised positions and UVs, one geometry for the suit and one for the tail ----
    out = {}
    for gi, name in enumerate(['suit', 'tail']):
        quads = lq[lg == gi]; used = np.unique(quads); remap = -np.ones(len(lp), int); remap[used] = np.arange(len(used))
        tri = np.concatenate([quads[:, [0, 1, 2]], quads[:, [0, 2, 3]]]); tri = remap[tri]
        p = lp[used] - (TAIL0 if name == 'tail' else 0)
        lo, hi = p.min(0), p.max(0); q = np.round((p - lo) / (hi - lo) * 65535).astype('<u2'); uvq = np.round(np.clip(luv[used], 0, 1) * 65535).astype('<u2'); uvq[:, 1] = 65535 - uvq[:, 1]
        out[name] = dict(min=lo.round(5).tolist(), max=hi.round(5).tolist(), position=base64.b64encode(q.tobytes()).decode(), uv=base64.b64encode(uvq.tobytes()).decode(), index=base64.b64encode(tri.astype('<u2').tobytes()).decode(), vertices=int(len(used)), triangles=int(len(tri)))
    with open(f'{OUT}/dino-suit-mesh.js', 'w') as f:
        f.write('// Generated by the DINO suit asset script (Blender bake). Positions and UVs are 16-bit.\nexport const dinoSuitMesh=' + json.dumps(out, separators=(',', ':')) + ';\n')
    print('DONE', {k: (v['vertices'], v['triangles']) for k, v in out.items()}, 'high verts', len(hp))

main()

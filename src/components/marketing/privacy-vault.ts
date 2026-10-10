import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

export type VaultTone = "dark" | "light";

const PALETTES = {
  dark: {
    identity: 0x9ff0c4,
    content: 0x7fa597,
    analytics: 0xffd27a,
    withheld: 0x8fa39b,
    fill: 0.05,
    halo: true,
  },
  light: {
    identity: 0x123d31,
    content: 0x5e6b67,
    analytics: 0xc2302a,
    withheld: 0xb9b5a8,
    fill: 0.06,
    halo: false,
  },
} as const;

/** Plate heights for the three Postgres schemas. */
const Y = { identity: 1.7, content: 0, analytics: -1.7 } as const;
const PLATE = { w: 4.4, d: 3.0 } as const;
const GATE = new THREE.Vector3(1.45, 0, 0.55);

const COLUMNS = ["Cardiac", "Respiratory", "Allergic", "Toxicology", "Paediatric"] as const;
// Paediatric runs are rare, so its column usually stays under five and withheld.
const WEIGHTS = [3, 2.4, 2, 1.5, 0.45];
const K = 5;
const CAP = 6;
const CUBE = 0.2;
const STEP = 0.23;

export type VaultAnchors = { identity: THREE.Vector3; content: THREE.Vector3; analytics: THREE.Vector3; gate: THREE.Vector3; withheld: THREE.Vector3 };

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function roundedRect(w: number, d: number, r: number, y: number) {
  const pts: number[] = [];
  const corners = [
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, Math.PI / 2],
    [-w / 2 + r, -d / 2 + r, Math.PI],
    [w / 2 - r, -d / 2 + r, (3 * Math.PI) / 2],
  ] as const;
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * (Math.PI / 2);
      pts.push(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
    }
  }
  pts.push(pts[0], pts[1], pts[2]);
  return pts;
}

function circle(r: number, y: number, segments = 64, at = GATE) {
  const pts: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(at.x + Math.cos(a) * r, y, at.z + Math.sin(a) * r);
  }
  return pts;
}

type Flight = {
  core: THREE.Mesh;
  glow: THREE.Sprite;
  cube: THREE.Mesh;
  cubeEdge: THREE.LineSegments;
  slot: number;
  column: number;
  t: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
};

/**
 * The privacy model as an instrument. Named records sit on the identity
 * plate. The only way down is the HMAC gate: a record falls through it and
 * lands on analytics as an anonymous cube, stacked by clinical area. A column
 * stays grey and withheld until five people are in it.
 */
export function createVault(host: HTMLElement, opts: { tone: VaultTone; still: boolean }) {
  const P = PALETTES[opts.tone];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(7.2, 5.35, 9.1);
  camera.lookAt(0, -0.15, 0);

  const rig = new THREE.Group();
  scene.add(rig);
  const glow = glowTexture();
  const resolution = new THREE.Vector2(1, 1);
  const lineMats: LineMaterial[] = [];

  const line = (positions: number[], color: number, width: number, opacity: number, additive = false, parent: THREE.Object3D = rig) => {
    const geo = new LineGeometry();
    geo.setPositions(positions);
    const mat = new LineMaterial({
      color,
      linewidth: width,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      resolution,
    });
    lineMats.push(mat);
    const l = new Line2(geo, mat);
    parent.add(l);
    return l;
  };

  // ─── The three plates ────────────────────────────────────────────────────
  const plates = [
    { y: Y.identity, color: P.identity },
    { y: Y.content, color: P.content },
    { y: Y.analytics, color: P.analytics },
  ];
  for (const p of plates) {
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(PLATE.w, PLATE.d),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: P.fill, depthWrite: false, side: THREE.DoubleSide }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = p.y;
    rig.add(fill);
    const rect = roundedRect(PLATE.w, PLATE.d, 0.16, p.y);
    line(rect, p.color, 1.4, opts.tone === "dark" ? 0.75 : 0.6);
    if (P.halo) line(rect, p.color, 8, 0.07, true);
    // Inner rule, like the margin on a printed chart.
    line(roundedRect(PLATE.w - 0.36, PLATE.d - 0.36, 0.08, p.y), p.color, 0.8, 0.18);
  }

  // ─── The gate and its shaft ──────────────────────────────────────────────
  // The hexagonal gate turns slowly about its own centre.
  const gateSpin = new THREE.Group();
  gateSpin.position.set(GATE.x, 0, GATE.z);
  rig.add(gateSpin);
  const origin = new THREE.Vector3();
  line(circle(0.34, Y.identity + 0.01, 6, origin), P.identity, 2, 1, false, gateSpin);
  if (P.halo) line(circle(0.34, Y.identity + 0.01, 6, origin), P.identity, 10, 0.18, true, gateSpin);
  line(circle(0.42, Y.identity + 0.01), P.identity, 0.8, 0.35);
  line(circle(0.34, Y.content + 0.01), P.content, 1, 0.5);
  line(circle(0.34, Y.analytics + 0.01), P.analytics, 1.4, 0.7);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = GATE.x + Math.cos(a) * 0.3;
    const z = GATE.z + Math.sin(a) * 0.3;
    line([x, Y.identity, z, x, Y.analytics, z], P.content, 0.8, 0.22);
  }
  const gateFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: P.identity, transparent: true, opacity: 0, depthWrite: false, blending: P.halo ? THREE.AdditiveBlending : THREE.NormalBlending }));
  gateFlash.position.set(GATE.x, Y.identity, GATE.z);
  gateFlash.scale.setScalar(1.3);
  rig.add(gateFlash);

  // ─── Content: scenario cards, each with a small trace ───────────────────
  const cards = [
    [-1.45, -0.75],
    [-0.45, -0.75],
    [0.55, -0.75],
    [-1.45, 0.45],
    [-0.45, 0.45],
  ];
  for (const [cx, cz] of cards) {
    line(roundedRect(0.78, 0.5, 0.05, Y.content + 0.01).map((v, i) => (i % 3 === 0 ? v + cx : i % 3 === 2 ? v + cz : v)), P.content, 1, 0.55);
    const trace: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const spike = u > 0.42 && u < 0.5 ? (u < 0.46 ? (u - 0.42) * 4.5 : (0.5 - u) * 4.5) : 0;
      trace.push(cx - 0.3 + u * 0.6, Y.content + 0.02, cz + 0.05 - spike);
    }
    line(trace, P.identity, 1, 0.4);
  }

  // ─── Identity: named records in a grid ─────────────────────────────────
  const slots: THREE.Vector3[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      slots.push(new THREE.Vector3(-1.75 + c * 0.6, Y.identity + 0.07, -0.95 + r * 0.8));
    }
  }
  const coreGeo = new THREE.SphereGeometry(0.065, 16, 12);
  const residents = slots.map((s) => {
    const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: P.identity, transparent: true }));
    core.position.copy(s);
    rig.add(core);
    const tag = line([s.x + 0.12, s.y - 0.06, s.z, s.x + 0.36, s.y - 0.06, s.z], P.identity, 1, 0.45);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: P.identity, transparent: true, opacity: P.halo ? 0.55 : 0, depthWrite: false, blending: P.halo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    halo.position.copy(s);
    halo.scale.setScalar(0.34);
    rig.add(halo);
    return { core, halo, tag, busy: false, away: 0 };
  });

  // ─── Analytics: columns by clinical area ───────────────────────────────
  const columnBase = COLUMNS.map((_, i) => new THREE.Vector3(-1.75 + i * 0.55, Y.analytics, 0.85));
  for (const b of columnBase) {
    line(roundedRect(0.34, 0.34, 0.04, Y.analytics + 0.01).map((v, i) => (i % 3 === 0 ? v + b.x : i % 3 === 2 ? v + b.z : v)), P.analytics, 0.8, 0.35);
  }
  const cubeGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
  const stacks: Flight[][] = COLUMNS.map(() => []);

  const records: Flight[] = [];
  const withheldColor = new THREE.Color(P.withheld);
  const litColor = new THREE.Color(P.analytics);
  const idColor = new THREE.Color(P.identity);

  const makeRecord = (slot: number, column: number): Flight => {
    const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: P.identity, transparent: true }));
    const glowS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: P.identity, transparent: true, opacity: P.halo ? 0.8 : 0, depthWrite: false, blending: P.halo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    glowS.scale.setScalar(0.42);
    const cube = new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({ color: P.withheld, transparent: true, opacity: 0 }));
    const cubeEdge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: P.withheld, transparent: true, opacity: 0 }));
    rig.add(core, glowS, cube, cubeEdge);
    return { core, glow: glowS, cube, cubeEdge, slot, column, t: 0, from: slots[slot].clone(), to: new THREE.Vector3() };
  };

  const pickColumn = () => {
    const open = COLUMNS.map((_, i) => i).filter((i) => stacks[i].length + inFlight(i) < CAP);
    if (!open.length) return -1;
    const total = open.reduce((s, i) => s + WEIGHTS[i], 0);
    let r = Math.random() * total;
    for (const i of open) {
      r -= WEIGHTS[i];
      if (r <= 0) return i;
    }
    return open[open.length - 1];
  };
  const inFlight = (col: number) => records.filter((r) => r.column === col).length;

  const settleColor = (col: number) => {
    const lit = stacks[col].length >= K;
    for (const r of stacks[col]) {
      (r.cube.material as THREE.MeshBasicMaterial).color.copy(lit ? litColor : withheldColor);
      (r.cube.material as THREE.MeshBasicMaterial).opacity = lit ? 0.9 : 0.22;
      (r.cubeEdge.material as THREE.LineBasicMaterial).color.copy(lit ? litColor : withheldColor);
      (r.cubeEdge.material as THREE.LineBasicMaterial).opacity = 1;
    }
  };

  const place = (r: Flight) => {
    const b = columnBase[r.column];
    const i = stacks[r.column].length;
    stacks[r.column].push(r);
    r.cube.position.set(b.x, Y.analytics + CUBE / 2 + 0.02 + i * STEP, b.z);
    r.cubeEdge.position.copy(r.cube.position);
    r.core.visible = false;
    r.glow.visible = false;
    settleColor(r.column);
  };

  // Phases, in seconds: glide to the gate, fall through it, slide to the column.
  const GLIDE = 0.9;
  const FALL = 1.2;
  const SLIDE = 0.8;
  const tmp = new THREE.Vector3();

  const launch = () => {
    const free = residents.map((r, i) => i).filter((i) => !residents[i].busy);
    const column = pickColumn();
    if (!free.length || column < 0) return false;
    const slot = free[Math.floor(Math.random() * free.length)];
    const res = residents[slot];
    res.busy = true;
    res.away = 0;
    res.core.visible = false;
    res.halo.visible = false;
    (res.tag.material as LineMaterial).opacity = 0.08;
    records.push(makeRecord(slot, column));
    return true;
  };

  let fade = 1; // whole-scene fade used when the board resets
  let resetting = false;

  const step = (dt: number) => {
    for (let i = records.length - 1; i >= 0; i--) {
      const r = records[i];
      r.t += dt;
      const coreMat = r.core.material as THREE.MeshBasicMaterial;
      const glowMat = r.glow.material as THREE.SpriteMaterial;
      const cubeMat = r.cube.material as THREE.MeshBasicMaterial;
      const edgeMat = r.cubeEdge.material as THREE.LineBasicMaterial;
      if (r.t < GLIDE) {
        const k = r.t / GLIDE;
        const e = k * k * (3 - 2 * k);
        tmp.set(GATE.x, Y.identity + 0.07, GATE.z);
        r.core.position.lerpVectors(r.from, tmp, e);
        r.core.position.y += Math.sin(k * Math.PI) * 0.22;
      } else if (r.t < GLIDE + FALL) {
        const k = (r.t - GLIDE) / FALL;
        const e = k * k;
        r.core.position.set(GATE.x, THREE.MathUtils.lerp(Y.identity + 0.07, Y.analytics + CUBE / 2 + 0.02, e), GATE.z);
        // Hashed on the way through: the name drops away, an anonymous key remains.
        const h = THREE.MathUtils.smoothstep(k, 0.15, 0.55);
        coreMat.opacity = 1 - h;
        glowMat.color.copy(idColor).lerp(withheldColor, h);
        glowMat.opacity = (P.halo ? 0.8 : 0) * (1 - h * 0.6);
        cubeMat.opacity = h * 0.35;
        edgeMat.opacity = h;
        if (r.t - dt < GLIDE) {
          (gateFlash.material as THREE.SpriteMaterial).opacity = P.halo ? 0.9 : 0.25;
        }
      } else if (r.t < GLIDE + FALL + SLIDE) {
        const k = (r.t - GLIDE - FALL) / SLIDE;
        const e = 1 - Math.pow(1 - k, 3);
        const b = columnBase[r.column];
        r.to.set(b.x, Y.analytics + CUBE / 2 + 0.02 + stacks[r.column].length * STEP, b.z);
        tmp.set(GATE.x, Y.analytics + CUBE / 2 + 0.02, GATE.z);
        r.core.position.lerpVectors(tmp, r.to, e);
        r.core.position.y += Math.sin(k * Math.PI) * 0.18;
      } else {
        place(r);
        records.splice(i, 1);
        r.glow.removeFromParent();
        r.core.removeFromParent();
        continue;
      }
      r.glow.position.copy(r.core.position);
      r.cube.position.copy(r.core.position);
      r.cubeEdge.position.copy(r.core.position);
      r.cube.rotation.y = r.cubeEdge.rotation.y = r.t * 2.4;
    }

    // Residents return to their slot a while after they leave.
    for (const res of residents) {
      if (!res.busy) continue;
      res.away += dt;
      if (res.away > 3.2) {
        res.busy = false;
        res.core.visible = true;
        res.halo.visible = true;
        (res.tag.material as LineMaterial).opacity = 0.45;
      }
    }

    const gm = gateFlash.material as THREE.SpriteMaterial;
    gm.opacity = Math.max(0, gm.opacity - dt * 1.6);
  };

  const resetBoard = () => {
    for (const col of stacks) {
      for (const r of col) {
        r.cube.removeFromParent();
        r.cubeEdge.removeFromParent();
        (r.cube.material as THREE.Material).dispose();
        (r.cubeEdge.material as THREE.Material).dispose();
      }
      col.length = 0;
    }
  };

  // A still frame: the board mid-way, with paediatric withheld.
  const seedStill = () => {
    const counts = [6, 5, 4, 6, 2];
    counts.forEach((n, col) => {
      for (let i = 0; i < n; i++) place(makeRecord(i, col));
    });
  };
  if (opts.still) seedStill();

  // ─── Framing ─────────────────────────────────────────────────────────────
  const size = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resolution.set(w, h);
    for (const m of lineMats) m.resolution.copy(resolution);
    // Narrow frames get a smaller board so the plate corners stay inside.
    rig.scale.setScalar(THREE.MathUtils.clamp(camera.aspect / 1.15, 0.72, 1.06));
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(host);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const anchors: VaultAnchors = {
    identity: new THREE.Vector3(),
    content: new THREE.Vector3(),
    analytics: new THREE.Vector3(),
    gate: new THREE.Vector3(),
    withheld: new THREE.Vector3(),
  };
  const local = {
    identity: new THREE.Vector3(-PLATE.w / 2, Y.identity, PLATE.d / 2),
    content: new THREE.Vector3(-PLATE.w / 2, Y.content, PLATE.d / 2),
    analytics: new THREE.Vector3(-PLATE.w / 2, Y.analytics, PLATE.d / 2),
    gate: new THREE.Vector3(GATE.x + 0.1, Y.identity + 0.85, GATE.z),
    withheld: new THREE.Vector3(columnBase[4].x, Y.analytics, PLATE.d / 2 + 0.05),
  };

  /** Screen positions (0–1) of the label anchors, for the HTML overlay. */
  const project = () => {
    rig.updateMatrixWorld();
    const out = {} as Record<keyof VaultAnchors, { x: number; y: number }>;
    for (const key of Object.keys(local) as (keyof VaultAnchors)[]) {
      anchors[key].copy(local[key]).applyMatrix4(rig.matrixWorld).project(camera);
      out[key] = { x: (anchors[key].x + 1) / 2, y: (1 - anchors[key].y) / 2 };
    }
    return out;
  };

  let spawn = 0.4;
  let elapsed = 0;

  function render(dt: number) {
    if (!opts.still) {
      elapsed += dt;
      if (resetting) {
        fade = Math.max(0, fade - dt * 1.2);
        if (fade === 0) {
          resetBoard();
          resetting = false;
        }
      } else {
        fade = Math.min(1, fade + dt * 1.5);
        spawn -= dt;
        if (spawn <= 0 && records.length < 3) {
          spawn = 0.75 + Math.random() * 0.5;
          if (!launch() && records.length === 0) resetting = true;
        }
      }
      step(dt);
      for (const col of stacks) {
        for (const r of col) {
          (r.cubeEdge.material as THREE.LineBasicMaterial).opacity = fade;
          (r.cube.material as THREE.MeshBasicMaterial).opacity = (stacks[r.column].length >= K ? 0.9 : 0.22) * fade;
        }
      }
      gateSpin.rotation.y = elapsed * 0.35;
    }

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    rig.rotation.y = Math.sin(elapsed * 0.11) * 0.12 + pointer.x * 0.1;
    rig.rotation.x = pointer.y * 0.04;
    renderer.render(scene, camera);
    return project();
  }

  return {
    render,
    columns: COLUMNS,
    dispose() {
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      resetBoard();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

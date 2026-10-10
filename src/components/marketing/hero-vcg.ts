import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import { LOOPS } from "./cardiac";

const COLORS = { P: 0xffd27a, QRS: 0x9ff0c4, T: 0x86d9ff } as const;

type Traced = {
  start: number;
  end: number;
  segments: number;
  bright: Line2;
  brightMat: LineMaterial;
  haloMat: LineMaterial;
  head: THREE.Sprite;
  points: THREE.Vector3[];
};

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createVcg(host: HTMLElement, opts: { still: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.4);

  const rig = new THREE.Group(); // positioned per breakpoint
  const body = new THREE.Group(); // rotates slowly
  rig.add(body);
  scene.add(rig);
  // Anatomical orientation: the mean QRS axis points down and to the left.
  body.rotation.set(0.12, -0.5, 0.18);

  // ─── Reference cage: the three body planes, as on a VCG plot ─────────────
  const cageMat = new THREE.LineBasicMaterial({ color: 0x3f7a66, transparent: true, opacity: 0.22 });
  const ring = (r: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  };
  for (const [rx, ry] of [
    [0, 0],
    [Math.PI / 2, 0],
    [0, Math.PI / 2],
  ]) {
    for (const r of [0.6, 1.25]) {
      const l = new THREE.Line(ring(r), cageMat);
      l.rotation.set(rx, ry, 0);
      body.add(l);
    }
  }
  const axisMat = new THREE.LineBasicMaterial({ color: 0x4f8f78, transparent: true, opacity: 0.38 });
  for (const dir of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) {
    const g = new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(-1.45), dir.clone().multiplyScalar(1.45)]);
    body.add(new THREE.Line(g, axisMat));
    // Tick marks every 0.3 along each axis.
    const ticks: THREE.Vector3[] = [];
    const n = new THREE.Vector3(dir.y, dir.z, dir.x).multiplyScalar(0.04);
    for (let t = -1.25; t <= 1.26; t += 0.25) {
      const p = dir.clone().multiplyScalar(t);
      ticks.push(p.clone().add(n), p.clone().sub(n));
    }
    body.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), axisMat));
  }

  // Origin: the electrical centre of the heart.
  const glow = glowTexture();
  const origin = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
  origin.scale.setScalar(0.16);
  body.add(origin);

  // ─── The loops ───────────────────────────────────────────────────────────
  const resolution = new THREE.Vector2(1, 1);
  const traced: Traced[] = LOOPS.map((loop) => {
    const flat = loop.points.flat();
    const color = COLORS[loop.name];

    const ghostGeo = new LineGeometry();
    ghostGeo.setPositions(flat);
    const ghostMat = new LineMaterial({ color, linewidth: 1.4, transparent: true, opacity: loop.name === "QRS" ? 0.32 : 0.24, resolution });
    body.add(new Line2(ghostGeo, ghostMat));

    const brightGeo = new LineGeometry();
    brightGeo.setPositions(flat);
    const brightMat = new LineMaterial({ color, linewidth: loop.name === "QRS" ? 3.2 : 2.4, transparent: true, opacity: 1, resolution });
    const bright = new Line2(brightGeo, brightMat);
    body.add(bright);

    // A wide, faint copy under the trace stands in for bloom.
    const haloMat = new LineMaterial({
      color,
      linewidth: loop.name === "QRS" ? 14 : 9,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      resolution,
    });
    const halo = new Line2(brightGeo, haloMat);
    body.add(halo);

    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, depthWrite: false }));
    head.scale.setScalar(loop.name === "QRS" ? 0.34 : 0.22);
    body.add(head);

    return {
      start: loop.start,
      end: loop.end,
      segments: loop.points.length - 1,
      bright,
      brightMat,
      haloMat,
      head,
      points: loop.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    };
  });

  // ─── Light dust for depth ────────────────────────────────────────────────
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array(420 * 3);
  for (let i = 0; i < dust.length; i += 3) {
    const r = 2.4 + Math.random() * 2.6;
    const a = Math.random() * Math.PI * 2;
    const b = (Math.random() - 0.5) * Math.PI;
    dust[i] = Math.cos(a) * Math.cos(b) * r;
    dust[i + 1] = Math.sin(b) * r * 0.7;
    dust[i + 2] = Math.sin(a) * Math.cos(b) * r - 1.5;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x6fae96, size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }));
  rig.add(dustPts);

  const size = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resolution.set(w, h);
    // Desktop: the instrument sits right of the headline. Phone: in the open
    // space under the buttons, clear of the text.
    const wide = w >= 900;
    rig.position.set(wide ? 1.85 : 0.35, wide ? 0.3 : -1.5, 0);
    rig.scale.setScalar(wide ? 1.05 : 0.58);
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

  function render(phi: number, t: number) {
    for (const l of traced) {
      const span = l.end - l.start;
      let progress: number;
      let fade = 1;
      if (opts.still) progress = 1;
      else if (phi < l.start) progress = 0;
      else if (phi <= l.end) progress = (phi - l.start) / span;
      else {
        progress = 1;
        fade = Math.max(0, 1 - (phi - l.end) / 0.32); // the trail fades after the loop closes
      }
      const n = Math.max(0, Math.round(progress * l.segments));
      l.bright.geometry.instanceCount = n;
      l.brightMat.opacity = fade;
      l.haloMat.opacity = 0.16 * fade;
      const headPoint = l.points[Math.min(l.points.length - 1, n)];
      l.head.position.copy(headPoint);
      l.head.visible = !opts.still && phi >= l.start && phi <= l.end;
    }

    // The origin brightens at depolarisation.
    const qrs = traced[1];
    const inQrs = phi >= qrs.start && phi <= qrs.end + 0.06;
    origin.scale.setScalar(inQrs ? 0.24 : 0.14);

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    body.rotation.y = -0.35 + Math.sin(t * 0.12) * 0.28 + pointer.x * 0.16;
    body.rotation.x = 0.12 + pointer.y * 0.1;
    dustPts.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }

  return {
    render,
    dispose() {
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

"use client";

import { useEffect, useRef } from "react";
import type { Mesh, Vector2 } from "three";

const LAYERS = [
  { y: 1.5, color: 0x123d31, opacity: 0.1, label: "identity" },
  { y: 0, color: 0x3c4a46, opacity: 0.06, label: "content" },
  { y: -1.5, color: 0xc2302a, opacity: 0.07, label: "analytics" },
] as const;

/**
 * The three Postgres schemas as stacked plates. Named records live on the top
 * plate; to reach analytics they must fall through the hash gate, and they
 * arrive as anonymous cubes. Paused off-screen; a still frame under
 * reduced motion.
 */
export function PrivacyLayers() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
      camera.position.set(6, 5.2, 6);
      camera.lookAt(0, -0.1, 0);

      const group = new THREE.Group();
      scene.add(group);

      for (const l of LAYERS) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(4.6, 0.04, 3.2),
          new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: l.opacity, depthWrite: false }),
        );
        plate.position.y = l.y;
        group.add(plate);
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(plate.geometry),
          new THREE.LineBasicMaterial({ color: l.color, transparent: true, opacity: 0.55 }),
        );
        edges.position.y = l.y;
        group.add(edges);
      }

      // The hash gate: the one opening between identity and analytics.
      const gate = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.025, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x123d31 }),
      );
      gate.rotation.x = Math.PI / 2;
      gate.position.set(1.2, 1.5, 0.6);
      group.add(gate);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 3, 32, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x123d31, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }),
      );
      shaft.position.set(1.2, 0, 0.6);
      group.add(shaft);

      const personGeo = new THREE.SphereGeometry(0.075, 16, 12);
      const personMat = new THREE.MeshBasicMaterial({ color: 0x123d31 });
      const anonGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
      const anonMat = new THREE.MeshBasicMaterial({ color: 0xc2302a });

      type Particle = { mesh: Mesh; phase: number; state: "wander" | "fall"; t: number; home: Vector2 };
      const particles: Particle[] = [];
      for (let i = 0; i < 14; i++) {
        const mesh = new THREE.Mesh(personGeo, personMat);
        const home = new THREE.Vector2((Math.random() - 0.5) * 3.8, (Math.random() - 0.5) * 2.6);
        mesh.position.set(home.x, 1.58, home.y);
        group.add(mesh);
        particles.push({ mesh, phase: Math.random() * Math.PI * 2, state: "wander", t: 0, home });
      }

      const anon: Mesh[] = [];
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        const aspect = w / h;
        const view = 3.2;
        camera.left = -view * aspect;
        camera.right = view * aspect;
        camera.top = view;
        camera.bottom = -view;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      let running = false;
      let raf = 0;
      let last = performance.now();
      let spawn = 0;

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        spawn += dt;

        if (spawn > 1.6) {
          spawn = 0;
          const p = particles.find((q) => q.state === "wander");
          if (p) {
            p.state = "fall";
            p.t = 0;
          }
        }

        for (const p of particles) {
          p.phase += dt * 0.8;
          if (p.state === "wander") {
            p.mesh.position.x = p.home.x + Math.sin(p.phase) * 0.12;
            p.mesh.position.z = p.home.y + Math.cos(p.phase * 0.7) * 0.12;
          } else if (p.state === "fall") {
            p.t += dt;
            const k = Math.min(1, p.t / 1.2);
            const ease = 1 - Math.pow(1 - k, 3);
            p.mesh.position.x = THREE.MathUtils.lerp(p.mesh.position.x, gate.position.x, ease * 0.25);
            p.mesh.position.z = THREE.MathUtils.lerp(p.mesh.position.z, gate.position.z, ease * 0.25);
            if (k >= 1) {
              p.mesh.position.y -= dt * 2.2;
              if (p.mesh.position.y < -1.42) {
                const cube = new THREE.Mesh(anonGeo, anonMat);
                cube.position.set(
                  (Math.random() - 0.5) * 3.8,
                  -1.42,
                  (Math.random() - 0.5) * 2.6,
                );
                group.add(cube);
                anon.push(cube);
                if (anon.length > 22) group.remove(anon.shift()!);
                p.home.set((Math.random() - 0.5) * 3.8, (Math.random() - 0.5) * 2.6);
                p.mesh.position.set(p.home.x, 1.58, p.home.y);
                p.state = "wander";
              }
            }
          }
        }

        group.rotation.y = Math.sin(now / 9000) * 0.12;
        renderer.render(scene, camera);
        if (running) raf = requestAnimationFrame(tick);
      };

      const io = new IntersectionObserver(([entry]) => {
        if (reduce) {
          renderer.render(scene, camera);
          return;
        }
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      });
      io.observe(el);

      cleanup = () => {
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <figure>
      <div className="relative aspect-[5/4] w-full">
        <div ref={host} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" aria-hidden />
      </div>
      <figcaption>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider uppercase">
          <li className="flex items-center gap-2 text-pine">
            <span className="size-2 rounded-full bg-pine" aria-hidden /> identity · who you are
          </li>
          <li className="flex items-center gap-2 text-ink-2">
            <span className="size-2 rounded-[2px] border border-ink-2" aria-hidden /> content · scenarios, runs
          </li>
          <li className="flex items-center gap-2 text-signal">
            <span className="size-2 bg-signal" aria-hidden /> analytics · no PII
          </li>
        </ul>
      </figcaption>
    </figure>
  );
}

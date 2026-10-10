"use client";

import { useEffect, useRef } from "react";

import { ecgAt, PERIOD } from "./cardiac";

/**
 * The hero's live instrument: a 3D vectorcardiogram (the loop the heart's
 * electrical vector traces each beat) above a full-width monitor sweep, both
 * driven by one clock. three.js loads after first paint; reduced motion gets
 * one still frame of each.
 */
export function HeroStage() {
  const glHost = useRef<HTMLDivElement>(null);
  const sweep = useRef<HTMLCanvasElement>(null);
  const beatDot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    let visible = true;
    let disposed = false;
    let disposeGl = () => {};
    let renderGl: ((phi: number, t: number) => void) | null = null;

    // ─── 2D monitor sweep ─────────────────────────────────────────────────
    const canvas = sweep.current!;
    const ctx = canvas.getContext("2d")!;
    let W = 0;
    let H = 0;
    let lastX = 0;
    let lastY = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const SPEED = 190; // px per second, like 25 mm/s on a wide screen

    const sizeSweep = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      lastX = 0;
      lastY = H * 0.62;
      if (reduce) drawStill();
    };

    const yAt = (seconds: number) => H * 0.62 - ecgAt((seconds / PERIOD) % 1) * H * 0.5;

    const drawStill = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(159, 240, 196, 0.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 1) {
        const y = yAt(x / SPEED);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawSweep = (seconds: number) => {
      const x = (seconds * SPEED) % W;
      const y = yAt(seconds);
      // The erase bar ahead of the trace, as on a real monitor.
      ctx.clearRect(x, 0, 28, H);
      if (x < lastX) {
        lastX = 0;
        lastY = y;
        ctx.clearRect(0, 0, 28, H);
      }
      ctx.strokeStyle = "rgba(159, 240, 196, 0.95)";
      ctx.shadowColor = "rgba(159, 240, 196, 0.6)";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      // Sub-steps so the QRS spike isn't skipped between frames.
      const steps = Math.max(1, Math.ceil(x - lastX));
      for (let i = 1; i <= steps; i++) {
        const xi = lastX + ((x - lastX) * i) / steps;
        ctx.lineTo(xi, yAt(seconds - (x - xi) / SPEED));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      lastX = x;
      lastY = y;
    };

    sizeSweep();
    const ro = new ResizeObserver(sizeSweep);
    ro.observe(canvas);

    // ─── 3D vectorcardiogram ──────────────────────────────────────────────
    const host = glHost.current!;
    import("./hero-vcg")
      .then(({ createVcg }) => {
        if (disposed) return;
        const vcg = createVcg(host, { still: reduce });
        renderGl = vcg.render;
        disposeGl = vcg.dispose;
        if (reduce) vcg.render(0.3, 0);
      })
      .catch((error) => console.error("[hero] 3D stage unavailable", error));

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce) raf = requestAnimationFrame(tick);
    });
    io.observe(host);

    let lastBeat = -1;
    const tick = (now: number) => {
      if (!visible) return;
      const seconds = (now - t0) / 1000;
      const phi = (seconds / PERIOD) % 1;
      drawSweep(seconds);
      renderGl?.(phi, seconds);
      const beat = Math.floor(seconds / PERIOD);
      if (phi > 0.25 && beat !== lastBeat) {
        lastBeat = beat;
        beatDot.current?.animate([{ opacity: 1, transform: "scale(1.5)" }, { opacity: 0.25, transform: "scale(1)" }], {
          duration: 420,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        });
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      disposeGl();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden>
      <div ref={glHost} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" />
      <canvas ref={sweep} className="absolute inset-x-0 bottom-[11%] h-[16%] w-full md:bottom-[9%]" />
      <span ref={beatDot} className="absolute top-[92px] right-6 hidden size-2 rounded-full bg-[#9ff0c4] opacity-25 md:block md:right-10" />
    </div>
  );
}

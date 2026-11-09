import { Box } from "lucide-react";
import Script from "next/script";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

import type { ServedArModel } from "@/server/scenarios/ar-model";

// "Look before you act": the scenario's physician-reviewed 3D casualty.
// <model-viewer> shows it in the page on any device; on a phone its button
// hands off to AR Quick Look (iPhone, USDZ) or Scene Viewer (Android, GLB),
// both locked to real size. WebXR is left out on purpose: the site-wide
// Permissions-Policy blocks the camera in the page, and the system viewers
// have their own camera access.

// Pinned and integrity-checked. To upgrade, change both lines together.
const MODEL_VIEWER_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js";
const MODEL_VIEWER_SRI = "sha384-cprcVQt7wbUl0xngF3PGP6yBB7n4/t+4AoAMG9biiMCGFiWOdzUH10Ie2COTqFNW";

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src: string;
  "ios-src"?: string;
  poster?: string;
  alt: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "camera-controls"?: boolean;
  "touch-action"?: string;
  "shadow-intensity"?: string;
  loading?: "auto" | "lazy" | "eager";
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export function ArPatient({ model, title }: { model: ServedArModel; title: string }) {
  return (
    <section aria-labelledby="ar-patient" className="rounded-lg border border-rule bg-card">
      <Script type="module" src={MODEL_VIEWER_SRC} integrity={MODEL_VIEWER_SRI} crossOrigin="anonymous" strategy="afterInteractive" />
      <div className="flex items-center gap-2 border-b border-rule px-4 py-2.5 font-mono text-[11px] tracking-wider text-ink-3 uppercase">
        <Box className="size-3.5" /> <span id="ar-patient">Look before you act</span>
      </div>
      <model-viewer
        src={model.glbUrl}
        ios-src={model.usdzUrl}
        poster={model.posterUrl ?? undefined}
        alt={`3D model of the patient in “${title}”`}
        ar
        ar-modes="scene-viewer quick-look"
        ar-scale="fixed"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        loading="lazy"
        className="block h-[320px] w-full bg-paper-2 sm:h-[400px]"
      >
        <button
          slot="ar-button"
          type="button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-pine px-4 py-2 text-[14px] font-medium text-paper"
        >
          View the patient in your room
        </button>
      </model-viewer>
      <p className="px-4 py-3 text-[12px] text-ink-3">
        Drag to look around. On a phone, place the patient on your floor at real size, then come back to start the call.
        Model: {model.attribution.source} ({model.attribution.licence}).
      </p>
    </section>
  );
}

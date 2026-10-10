"use client";

import dynamic from "next/dynamic";

// three.js stays out of the first load; the plates appear when this mounts.
export const PrivacyLayersLazy = dynamic(() => import("./privacy-layers").then((m) => m.PrivacyLayers), {
  ssr: false,
  loading: () => <div className="aspect-[6/5] w-full" />,
});

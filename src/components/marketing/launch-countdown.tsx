"use client";

import { useSyncExternalStore } from "react";

// A clock that ticks every 30 s on the client and is absent on the server.
const subscribe = (tick: () => void) => {
  const t = setInterval(tick, 30_000);
  return () => clearInterval(t);
};
const minuteNow = () => Math.floor(Date.now() / 30_000) * 30_000;

/** Days, hours and minutes until launch, Toronto time. Renders nothing after. */
export function LaunchCountdown({ date }: { date: string }) {
  const target = new Date(`${date}T09:00:00-04:00`).getTime();
  const now = useSyncExternalStore(subscribe, minuteNow, () => null);

  if (now === null || now >= target) return null;
  const mins = Math.floor((target - now) / 60_000);
  const parts = [
    [Math.floor(mins / 1440), "days"],
    [Math.floor((mins % 1440) / 60), "hours"],
    [mins % 60, "min"],
  ] as const;
  return (
    <div className="flex gap-6" aria-label={`Launching in ${parts[0][0]} days`}>
      {parts.map(([n, unit]) => (
        <div key={unit}>
          <p className="tabular font-display text-[2.6rem] leading-none text-paper">{String(n).padStart(2, "0")}</p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-paper/45 uppercase">{unit}</p>
        </div>
      ))}
    </div>
  );
}

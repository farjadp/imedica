"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";

/** Starts (or resumes) the attempt in a window and opens it. */
export function StartAttempt({ windowId, label }: { windowId: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("POST", "/attempts", { windowId });
      router.push(`/app/assessments/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button size="sm" pending={pending} onClick={start}>
        {label}
      </Button>
      {error ? <span className="text-[12px] text-tag-red">{error}</span> : null}
    </span>
  );
}

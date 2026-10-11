"use client";

import { useMutation } from "@/components/editor/use-mutation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function OpenWindow({
  assessmentId,
  phase,
  organizationId,
  label,
  confirmText,
}: {
  assessmentId: string;
  phase: "PRE" | "POST";
  organizationId?: string;
  label: string;
  confirmText: string;
}) {
  const m = useMutation();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size="sm"
        pending={m.pending}
        onClick={() =>
          confirm(confirmText) && void m.run(() => api("POST", "/assessment-windows", { assessmentId, phase, organizationId }))
        }
      >
        {label}
      </Button>
      {m.error ? <span className="text-[12px] text-tag-red">{m.error}</span> : null}
    </span>
  );
}

export function CloseWindow({ windowId }: { windowId: string }) {
  const m = useMutation();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="ghost"
        pending={m.pending}
        onClick={() =>
          confirm("Close it? Nobody else can start or finish this round after that.") &&
          void m.run(() => api("POST", `/assessment-windows/${windowId}/close`))
        }
      >
        Close
      </Button>
      {m.error ? <span className="text-[12px] text-tag-red">{m.error}</span> : null}
    </span>
  );
}

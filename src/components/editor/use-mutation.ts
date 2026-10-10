"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api-client";

/** Runs an API call, tracks pending and errors, and refreshes server data on success. */
export function useMutation() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function run(fn: () => Promise<unknown>): Promise<boolean> {
    setPending(true);
    setError(null);
    setFields({});
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields);
      } else {
        setError("Something went wrong. Try again.");
      }
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, fields, clear: () => (setError(null), setFields({})) };
}

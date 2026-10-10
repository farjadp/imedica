import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Runtime, type RuntimeData } from "@/components/runtime/runtime";
import { HttpError, requireUserPage } from "@/server/auth/guards";
import { getRuntime } from "@/server/sessions/service";

export const metadata: Metadata = { title: "On a call", robots: { index: false } };

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/run/${id}`);
  let data;
  try {
    data = await getRuntime(user, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  if (data.status !== "IN_PROGRESS") redirect(`/app/review/${id}`);

  return <Runtime initial={JSON.parse(JSON.stringify(data)) as RuntimeData} />;
}

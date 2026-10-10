import type { Metadata } from "next";

import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <h1 className="mb-8 font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">
        Choose a new password
      </h1>
      <ResetForm token={token} />
    </>
  );
}

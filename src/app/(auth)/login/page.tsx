import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { homeFor } from "@/server/auth/home";
import { getCurrentUser } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const { next } = await searchParams;

  return (
    <>
      <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">Sign in</h1>
      <p className="mt-2 mb-8 text-[15px] text-ink-2">Use the email your service invited.</p>
      <LoginForm next={next} />
      <p className="mt-8 text-[14px] text-ink-3">
        No account yet? Accounts come from your service.{" "}
        <Link href="/demo" className="text-pine-3 underline decoration-pine-3/30 hover:decoration-pine-3">
          Bring Imedica to your team
        </Link>
        .
      </p>
    </>
  );
}

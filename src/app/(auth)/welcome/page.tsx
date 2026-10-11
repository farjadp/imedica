import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { apps } from "@/lib/site";
import { requireUserPage } from "@/server/auth/guards";

export const metadata: Metadata = { title: "You're in", robots: { index: false } };

/**
 * Where a paramedic lands after joining on a phone. Accounts are made on the
 * web (the invitation link), but training happens in the app, so this hands
 * them over instead of leaving them in the mobile site.
 */
export default async function WelcomePage() {
  const user = await requireUserPage("/welcome");
  const ua = (await headers()).get("user-agent") ?? "";
  const iphone = /iPhone|iPod/.test(ua);
  const install = iphone ? (apps.ios.url ?? apps.iosBeta) : apps.android.url;

  return (
    <>
      <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.02em] text-ink">
        You&apos;re in, {user.preferredName ?? user.firstName}.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        Your account is ready. Training happens in the Imedica app: open it and sign in with{" "}
        <span className="font-medium text-ink">{user.email}</span> and the password you just chose.
      </p>

      <div className="mt-8 space-y-3">
        <a
          href={apps.scheme}
          className="flex h-12 w-full items-center justify-center rounded-md bg-pine text-[15px] font-medium text-paper"
        >
          Open the Imedica app
        </a>
        {install ? (
          <a
            href={install}
            className="flex h-12 w-full items-center justify-center rounded-md border border-rule bg-card text-[15px] font-medium text-ink"
          >
            {iphone && !apps.ios.url ? "Install it with TestFlight" : "Get the app"}
          </a>
        ) : (
          <p className="text-[14px] text-ink-3">
            The Android app is in testing. Your training lead will send you the link to install it.
          </p>
        )}
      </div>

      {iphone && !apps.ios.url ? (
        <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
          The iPhone app is in beta. Install Apple&apos;s free TestFlight app first, then come back and tap Install.
        </p>
      ) : null}

      <p className="mt-10 text-[14px] text-ink-3">
        No phone handy?{" "}
        <Link href="/app" className="text-pine-3 underline">
          Continue on the web
        </Link>
        .
      </p>
    </>
  );
}

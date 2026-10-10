import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { EcgTrace } from "@/components/clinical/ecg-trace";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-8 md:px-12">
        <Link href="/" aria-label="Imedica home" className="self-start rounded-md">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </main>
        <p className="text-[12px] text-ink-3">A training tool. It doesn&apos;t replace your medical directives.</p>
      </div>
      <aside className="relative hidden flex-col justify-end overflow-hidden bg-pine p-12 text-paper lg:flex">
        <div className="absolute inset-x-0 top-[38%] opacity-90">
          <EcgTrace rhythm="sinus" height={120} stroke="rgb(247 246 241 / 0.55)" />
        </div>
        <blockquote className="relative max-w-md">
          <p className="font-display text-[1.75rem] leading-snug font-medium">
            Rehearse the call you hope you never get, so the first time isn&apos;t the real time.
          </p>
        </blockquote>
      </aside>
    </div>
  );
}

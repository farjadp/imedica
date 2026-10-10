import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-pine text-paper hover:bg-pine-2 active:bg-pine shadow-[0_1px_0_rgb(255_255_255/0.08)_inset,0_1px_2px_rgb(16_32_28/0.2)]",
  secondary: "border border-rule bg-card text-ink hover:border-ink-3 hover:bg-paper",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  danger: "bg-tag-red text-white hover:bg-[#9a1f18]",
  light: "bg-paper text-pine hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  className,
  pending,
  children,
  ...props
}: Common & ComponentProps<"button"> & { pending?: boolean }) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={props.disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

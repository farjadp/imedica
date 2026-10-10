"use client";

import { Check, Link2, Mail } from "lucide-react";
import { useState } from "react";

const btn =
  "inline-flex size-10 items-center justify-center rounded-full border border-rule text-ink-2 transition-colors hover:border-ink hover:text-ink";

/** Plain links to each network: no third-party scripts, no tracking. */
export function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">Share</p>
      <div className="mt-3 flex gap-2">
        <a className={btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <span className="text-[13px] font-semibold">in</span>
        </a>
        <a className={btn} href={`https://x.com/intent/post?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <span className="text-[14px] font-semibold">𝕏</span>
        </a>
        <a className={btn} href={`mailto:?subject=${t}&body=${u}`} aria-label="Share by email">
          <Mail className="size-4" />
        </a>
        <button
          type="button"
          className={btn}
          aria-label={copied ? "Link copied" : "Copy link"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              window.prompt("Copy this link", url);
            }
          }}
        >
          {copied ? <Check className="size-4 text-tag-green" /> : <Link2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}

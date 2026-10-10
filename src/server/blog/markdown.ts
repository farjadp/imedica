// Markdown for blog posts. Pure, so it's testable.

import { Marked, type Tokens } from "marked";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 80)
    .replace(/-$/, "");
}

/** Words per minute for clinical prose, which reads slower than news copy. */
const WPM = 220;

export function readingMinutes(markdown: string) {
  const words = markdown.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

/**
 * Markdown to HTML for a blog post. Raw HTML in the source is escaped, not
 * rendered, so a post can never inject script or markup. Headings get stable
 * ids for the table of contents, and outbound links open safely.
 */
export function renderMarkdown(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return escape(text);
      },
      heading({ tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const plain = inner.replace(/<[^>]+>/g, "");
        const base = slugify(plain) || "section";
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        const id = n ? `${base}-${n}` : base;
        // Posts own the page's h1, so body headings start at h2.
        const level = Math.min(6, Math.max(2, depth));
        if (level === 2 || level === 3) toc.push({ id, text: plain, depth: level });
        return `<h${level} id="${id}"><a href="#${id}" class="anchor" aria-hidden="true">#</a>${inner}</h${level}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const safe = /^(https?:|mailto:|\/|#)/i.test(href) ? href : "#";
        const external = /^https?:/i.test(safe) && !safe.startsWith(process.env.APP_URL ?? "\u0000");
        const t = title ? ` title="${escape(title)}"` : "";
        return external
          ? `<a href="${escape(safe)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
          : `<a href="${escape(safe)}"${t}>${text}</a>`;
      },
      image({ href, title, text }: Tokens.Image) {
        const safe = /^(https:|\/)/i.test(href) ? href : "";
        if (!safe) return "";
        // Inline, because marked wraps images in a paragraph and a figure can't sit inside one.
        const t = title ? ` title="${escape(title)}"` : "";
        return `<img src="${escape(safe)}" alt="${escape(text)}"${t} loading="lazy" decoding="async" />`;
      },
    },
  });

  const html = marked.parse(markdown, { async: false }) as string;
  return { html, toc };
}

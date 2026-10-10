"use client";

import { Bold, Eye, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Pencil, Plus, Quote, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { StatusPill } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import type { FaqItem, SourceItem } from "@/lib/blog";
import { cn } from "@/lib/cn";
import { type PostInput, savePost, setPostStatus } from "@/server/blog/actions";
import { readingMinutes, renderMarkdown, slugify } from "@/server/blog/markdown";

export type EditorPost = {
  id?: string;
  status: string;
  publishedAt: string | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  keyTakeaway: string;
  faq: FaqItem[];
  sources: SourceItem[];
  categoryId: string;
  tags: string[];
  coverImageId: string;
  coverAlt: string;
  authorTitle: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  noindex: boolean;
};

const blankPost: EditorPost = {
  status: "DRAFT",
  publishedAt: null,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  keyTakeaway: "",
  faq: [],
  sources: [],
  categoryId: "",
  tags: [],
  coverImageId: "",
  coverAlt: "",
  authorTitle: "",
  featured: false,
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  canonicalUrl: "",
  noindex: false,
};

type Tool = "h2" | "h3" | "bold" | "italic" | "link" | "ul" | "ol" | "quote";
const TOOLS = [
  [Heading2, "Heading", "h2"],
  [Heading3, "Subheading", "h3"],
  [Bold, "Bold", "bold"],
  [Italic, "Italic", "italic"],
  [Link2, "Link", "link"],
  [List, "Bulleted list", "ul"],
  [ListOrdered, "Numbered list", "ol"],
  [Quote, "Quote", "quote"],
] as const satisfies readonly (readonly [unknown, string, Tool])[];

async function uploadImage(file: File, alt?: string): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.set("file", file);
  if (alt) form.set("alt", alt);
  const res = await fetch("/api/v1/blog/images", { method: "POST", body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed.");
  return json.data;
}

function Counter({ value, max, warn }: { value: string; max: number; warn: number }) {
  const n = value.length;
  return <span className={cn("tabular font-mono text-[11px]", n > max ? "text-tag-red" : n > warn ? "text-tag-yellow" : "text-ink-3")}>{n}/{max}</span>;
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-rule bg-card">
      <header className="flex items-center justify-between border-b border-rule px-5 py-3">
        <h2 className="text-[14px] font-medium text-ink">{title}</h2>
        {aside}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

/** Local date-time string for a datetime-local input. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostEditor({
  initial,
  categories,
  siteUrl,
  canDelete,
}: {
  /** Missing fields fall back to a blank draft. */
  initial: Partial<EditorPost>;
  categories: { id: string; name: string }[];
  siteUrl: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [post, setPost] = useState<EditorPost>(() => ({ ...blankPost, ...initial }));
  const [saved, setSaved] = useState(() => JSON.stringify({ ...blankPost, ...initial }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [tagDraft, setTagDraft] = useState("");
  const [scheduleAt, setScheduleAt] = useState(() => toLocalInput(new Date(Date.now() + 864e5)));
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const inlineFile = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!!initial.slug);

  const dirty = JSON.stringify(post) !== saved;
  const set = <K extends keyof EditorPost>(k: K, v: EditorPost[K]) => setPost((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const toInput = useCallback(
    (p: EditorPost): PostInput => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body,
      keyTakeaway: p.keyTakeaway,
      faq: p.faq.filter((f) => f.q.trim() || f.a.trim()),
      sources: p.sources.filter((s) => s.title.trim() || s.url.trim()),
      categoryId: p.categoryId,
      tags: p.tags,
      coverImageId: p.coverImageId,
      coverAlt: p.coverAlt,
      authorTitle: p.authorTitle,
      featured: p.featured,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      focusKeyword: p.focusKeyword,
      canonicalUrl: p.canonicalUrl,
      noindex: p.noindex,
    }),
    [],
  );

  /** Saves, then optionally moves the post to a new status. */
  const save = useCallback(
    (then?: { status: string; publishAt?: string }) =>
      start(async () => {
        setMessage(null);
        const res = await savePost(toInput(post));
        if (!res.ok || !res.id) {
          setErrors(res.fieldErrors ?? {});
          setMessage({ ok: false, text: res.message ?? "Couldn't save." });
          return;
        }
        setErrors({});
        let next = { ...post, id: res.id, slug: res.slug ?? post.slug };
        if (then) {
          const st = await setPostStatus({ id: res.id, status: then.status as never, publishAt: then.publishAt });
          if (!st.ok) {
            setMessage({ ok: false, text: st.message ?? "Saved, but the status didn't change." });
          } else {
            next = { ...next, status: then.status, publishedAt: then.publishAt ?? (then.status === "PUBLISHED" ? (post.publishedAt ?? new Date().toISOString()) : post.publishedAt) };
            setMessage({ ok: true, text: st.message ?? "Updated." });
          }
        } else {
          setMessage({ ok: true, text: "Saved." });
        }
        setPost(next);
        setSaved(JSON.stringify(next));
        if (!post.id) router.replace(`/admin/blog/${res.id}`);
        else router.refresh();
      }),
    [post, router, toInput],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // ─── Markdown toolbar ────────────────────────────────────────────────────
  const wrap = (before: string, after = before, placeholder = "text") => {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };
  const linePrefix = (prefix: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(lineStart, e);
    const lines = block.split("\n").map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l.replace(/^(#{1,6} |> |- |\d+\. )/, ""));
    set("body", value.slice(0, lineStart) + lines.join("\n") + value.slice(e));
    requestAnimationFrame(() => ta.focus());
  };
  const runTool = (tool: Tool) => {
    if (tool === "h2") linePrefix("## ");
    else if (tool === "h3") linePrefix("### ");
    else if (tool === "bold") wrap("**");
    else if (tool === "italic") wrap("_");
    else if (tool === "link") wrap("[", "](https://)", "link text");
    else if (tool === "ul") linePrefix("- ");
    else if (tool === "ol") linePrefix("1. ");
    else linePrefix("> ");
  };
  const insertAtCursor = (text: string) => {
    const ta = bodyRef.current;
    const value = post.body;
    const at = ta ? ta.selectionStart : value.length;
    set("body", value.slice(0, at) + text + value.slice(at));
  };

  const onInlineImage = async (file: File) => {
    setUploading("inline");
    try {
      const alt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
      const img = await uploadImage(file, alt);
      insertAtCursor(`\n\n![${alt}](${img.url})\n\n`);
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setUploading(null);
    }
  };

  const onCover = async (file: File) => {
    setUploading("cover");
    try {
      const img = await uploadImage(file, post.coverAlt || post.title);
      set("coverImageId", img.id);
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setUploading(null);
    }
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase().replace(/^#/, "");
    if (t && !post.tags.includes(t) && post.tags.length < 10) set("tags", [...post.tags, t]);
    setTagDraft("");
  };

  const preview = useMemo(() => (tab === "preview" ? renderMarkdown(post.body).html : ""), [tab, post.body]);
  const minutes = readingMinutes(post.body);
  const words = post.body.split(/\s+/).filter(Boolean).length;
  const effectiveSlug = post.slug || slugify(post.title);
  const snippetTitle = post.metaTitle || `${post.title || "Post title"} · Imedica`;
  const snippetDesc = post.metaDescription || post.excerpt || "The excerpt is used as the description unless you write one here.";
  const kw = post.focusKeyword.trim().toLowerCase();
  const kwChecks = kw
    ? [
        ["In the title", post.title.toLowerCase().includes(kw)],
        ["In the excerpt or description", (post.metaDescription || post.excerpt).toLowerCase().includes(kw)],
        ["In a heading", /^#{2,3} .*$/m.test(post.body) && post.body.split("\n").some((l) => /^#{2,3} /.test(l) && l.toLowerCase().includes(kw))],
        ["In the slug", effectiveSlug.includes(slugify(kw))],
      ]
    : [];
  const live = post.status === "PUBLISHED" || (post.status === "SCHEDULED" && post.publishedAt && new Date(post.publishedAt) <= new Date());

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ─── Main column ─── */}
      <div className="min-w-0 space-y-6">
        <Section title="Article">
          <Field label="Title" error={errors.title}>
            {(p) => (
              <Input
                {...p}
                value={post.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setPost((cur) => ({ ...cur, title, slug: slugTouched.current ? cur.slug : slugify(title) }));
                }}
                placeholder="Recognising right-ventricular STEMI before you give nitro"
                className="h-12 font-display text-[1.35rem]"
              />
            )}
          </Field>
          <Field label="Slug" hint={`${siteUrl.replace(/^https?:\/\//, "")}/blog/${effectiveSlug || "…"}`} error={errors.slug}>
            {(p) => (
              <Input
                {...p}
                value={post.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
                className="font-mono text-[13px]"
              />
            )}
          </Field>
          <Field label="Excerpt" hint={<Counter value={post.excerpt} max={320} warn={260} />} error={errors.excerpt}>
            {(p) => <Textarea {...p} rows={3} value={post.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="One or two sentences that make a paramedic want to read on. Shown on cards and under the title." />}
          </Field>
          <Field
            label="Short answer (key takeaway)"
            hint="Optional. A standalone 40–60 word answer to the question the post asks. Shown in a box at the top and picked up by AI search."
            error={errors.keyTakeaway}
          >
            {(p) => <Textarea {...p} rows={3} value={post.keyTakeaway} onChange={(e) => set("keyTakeaway", e.target.value)} />}
          </Field>
        </Section>

        <Section
          title="Body"
          aside={
            <div className="flex items-center gap-3">
              <span className="tabular font-mono text-[11px] text-ink-3">
                {words} words · {minutes} min
              </span>
              <div className="flex rounded-md bg-paper-2 p-0.5 text-[13px]">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn("inline-flex h-7 items-center gap-1.5 rounded px-2.5", tab === t ? "bg-card text-ink shadow-sm" : "text-ink-3")}
                  >
                    {t === "write" ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
                    {t === "write" ? "Write" : "Preview"}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {tab === "write" ? (
            <>
              <div className="-mx-5 -mt-5 flex flex-wrap gap-0.5 border-b border-rule bg-paper/60 px-3 py-1.5" role="toolbar" aria-label="Formatting">
                {TOOLS.map(([Icon, label, tool]) => (
                  <button key={label} type="button" title={label} aria-label={label} onClick={() => runTool(tool)} className="inline-flex size-8 items-center justify-center rounded text-ink-2 hover:bg-paper-2 hover:text-ink">
                    <Icon className="size-4" />
                  </button>
                ))}
                <button
                  type="button"
                  title="Insert image"
                  aria-label="Insert image"
                  onClick={() => inlineFile.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink"
                  disabled={uploading === "inline"}
                >
                  <ImagePlus className="size-4" /> {uploading === "inline" ? "Uploading…" : "Image"}
                </button>
                <input
                  ref={inlineFile}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onInlineImage(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <Field label="Markdown" error={errors.body} className="[&>label]:sr-only">
                {(p) => (
                  <Textarea
                    {...p}
                    ref={bodyRef}
                    value={post.body}
                    onChange={(e) => set("body", e.target.value)}
                    onDrop={(e) => {
                      const f = e.dataTransfer.files?.[0];
                      if (f?.type.startsWith("image/")) {
                        e.preventDefault();
                        onInlineImage(f);
                      }
                    }}
                    rows={26}
                    placeholder={"## The call\n\nWrite in Markdown. Use ## for sections: they become the table of contents.\n\nDrop an image here to upload it."}
                    className="min-h-[520px] font-mono text-[14px] leading-[1.7]"
                  />
                )}
              </Field>
            </>
          ) : (
            <div className="prose-blog min-h-[520px] max-w-none" dangerouslySetInnerHTML={{ __html: preview || "<p>Nothing to preview yet.</p>" }} />
          )}
        </Section>

        <Section
          title="Frequently asked"
          aside={
            <Button type="button" size="sm" variant="ghost" onClick={() => set("faq", [...post.faq, { q: "", a: "" }])} disabled={post.faq.length >= 12}>
              <Plus className="size-3.5" /> Add question
            </Button>
          }
        >
          {post.faq.length === 0 ? <p className="text-[14px] text-ink-3">Optional. Questions here show as accordions under the article and as FAQ rich results in Google.</p> : null}
          {post.faq.map((f, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-rule-2 p-3">
              <div className="flex gap-2">
                <Input value={f.q} placeholder="Question" onChange={(e) => set("faq", post.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <Button type="button" size="sm" variant="ghost" aria-label="Remove question" onClick={() => set("faq", post.faq.filter((_, j) => j !== i))}>
                  <X className="size-4" />
                </Button>
              </div>
              <Textarea rows={2} value={f.a} placeholder="Answer" onChange={(e) => set("faq", post.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
            </div>
          ))}
          {errors.faq ? <p className="text-[13px] text-tag-red">Every question needs a question and an answer.</p> : null}
        </Section>

        <Section
          title="Sources"
          aside={
            <Button type="button" size="sm" variant="ghost" onClick={() => set("sources", [...post.sources, { title: "", url: "" }])} disabled={post.sources.length >= 20}>
              <Plus className="size-3.5" /> Add source
            </Button>
          }
        >
          {post.sources.length === 0 ? <p className="text-[14px] text-ink-3">Guidelines, papers and directives the post relies on. Listed under the article and cited in its structured data.</p> : null}
          {post.sources.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <Input value={s.title} placeholder="Title, e.g. ALS PCS v5.4 — Cardiac Ischemia" onChange={(e) => set("sources", post.sources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Input value={s.url} placeholder="https://" className="font-mono text-[13px] sm:w-[45%]" onChange={(e) => set("sources", post.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <Button type="button" size="sm" variant="ghost" aria-label="Remove source" onClick={() => set("sources", post.sources.filter((_, j) => j !== i))} className="self-center">
                <X className="size-4" />
              </Button>
            </div>
          ))}
          {Object.keys(errors).some((k) => k.startsWith("sources")) ? <p className="text-[13px] text-tag-red">Each source needs a title and a full URL.</p> : null}
        </Section>
      </div>

      {/* ─── Sidebar ─── */}
      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Section title="Publish" aside={<StatusPill status={live ? "PUBLISHED" : post.status} />}>
          {message ? (
            message.ok ? (
              <p className="rounded-md bg-tag-green-wash px-3 py-2 text-[13px] text-tag-green" role="status">
                {message.text}
              </p>
            ) : (
              <FormError message={message.text} />
            )
          ) : null}
          <p className="text-[13px] text-ink-3">
            {dirty ? "Unsaved changes · ⌘S to save" : post.id ? "All changes saved." : "Not saved yet."}
            {post.status === "SCHEDULED" && post.publishedAt && !live ? ` Goes live ${new Date(post.publishedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}.` : ""}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => save()} pending={pending}>
              Save
            </Button>
            {live ? (
              <Button type="button" onClick={() => save({ status: "PUBLISHED" })} pending={pending}>
                Update live
              </Button>
            ) : (
              <Button type="button" onClick={() => save({ status: "PUBLISHED" })} pending={pending}>
                Publish now
              </Button>
            )}
          </div>
          {!live ? (
            <div className="space-y-2 rounded-md border border-rule-2 p-3">
              <label htmlFor="schedule" className="text-[13px] font-medium text-ink-2">
                Schedule
              </label>
              <div className="flex gap-2">
                <Input id="schedule" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="h-9 text-[13px]" />
                <Button type="button" size="sm" variant="secondary" className="h-9" pending={pending} onClick={() => save({ status: "SCHEDULED", publishAt: new Date(scheduleAt).toISOString() })}>
                  Set
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-rule-2 pt-3 text-[13px]">
            {post.status !== "REVIEW" && !live ? (
              <button type="button" className="text-ink-2 hover:text-ink" onClick={() => save({ status: "REVIEW" })}>
                Send for review
              </button>
            ) : null}
            {live || post.status === "SCHEDULED" ? (
              <button type="button" className="text-ink-2 hover:text-ink" onClick={() => save({ status: "DRAFT" })}>
                Unpublish to draft
              </button>
            ) : null}
            {post.id && post.status !== "ARCHIVED" ? (
              <button type="button" className="text-ink-2 hover:text-ink" onClick={() => save({ status: "ARCHIVED" })}>
                Archive
              </button>
            ) : null}
            {post.id ? (
              <a href={live ? `/blog/${post.slug}` : `/blog/preview/${post.id}`} target="_blank" rel="noopener" className="text-pine hover:underline">
                {live ? "View on site" : "Preview"}
              </a>
            ) : null}
          </div>
          {canDelete ? <p className="text-[12px] text-ink-3">Delete permanently from the blog list.</p> : null}
        </Section>

        <Section title="Cover image">
          {post.coverImageId ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-rule bg-paper-2">
              <Image src={`/blog-media/${post.coverImageId}`} alt={post.coverAlt} fill sizes="340px" className="object-cover" />
              <button type="button" onClick={() => set("coverImageId", "")} className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-ink/70 text-paper hover:bg-ink" aria-label="Remove cover">
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-rule bg-paper text-[13px] text-ink-3 hover:border-ink-3">
              <Upload className="size-5" />
              {uploading === "cover" ? "Uploading…" : "JPEG, PNG or WebP · up to 3 MB · 1600×900 is ideal"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCover(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <Field label="Alt text" error={errors.coverAlt}>
            {(p) => <Input {...p} value={post.coverAlt} onChange={(e) => set("coverAlt", e.target.value)} placeholder="What the image shows" />}
          </Field>
        </Section>

        <Section title="Organise">
          <Field label="Category">
            {(p) => (
              <Select {...p} value={post.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="space-y-2">
            <label htmlFor="tag-input" className="text-[13px] font-medium text-ink-2">
              Tags
            </label>
            {post.tags.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <li key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-paper-2 pr-1 pl-2.5 text-[12px] text-ink-2">
                    #{t}
                    <button type="button" aria-label={`Remove ${t}`} onClick={() => set("tags", post.tags.filter((x) => x !== t))} className="rounded-full p-0.5 hover:bg-rule">
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Input
              id="tag-input"
              value={tagDraft}
              placeholder="Type a tag, then Enter"
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
            />
          </div>
          <Field label="Author's title" hint="Shown after your name, e.g. Emergency physician.">
            {(p) => <Input {...p} value={post.authorTitle} onChange={(e) => set("authorTitle", e.target.value)} />}
          </Field>
          <label className="flex items-center gap-2.5 text-[14px] text-ink-2">
            <input type="checkbox" checked={post.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-pine" />
            Feature at the top of the blog
          </label>
        </Section>

        <Section title="Search & sharing">
          <div className="rounded-md border border-rule-2 bg-paper p-3">
            <p className="truncate text-[12px] text-ink-3">{siteUrl.replace(/^https?:\/\//, "")} › blog › {effectiveSlug || "…"}</p>
            <p className="mt-0.5 line-clamp-1 text-[16px] text-[#1a0dab]">{snippetTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-2">{snippetDesc}</p>
          </div>
          <Field label="SEO title" hint={<Counter value={post.metaTitle} max={70} warn={60} />} error={errors.metaTitle}>
            {(p) => <Input {...p} value={post.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Defaults to the title" />}
          </Field>
          <Field label="Meta description" hint={<Counter value={post.metaDescription} max={170} warn={155} />} error={errors.metaDescription}>
            {(p) => <Textarea {...p} rows={3} value={post.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="Defaults to the excerpt" />}
          </Field>
          <Field label="Focus keyword">
            {(p) => <Input {...p} value={post.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} placeholder="e.g. right ventricular infarction" />}
          </Field>
          {kwChecks.length ? (
            <ul className="space-y-1 text-[13px]">
              {kwChecks.map(([label, ok]) => (
                <li key={label as string} className={ok ? "text-tag-green" : "text-ink-3"}>
                  {ok ? "✓" : "○"} {label}
                </li>
              ))}
            </ul>
          ) : null}
          <Field label="Canonical URL" hint="Only if this was first published elsewhere." error={errors.canonicalUrl}>
            {(p) => <Input {...p} value={post.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://" className="font-mono text-[13px]" />}
          </Field>
          <label className="flex items-center gap-2.5 text-[14px] text-ink-2">
            <input type="checkbox" checked={post.noindex} onChange={(e) => set("noindex", e.target.checked)} className="size-4 accent-pine" />
            Hide from search engines
          </label>
        </Section>
      </div>
    </div>
  );
}

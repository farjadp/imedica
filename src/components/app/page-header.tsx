import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-[2rem] leading-tight font-medium tracking-[-0.015em] text-ink">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[15px] text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-card px-6 py-14 text-center">
      <h2 className="text-[17px] font-medium text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-3">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Panel({ title, aside, children, className }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-rule bg-card ${className ?? ""}`}>
      {title ? (
        <header className="flex items-center justify-between border-b border-rule px-5 py-3.5">
          <h2 className="text-[15px] font-medium text-ink">{title}</h2>
          {aside}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-paper-2 text-ink-2",
    IN_REVIEW: "bg-tag-yellow-wash text-tag-yellow",
    REVIEW: "bg-tag-yellow-wash text-tag-yellow",
    SCHEDULED: "bg-pine-wash text-pine",
    PUBLISHED: "bg-tag-green-wash text-tag-green",
    ARCHIVED: "bg-paper-2 text-ink-3 line-through",
  };
  const label: Record<string, string> = {
    DRAFT: "Draft",
    IN_REVIEW: "In review",
    REVIEW: "In review",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${styles[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}

// ============================================================================
// File: apps/web/src/App.tsx
// Version: 1.1.0 — 2026-04-22
// Why: Phase 2 landing shell. This stays intentionally lightweight until the
//      auth pages and dashboard arrive in later deliverables.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

export default function App() {
  return (
    <main className="min-h-screen bg-background text-text">
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_34%),linear-gradient(180deg,_var(--color-neutral-50)_0%,_var(--color-neutral-100)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_transparent_32%),linear-gradient(180deg,_var(--color-background)_0%,_var(--color-neutral-900)_100%)]"
        />

        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          {/* Brand mark placeholder until the UI system adds a real logo component. */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg">
            <span className="text-3xl font-semibold text-primary-600">+</span>
          </div>

          <p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-text-subtle">
            Imedica design system
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            Clinical training with a calmer, clearer interface.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Phase 2 starts with tokens, base primitives, and a web shell that is
            ready for auth pages, routing, and dashboard work.
          </p>

          <div className="mt-10 rounded-2xl border border-border bg-surface-elevated px-6 py-5 text-left shadow-md">
            <p className="text-sm leading-relaxed text-text-muted">
              <strong className="text-text">Current state:</strong> design tokens
              and Tailwind preset are now wired into the web app. The remaining
              Phase 2 deliverables will build on this foundation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

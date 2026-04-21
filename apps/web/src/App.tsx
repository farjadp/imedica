// ============================================================================
// File: apps/web/src/App.tsx
// Version: 1.0.0 — 2026-04-20
// Why: Root App component. Phase 1 scaffold — shows a "coming soon" page
//      so the dev server starts cleanly. Full routing implemented in Phase 2.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #0d4a42 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        {/* Imedica logo placeholder */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2rem',
          boxShadow: '0 20px 40px rgba(13, 148, 136, 0.3)',
        }}>
          ✚
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          margin: '0 0 0.5rem',
          background: 'linear-gradient(90deg, #5eead4, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Imedica
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '1.125rem',
          margin: '0 0 2rem',
        }}>
          Decision-training for Canadian paramedics
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          padding: '1.5rem 2rem',
          backdropFilter: 'blur(10px)',
          maxWidth: 400,
        }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            <strong style={{ color: '#94a3b8' }}>Phase 1 Foundation</strong>
            <br />
            Backend, auth, and privacy infrastructure initialized.
            <br />
            Full UI coming in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}

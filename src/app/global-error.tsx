'use client'

import { useEffect } from 'react'

// Catches errors thrown by the root layout itself (globals.css import,
// <html>/<body> rendering, etc.) — cases regular error.tsx can't handle, since
// error.tsx assumes the root layout above it still renders successfully. Next
// mounts this in place of the ENTIRE root layout when triggered, so it must
// render its own <html>/<body> and can't rely on globals.css or components
// that depend on it — inline styles only.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Une erreur critique est survenue</h1>
          <p style={{ maxWidth: '28rem', fontSize: '0.875rem', color: '#71717a', margin: 0 }}>
            L’application a rencontré un problème inattendu. Rechargez la page ou réessayez.
          </p>
          <button
            onClick={() => reset()}
            style={{
              borderRadius: '0.375rem',
              backgroundColor: '#111827',
              color: '#fff',
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}

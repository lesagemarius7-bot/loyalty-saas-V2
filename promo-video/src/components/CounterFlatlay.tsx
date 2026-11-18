import React from 'react'

// Minimalist first-person counter backdrop for the intro (Acte 0) — a
// straight-down flat-lay over a wood counter, no illustrated characters, no
// cartoon shop sign. Just light, wood grain, and a small typographic label.
// Shared by the two intro scenes so they read as "the same counter, a few
// days apart".
export function CounterFlatlay({
  children,
  dim = false,
}: {
  children?: React.ReactNode
  dim?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: dim
          ? 'radial-gradient(130% 110% at 50% 35%, #342a20 0%, #1c160f 70%, #110c08 100%)'
          : 'radial-gradient(130% 110% at 50% 25%, #e8ab66 0%, #c27f3c 55%, #96602a 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(100deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 2px, transparent 2px, transparent 30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(60% 50% at 50% 38%, rgba(255,255,255,0.1), transparent 70%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 80,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          color: dim ? 'rgba(255,255,255,0.4)' : 'rgba(58,36,18,0.55)',
        }}
      >
        Sushi Yama · Midi
      </div>

      {children}
    </div>
  )
}

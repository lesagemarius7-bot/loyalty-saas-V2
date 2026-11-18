// A coat's edge, in frame only as fabric — no silhouette, no face, no
// figure. Just a textured panel with a visible pocket slit, sliding in from
// off-screen to sell "someone reaches into their pocket" from a first-person
// point of view without ever drawing a person.
export function CoatPocket({ width = 260, height = 560 }: { width?: number; height?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 20,
        background: 'linear-gradient(100deg, #222a36 0%, #161c25 55%, #0d1117 100%)',
        boxShadow: '0 40px 70px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background:
            'repeating-linear-gradient(112deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 5px)',
        }}
      />
      <div style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* pocket slit */}
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          top: '40%',
          height: 11,
          borderRadius: 999,
          background: '#040507',
          boxShadow: 'inset 0 4px 7px rgba(0,0,0,0.7)',
        }}
      />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 'calc(40% + 11px)', height: 2, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

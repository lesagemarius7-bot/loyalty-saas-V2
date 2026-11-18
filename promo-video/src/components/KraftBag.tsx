// Flat-icon takeout bag — a folded-top kraft paper bag, drawn as plain
// shapes (no character, no face). Reads as "lunch to go" at a glance.
export function KraftBag({ width = 150 }: { width?: number }) {
  const height = width * 1.2
  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '22%',
          right: '22%',
          height: '16%',
          background: '#7a4e28',
          borderRadius: '3px 3px 0 0',
          clipPath: 'polygon(0 100%, 8% 0, 92% 0, 100% 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #d19753 0%, #ad7637 100%)',
          borderRadius: 8,
          boxShadow: 'inset 0 -26px 30px rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: width * 0.24,
          height: width * 0.24,
          borderRadius: 999,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: width * 0.13,
          boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
        }}
      >
        🍣
      </div>
    </div>
  )
}

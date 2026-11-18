// The analog counterpart to WalletCard — a worn kraft-paper stamp card, used
// in Act 1 to sell the contrast: this is what Loyalty replaces. Deliberately
// "undesigned" (slight rotation, a crease, a torn corner, a coffee ring)
// next to the crisp digital card elsewhere in the video.
export function PaperCard({
  stamps = 6,
  total = 10,
  width = 340,
  rotation = -3,
}: {
  stamps?: number
  total?: number
  width?: number
  rotation?: number
}) {
  const scale = width / 340

  return (
    <div
      style={{
        position: 'relative',
        width,
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.35))',
      }}
    >
      {/* torn corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 34 * scale,
          height: 34 * scale,
          background: '#0f0d0a',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: 'linear-gradient(155deg, #d9c49b 0%, #c7ad7c 55%, #b89a68 100%)',
          borderRadius: 6 * scale,
          padding: 20 * scale,
          clipPath: `polygon(0 0, calc(100% - ${34 * scale}px) 0, 100% ${34 * scale}px, 100% 100%, 0 100%)`,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        {/* paper grain / fold crease */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(115deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '38%',
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(0,0,0,0.12)',
            boxShadow: '1px 0 2px rgba(255,255,255,0.15)',
          }}
        />
        {/* coffee ring stain */}
        <div
          style={{
            position: 'absolute',
            right: 18 * scale,
            bottom: 14 * scale,
            width: 58 * scale,
            height: 58 * scale,
            borderRadius: 999,
            border: `${3 * scale}px solid rgba(90,54,16,0.25)`,
          }}
        />

        <p
          style={{
            position: 'relative',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 19 * scale,
            color: '#3a2a16',
            letterSpacing: -0.3,
          }}
        >
          🍱 Sushi Yama
        </p>
        <p
          style={{
            position: 'relative',
            margin: `${2 * scale}px 0 ${16 * scale}px`,
            fontFamily: 'Inter, sans-serif',
            fontSize: 12 * scale,
            fontWeight: 600,
            color: '#6b5636',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          10 plats achetés = 1 maki offert
        </p>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10 * scale,
          }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const filled = i < stamps
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 999,
                  border: `${1.5 * scale}px dashed rgba(90,54,16,0.4)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {filled && (
                  <span
                    style={{
                      fontSize: 15 * scale,
                      transform: `rotate(${((i * 37) % 20) - 10}deg)`,
                      color: '#7a3b1f',
                      opacity: 0.85,
                    }}
                  >
                    ●
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

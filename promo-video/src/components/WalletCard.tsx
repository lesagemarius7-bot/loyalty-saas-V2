import { LogoHorizontal } from './Logo'
import { QRCode } from './QRCode'

// Simplified port of loyalty-saas's LoyaltyCardVisual (Apple-wallet-style
// branch only — front face, no flip-to-back) — same markup/classes, minus
// the interactive back-of-card toggle and real logo upload, since the video
// always shows "Sushi Yama" (a Japanese lunch-takeout spot) as the demo
// merchant — see data/script.ts / VOICEOVER_SCRIPT.md for the story this
// serves (v3, "le midi au restaurant japonais").
export function WalletCard({
  businessName = 'Sushi Yama',
  subtitle = 'Carte de fidélité',
  backgroundColor = '#b5293e',
  textColor = '#ffffff',
  pointsBalance,
  rewardThreshold = 10,
  rewardDescription = '1 maki offert',
  stampIcon = '🍣',
  serialNumber = 'LOY-48213',
  width = 340,
}: {
  businessName?: string
  subtitle?: string
  backgroundColor?: string
  textColor?: string
  pointsBalance: number
  rewardThreshold?: number
  rewardDescription?: string
  stampIcon?: string
  serialNumber?: string
  width?: number
}) {
  const safeThreshold = Math.max(rewardThreshold, 1)
  const scale = width / 340

  return (
    <div
      style={{
        width,
        borderRadius: 20 * scale,
        overflow: 'hidden',
        background: backgroundColor,
        color: textColor,
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ padding: 20 * scale, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 * scale }}>
          <div
            style={{
              width: 32 * scale,
              height: 32 * scale,
              borderRadius: 8 * scale,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16 * scale,
              fontWeight: 700,
            }}
          >
            {stampIcon}
          </div>
          <span style={{ fontSize: 12 * scale, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>
            {businessName}
          </span>
        </div>

        <p style={{ marginTop: 16 * scale, fontSize: 11 * scale, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
          {subtitle}
        </p>
        <p style={{ fontSize: 36 * scale, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
          {pointsBalance} <span style={{ fontSize: 15 * scale, fontWeight: 600, opacity: 0.7 }}>/ {rewardThreshold} pts</span>
        </p>

        <div style={{ margin: `${20 * scale}px 0` }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 9 * scale,
              borderRadius: 14 * scale,
              background: 'rgba(0,0,0,0.12)',
              padding: 12 * scale,
            }}
          >
            {Array.from({ length: safeThreshold }).map((_, i) => {
              const filled = i < pointsBalance
              const isReward = i === safeThreshold - 1
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: filled ? '#fff' : 'rgba(255,255,255,0.1)',
                    border: filled ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    color: '#0f1729',
                    fontSize: 13 * scale,
                    fontWeight: 700,
                  }}
                >
                  {filled ? stampIcon : isReward ? '🎁' : ''}
                </div>
              )
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: `${12 * scale}px 0`,
            fontSize: 12 * scale,
          }}
        >
          <span style={{ textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>Récompense</span>
          <span style={{ fontWeight: 700 }}>{rewardDescription}</span>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          padding: 16 * scale,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4 * scale,
        }}
      >
        <QRCode size={88 * scale} />
        <p style={{ fontFamily: 'monospace', fontSize: 10 * scale, letterSpacing: 2, color: '#64748b', margin: 0 }}>
          {serialNumber}
        </p>
        <LogoHorizontal style={{ height: 16 * scale, width: 'auto', opacity: 0.75, marginTop: 2 * scale }} />
      </div>
    </div>
  )
}

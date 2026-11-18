import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { WalletCard } from '../components/WalletCard'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

export function WalletAddScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Button press feedback, then the card slides in from below and settles.
  const pressScale = interpolate(frame, [18, 24, 30], [1, 0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardProgress = spring({ frame: frame - 28, fps, config: { damping: 16, mass: 0.8 } })
  const cardY = interpolate(cardProgress, [0, 1], [420, 0])
  const buttonOpacity = interpolate(frame, [28, 40], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const badgeOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // "Cumule ses points instantanément" — the first point lands a beat after
  // the card is added, not before, so the instant-accrual claim actually
  // reads as happening on screen rather than as a static number.
  const pointsIn = spring({ frame: frame - 92, fps, config: { damping: 9, mass: 0.5 } })
  const pointsBalance = pointsIn > 0.4 ? 1 : 0
  const pointsPop = interpolate(pointsIn, [0, 0.4, 1], [1, 1.08, 1])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.backgroundDark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SceneKicker label="Côté client" />

      <PhoneFrame>
        <StatusBar />
        <div style={{ position: 'absolute', inset: 0, background: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: `translateY(${cardY}px) scale(${pointsPop})` }}>
            <WalletCard pointsBalance={pointsBalance} width={320} />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 64,
              left: 24,
              right: 24,
              opacity: buttonOpacity,
              transform: `scale(${pressScale})`,
            }}
          >
            <div
              style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 14,
                padding: '14px 0',
                textAlign: 'center',
                color: '#fff',
                fontSize: 17,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="14" rx="3" stroke="#fff" strokeWidth="1.6" />
                <path d="M2 10h20" stroke="#fff" strokeWidth="1.6" />
              </svg>
              Ajouter à Apple Wallet
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 64,
              left: 24,
              right: 24,
              opacity: badgeOpacity,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: colors.accent,
                color: '#fff',
                borderRadius: 999,
                padding: '10px 20px',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              ✓ Ajoutée à Apple Wallet
            </span>
          </div>
        </div>
      </PhoneFrame>

      <Caption text={getCaption('walletAdd')} delay={40} />
    </div>
  )
}

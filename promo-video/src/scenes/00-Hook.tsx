import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { WalletCard } from '../components/WalletCard'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

// The cold open — frame 0 of the whole video. No slow build-up: the
// WalletCard is already live inside Apple Wallet from the first frame, a
// scan confirmation flashes almost immediately, and a point lands right
// after. The proof-of-concept shown before anything is explained — the
// detailed walkthrough (scan, Wallet add, …) comes right after and earns
// its own time because the viewer already knows what they're looking at.
export function HookScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scanPulse = interpolate(frame, [8, 24, 40], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const pointsIn = spring({ frame: frame - 30, fps, config: { damping: 9, mass: 0.5 } })
  const points = pointsIn > 0.4 ? 7 : 6
  const cardPop = interpolate(pointsIn, [0, 0.4, 1], [1, 1.07, 1])
  const plusOneOpacity = interpolate(frame, [30, 38, 70, 82], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(120% 100% at 50% 20%, ${colors.primaryDark}33 0%, ${colors.backgroundDark} 65%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SceneKicker label="Côté client" />

      <PhoneFrame>
        <StatusBar />
        <div style={{ position: 'absolute', inset: 0, background: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* scan confirmation ring, pulses once right after the card appears */}
          <div
            style={{
              position: 'absolute',
              width: 360,
              height: 360,
              borderRadius: 999,
              border: `2px solid ${colors.accent}`,
              opacity: scanPulse * 0.6,
              transform: `scale(${interpolate(scanPulse, [0, 1], [0.7, 1.15])})`,
            }}
          />

          <div style={{ position: 'relative', transform: `scale(${cardPop})` }}>
            <WalletCard pointsBalance={points} width={320} />
            <span
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: colors.accent,
                color: '#fff',
                fontWeight: 800,
                fontSize: 20,
                borderRadius: 999,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: plusOneOpacity,
                boxShadow: `0 10px 20px ${colors.accent}66`,
              }}
            >
              +1
            </span>
          </div>
        </div>
      </PhoneFrame>

      <Caption text={getCaption('hook')} delay={2} />
    </div>
  )
}

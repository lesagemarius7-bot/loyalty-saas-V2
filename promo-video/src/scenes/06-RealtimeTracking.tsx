import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { WalletCard } from '../components/WalletCard'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

const SYNC_FRAME = 55

// Act 3 opener — the "money shot" proving the tracking claim: a stamp lands
// on the client's phone and a dashboard counter ticks up in the same beat,
// with a pulse traveling along the connecting line between them. Client and
// merchant sides on screen at once, instead of asserted separately.
export function RealtimeTrackingScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const frameOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const flip = spring({ frame: frame - SYNC_FRAME, fps, config: { damping: 10, mass: 0.5 } })
  const stamps = flip > 0.5 ? 7 : 6
  const cardScale = interpolate(flip, [0, 0.5, 1], [1, 1.05, 1])

  const pulseProgress = interpolate(frame, [SYNC_FRAME, SYNC_FRAME + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pulseOpacity = interpolate(frame, [SYNC_FRAME, SYNC_FRAME + 4, SYNC_FRAME + 20, SYNC_FRAME + 26], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const counter = frame >= SYNC_FRAME + 20 ? 128 : 127
  const counterPop = interpolate(frame, [SYNC_FRAME + 18, SYNC_FRAME + 24, SYNC_FRAME + 30], [1, 1.12, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ width: '100%', height: '100%', background: colors.backgroundDark, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, opacity: frameOpacity }}>
      <SceneKicker label="Côté client + commerçant" />

      <PhoneFrame width={260} height={530}>
        <StatusBar />
        <div style={{ position: 'absolute', inset: 0, background: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: `scale(${cardScale})` }}>
            <WalletCard pointsBalance={stamps} rewardThreshold={10} width={195} />
          </div>
        </div>
      </PhoneFrame>

      {/* connecting pulse line */}
      <div style={{ position: 'relative', width: 160, height: 2 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.12)' }} />
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: `${pulseProgress * 100}%`,
            width: 10,
            height: 10,
            borderRadius: 999,
            background: colors.accent,
            opacity: pulseOpacity,
            boxShadow: `0 0 16px ${colors.accent}`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px 32px',
          minWidth: 260,
          boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: colors.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 }}>
            En direct
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.mutedForeground }}>Visites enregistrées</p>
        <p style={{ margin: '4px 0 0', fontSize: 44, fontWeight: 800, color: colors.foreground, transform: `scale(${counterPop})`, transformOrigin: 'left' }}>
          {counter}
        </p>
      </div>

      <Caption text={getCaption('realtimeTracking')} delay={15} />
    </div>
  )
}

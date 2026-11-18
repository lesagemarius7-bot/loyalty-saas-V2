import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { PaperCard } from '../components/PaperCard'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { WalletCard } from '../components/WalletCard'
import { LogoMarkTile } from '../components/Logo'
import { Caption } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

// Act 1 → Act 2 pivot — the whole story's "turn": the muted paper card
// crossfades into the crisp digital WalletCard while the background itself
// shifts from grey to full brand color, then resolves into the Loyalty
// lockup. The one scene in the cut that does double duty as both the end of
// the old world and the start of the new one.
export function DigitalShiftScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Phase A (0–95): old card dissolves as the digital card fades in; the
  // background itself turns from grey to brand gradient underneath.
  const shift = interpolate(frame, [15, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardOutOpacity = interpolate(frame, [0, 70], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const phoneInOpacity = interpolate(frame, [35, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const phoneScale = interpolate(frame, [35, 95], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Phase B (100–208): card/phone clear out, the Loyalty lockup resolves.
  const sceneOutOpacity = interpolate(frame, [95, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const lockupOpacity = interpolate(frame, [110, 135], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const markSpring = spring({ frame: frame - 108, fps, config: { damping: 12, mass: 0.6 } })
  const markScale = interpolate(markSpring, [0, 1], [0.5, 1])
  const taglineOpacity = interpolate(frame, [130, 148], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* grey → brand background crossfade */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 30%, #4a443c 0%, #27241f 70%, #18160f 100%)', opacity: 1 - shift }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 100% at 50% 20%, ${colors.primaryDark}33 0%, ${colors.backgroundDark} 65%)`,
          opacity: shift,
        }}
      />

      {/* Phase A: card → phone crossfade */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sceneOutOpacity }}>
        <div style={{ position: 'absolute', opacity: cardOutOpacity }}>
          <PaperCard stamps={9} width={300} rotation={-4} />
        </div>
        <div style={{ position: 'absolute', opacity: phoneInOpacity, transform: `scale(${phoneScale})` }}>
          <PhoneFrame width={300} height={612}>
            <StatusBar />
            <div style={{ position: 'absolute', inset: 0, background: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WalletCard pointsBalance={6} rewardThreshold={10} width={230} />
            </div>
          </PhoneFrame>
        </div>
      </div>

      {/* Phase B: Loyalty lockup */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          opacity: lockupOpacity,
        }}
      >
        <div style={{ transform: `scale(${markScale})` }}>
          <LogoMarkTile size={100} />
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 46, color: '#fff', margin: 0 }}>Loyalty</p>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 24,
            color: 'rgba(255,255,255,0.75)',
            margin: 0,
            textAlign: 'center',
            maxWidth: 760,
            opacity: taglineOpacity,
          }}
        >
          Entre-temps, Sushi Yama avait adopté Loyalty.
        </p>
      </div>

      <Caption text={getCaption('digitalShift')} delay={108} />
    </div>
  )
}

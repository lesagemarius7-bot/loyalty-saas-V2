import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { LogoMarkTile } from '../components/Logo'
import { Caption } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

// The brand reveal — right after HookScene has already proven the product
// works, this just names it. Used to also carry the old paper-card → phone
// dissolve (the "pivot" backstory) as its own slow opening beat, but that's
// redundant now that HookScene opens the video on the digital card directly
// — cut down to just the logo/wordmark/tagline moment it was building to.
export function DigitalShiftScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const markSpring = spring({ frame, fps, config: { damping: 12, mass: 0.6 } })
  const markScale = interpolate(markSpring, [0, 1], [0.6, 1])
  const markOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const nameOpacity = interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const taglineOpacity = interpolate(frame, [26, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const taglineY = interpolate(frame, [26, 40], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: `radial-gradient(120% 100% at 50% 20%, ${colors.primaryDark}33 0%, ${colors.backgroundDark} 65%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
        <LogoMarkTile size={92} />
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 44, color: '#fff', margin: 0, opacity: nameOpacity }}>
        Loyalty
      </p>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 22,
          color: 'rgba(255,255,255,0.75)',
          margin: 0,
          textAlign: 'center',
          maxWidth: 720,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Entre-temps, Sushi Yama avait adopté Loyalty.
      </p>

      <Caption text={getCaption('digitalShift')} delay={48} />
    </div>
  )
}

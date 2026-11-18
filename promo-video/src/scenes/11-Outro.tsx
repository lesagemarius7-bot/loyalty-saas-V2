import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { LogoHorizontal } from '../components/Logo'
import { getCaption } from '../data/script'
import { colors } from '../theme'

export function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoProgress = spring({ frame, fps, config: { damping: 14 } })
  const logoScale = interpolate(logoProgress, [0, 1], [0.85, 1])
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const taglineOpacity = interpolate(frame, [16, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ctaOpacity = interpolate(frame, [36, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ctaY = interpolate(frame, [36, 48], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Generous closing hold on this scene (~8.6s) — a slow breathing glow on
  // the CTA keeps it from reading as a frozen frame.
  const ctaGlow = 18 + Math.sin(frame / 20) * 8

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <div style={{ transform: `scale(${logoScale})`, opacity: logoOpacity }}>
        <LogoHorizontal style={{ height: 70, width: 'auto' }} />
      </div>

      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: 26,
          color: colors.mutedForeground,
          margin: 0,
          opacity: taglineOpacity,
        }}
      >
        {getCaption('outro')}
      </p>

      <div style={{ opacity: ctaOpacity, transform: `translateY(${ctaY}px)`, marginTop: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: colors.primary,
            color: '#fff',
            borderRadius: 999,
            padding: '16px 36px',
            fontSize: 20,
            fontWeight: 700,
            boxShadow: `0 0 ${ctaGlow}px ${colors.primary}55`,
          }}
        >
          loyaltyapp.click
        </div>
      </div>
    </div>
  )
}

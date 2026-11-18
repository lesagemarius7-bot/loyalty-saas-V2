import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// Bold kinetic caption, bottom-third — most YC demo reels keep the VO
// legible even muted. Springs in from below, holds, and is clipped by the
// scene's own Sequence duration (no manual exit animation needed).
export function Caption({ text, delay = 0 }: { text: string; delay?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - delay

  const progress = spring({ frame: local, fps, config: { damping: 18, mass: 0.6 } })
  const translateY = interpolate(progress, [0, 1], [24, 0])
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  if (local < 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 90,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 80px',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 40,
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.25,
          textShadow: '0 4px 24px rgba(0,0,0,0.5)',
          maxWidth: 1100,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  )
}

// Filled badge ("CÔTÉ CLIENT" / "CÔTÉ COMMERÇANT") pinned top-left to orient
// the viewer on which side of the product the current scene shows — a
// translucent pill with a visible fill (not just a dot + text) so it reads
// at a glance, on both light and dark scene backgrounds.
export function SceneKicker({ label, dark = true }: { label: string; dark?: boolean }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        left: 72,
        opacity,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 18px 9px 14px',
        borderRadius: 999,
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,41,0.07)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,41,0.1)'}`,
        boxShadow: dark ? '0 8px 20px rgba(0,0,0,0.25)' : '0 4px 14px rgba(15,23,41,0.06)',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: '#1bc08f', flexShrink: 0 }} />
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: dark ? '#ffffff' : '#0f1729',
        }}
      >
        {label}
      </span>
    </div>
  )
}

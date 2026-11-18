import { LogoMarkTile } from './Logo'

export function LockScreenWallpaper({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(120% 90% at 50% 0%, #2b2f8f 0%, #141632 55%, #07070d 100%)',
      }}
    >
      {children}
    </div>
  )
}

export function LockScreenClock({ time = '9:41', date = 'Mardi 18 novembre' }: { time?: string; date?: string }) {
  return (
    <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>
      <p style={{ fontSize: 17, fontWeight: 600, opacity: 0.9, margin: 0, textTransform: 'capitalize' }}>{date}</p>
      <p style={{ fontSize: 88, fontWeight: 600, margin: 0, lineHeight: 1, letterSpacing: -2 }}>{time}</p>
    </div>
  )
}

// iOS-style push notification banner — the same lock-screen bubble shown in
// NotificationComposer's preview panel (notification-composer.tsx), redrawn
// at phone-mockup scale with the merchant logo (ported LogoMarkTile) instead
// of initials since the video always has real branding to show.
export function NotificationBanner({
  title = 'Sushi Yama',
  body = '🍣 Vos makis préférés à -15% ce midi, juste pour vous.',
  time = 'maintenant',
}: {
  title?: string
  body?: string
  time?: string
}) {
  return (
    <div
      style={{
        margin: '0 16px',
        borderRadius: 20,
        background: 'rgba(30,32,42,0.72)',
        backdropFilter: 'blur(20px)',
        padding: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
      }}
    >
      <LogoMarkTile size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {title}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{time}</span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 400, color: '#fff', lineHeight: 1.3 }}>{body}</p>
      </div>
    </div>
  )
}

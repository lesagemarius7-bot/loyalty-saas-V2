import { Img, staticFile } from 'remotion'

// Both source PNGs (public/brand/*) have an opaque white background, not
// transparency — copied straight from loyalty-saas/public/branding and
// /public/images. Always place them on a white surface (a card/tile), never
// directly over a dark background, or you'll get a visible white box.
export function LogoHorizontal({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Img
      src={staticFile('brand/loyalty-logo-horizontal.png')}
      alt="Loyalty"
      className={className}
      style={{ objectFit: 'contain', ...style }}
    />
  )
}

export function LogoMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Img
      src={staticFile('brand/logo-mark.png')}
      alt="Loyalty"
      className={className}
      style={{ objectFit: 'contain', ...style }}
    />
  )
}

// The mark on its own white rounded tile — safe to drop on any background
// (dark lock screens, gradients), mimicking an app-icon treatment.
export function LogoMarkTile({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(15, 23, 41, 0.25)',
      }}
    >
      <LogoMark style={{ width: size * 0.72, height: size * 0.72 }} />
    </div>
  )
}

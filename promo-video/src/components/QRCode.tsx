import React from 'react'

// Decorative scan target — same deterministic-pattern approach as the
// fallback QR block in loyalty-saas's LoyaltyCardVisual (real QR data isn't
// the point here, a convincing static pattern is). Finder squares added for
// a more legible "this is a QR code" silhouette at video scale.
export function QRCode({ size = 180, color = '#0f1729' }: { size?: number; color?: string }) {
  const cells = 21
  const cell = size / cells
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)

  const dots: React.ReactNode[] = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) continue
      const on = (r * 13 + c * 7 + r * c) % 5 < 2
      if (!on) continue
      dots.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={color} />)
    }
  }

  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`} transform={`translate(${x}, ${y})`}>
      <rect width={cell * 7} height={cell * 7} fill={color} rx={cell * 0.8} />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} fill="#fff" rx={cell * 0.5} />
      <rect x={cell * 2.1} y={cell * 2.1} width={cell * 2.8} height={cell * 2.8} fill={color} rx={cell * 0.4} />
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {dots}
      {finder(0, 0)}
      {finder((cells - 7) * cell, 0)}
      {finder(0, (cells - 7) * cell)}
    </svg>
  )
}

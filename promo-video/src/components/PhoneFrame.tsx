import React from 'react'

// A drawn (not photographed) iPhone chrome: rounded case, side buttons,
// dynamic island. Kept purely in CSS/SVG so it renders crisply at any scale
// and composites cleanly over scene backgrounds/transitions.
export function PhoneFrame({
  children,
  width = 420,
  height = 860,
}: {
  children: React.ReactNode
  width?: number
  height?: number
}) {
  const radius = width * 0.21

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(155deg, #3a3f4a, #121419)',
        padding: width * 0.028,
        boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 10px 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Side buttons */}
      <div style={{ position: 'absolute', left: -3, top: height * 0.16, width: 3, height: height * 0.045, background: '#0f1115', borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: -3, top: height * 0.23, width: 3, height: height * 0.08, background: '#0f1115', borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: -3, top: height * 0.33, width: 3, height: height * 0.08, background: '#0f1115', borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: -3, top: height * 0.22, width: 3, height: height * 0.12, background: '#0f1115', borderRadius: 2 }} />

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: radius * 0.82,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {children}

        {/* Dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.014,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.28,
            height: height * 0.032,
            borderRadius: 999,
            background: '#000',
            zIndex: 50,
          }}
        />
      </div>
    </div>
  )
}

export function StatusBar({ dark = true, time = '9:41' }: { dark?: boolean; time?: string }) {
  const color = dark ? '#ffffff' : '#0f1729'
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        color,
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: -0.2,
        zIndex: 40,
      }}
    >
      <span>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill={color}>
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path
            d="M8 10.2a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2ZM4.8 6.6a4.6 4.6 0 0 1 6.4 0M2 3.9a8.6 8.6 0 0 1 12 0"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        {/* battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.5" stroke={color} strokeOpacity="0.5" strokeWidth="1.2" />
          <rect x="2.3" y="2.3" width="17.4" height="7.4" rx="1.3" fill={color} />
          <rect x="22" y="4" width="2" height="4" rx="1" fill={color} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

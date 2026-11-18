import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { QRCode } from '../components/QRCode'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

export function ScanQRScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Scan-bracket pulses in, then a "found" checkmark confirms the scan.
  const bracketIn = spring({ frame, fps, config: { damping: 16 } })
  const bracketScale = interpolate(bracketIn, [0, 1], [1.15, 1])
  const foundProgress = spring({ frame: frame - 95, fps, config: { damping: 14 } })
  const foundOpacity = interpolate(foundProgress, [0, 1], [0, 1])
  const foundScale = interpolate(foundProgress, [0, 1], [0.6, 1])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(160deg, #f3f0ff 0%, ${colors.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SceneKicker label="Côté client" dark={false} />

      <PhoneFrame>
        <StatusBar dark={false} />
        <div style={{ position: 'absolute', inset: 0, background: '#e2e8f0' }}>
          {/* "counter" scene behind the camera viewfinder */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(170deg, #cbd5e1 0%, #94a3b8 100%)',
            }}
          />

          {/* viewfinder frame */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 230,
              height: 230,
              transform: `translate(-50%, -50%) scale(${bracketScale})`,
            }}
          >
            {[
              { top: 0, left: 0, borderWidth: '6px 0 0 6px', borderRadius: '16px 0 0 0' },
              { top: 0, right: 0, borderWidth: '6px 6px 0 0', borderRadius: '0 16px 0 0' },
              { bottom: 0, left: 0, borderWidth: '0 0 6px 6px', borderRadius: '0 0 0 16px' },
              { bottom: 0, right: 0, borderWidth: '0 6px 6px 0', borderRadius: '0 0 16px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 48, height: 48, borderColor: '#fff', borderStyle: 'solid', ...s }} />
            ))}

            <div style={{ position: 'absolute', inset: 20, background: '#fff', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCode size={150} />
            </div>
          </div>

          <p style={{ position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            Scannez le QR code en caisse
          </p>

          {/* "found" confirmation */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'rgba(72, 63, 233, 0.92)',
              opacity: foundOpacity,
              transform: `scale(${foundScale})`,
            }}
          >
            <div style={{ width: 84, height: 84, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M4 12.5L9.5 18L20 6" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Carte trouvée !</p>
          </div>
        </div>
      </PhoneFrame>

      <Caption text={getCaption('scanQR')} delay={40} />
    </div>
  )
}

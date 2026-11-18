import { interpolate, useCurrentFrame } from 'remotion'
import { BrowserFrame, DashboardSidebar } from '../components/DashboardChrome'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

const SEGMENTS = [
  { icon: '🕐', label: 'Habitués du midi' },
  { icon: '🍣', label: 'Amateurs de makis' },
]

function SegmentChip({ icon, label, frame, appearAt }: { icon: string; label: string; frame: number; appearAt: number }) {
  const progress = interpolate(frame, [appearAt, appearAt + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const selected = frame > appearAt + 10
  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 999,
        marginRight: 10,
        fontSize: 14,
        fontWeight: 700,
        background: selected ? colors.primary : '#fff',
        color: selected ? '#fff' : colors.foreground,
        border: `1px solid ${selected ? colors.primary : colors.border}`,
      }}
    >
      <span>{icon}</span>
      {label}
      {selected && <span>✓</span>}
    </div>
  )
}

// Acte 1 — "campagnes ultra-ciblées créées en fonction de l'historique
// d'achats". Shows the targeting step on its own (audience built from real
// purchase-pattern segments) before 09-SendTargetedCampaign composes and
// sends the message to that exact audience.
export function AudienceTargetingScene() {
  const frame = useCurrentFrame()
  const frameOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const countOpacity = interpolate(frame, [60, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const countProgress = interpolate(frame, [60, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const count = Math.round(47 * countProgress)

  return (
    <div style={{ width: '100%', height: '100%', background: colors.secondaryDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SceneKicker label="Côté commerçant" />

      <div style={{ opacity: frameOpacity }}>
        <BrowserFrame>
          <DashboardSidebar activeHref="/dashboard/notifications" />
          <div style={{ flex: 1, background: colors.secondary, padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.foreground }}>Nouvelle campagne ciblée</h1>
            <p style={{ margin: '4px 0 24px', fontSize: 14, color: colors.mutedForeground }}>
              Construite depuis l’historique d’achats réel de vos clients.
            </p>

            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, maxWidth: 640 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Segments
              </p>
              <div>
                {SEGMENTS.map((s, i) => (
                  <SegmentChip key={s.label} {...s} frame={frame} appearAt={20 + i * 22} />
                ))}
              </div>

              <div style={{ marginTop: 24, opacity: countOpacity, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: colors.foreground }}>{count}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: colors.mutedForeground }}>clients ciblés</span>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>

      <Caption text={getCaption('audienceTargeting')} delay={45} />
    </div>
  )
}

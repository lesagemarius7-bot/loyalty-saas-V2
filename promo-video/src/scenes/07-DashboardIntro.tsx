import { interpolate, useCurrentFrame } from 'remotion'
import { BrowserFrame, DashboardSidebar } from '../components/DashboardChrome'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

// Tile choice mirrors the VO's three questions almost verbatim ("qui
// revient, qui décroche, qui dépense le plus") — the dashboard literally
// answers the questions MerchantBlindnessScene posed as "?" placeholders.
// `trend` lands after the count-up to sell "this updates live", not just a
// static end-state snapshot.
const TILES = [
  { label: 'Clients qui reviennent', value: 312, suffix: '', trend: '+9 aujourd’hui' },
  { label: 'Clients inactifs (à relancer)', value: 58, suffix: '', trend: '-3 cette semaine' },
  { label: 'Panier moyen', value: 18, suffix: '€', trend: '+1,40€ ce mois-ci' },
]

function StatTile({
  label,
  value,
  suffix,
  trend,
  frame,
}: {
  label: string
  value: number
  suffix: string
  trend: string
  frame: number
}) {
  const progress = interpolate(frame, [20, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const current = Math.round(value * progress)
  const trendOpacity = interpolate(frame, [82, 98], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const trendY = interpolate(frame, [82, 98], [8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Subtle "still live" pulse on the dot after the trend lands, well past
  // the count-up — a static tile reads as a screenshot, this doesn't.
  const pulse = 0.5 + Math.sin(frame / 10) * 0.5

  return (
    <div style={{ flex: 1, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 13, color: colors.mutedForeground, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 34, fontWeight: 800, color: colors.foreground }}>
        {current}
        {suffix}
      </p>
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: trendOpacity,
          transform: `translateY(${trendY}px)`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.accent, opacity: 0.5 + pulse * 0.5 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>{trend}</span>
      </div>
    </div>
  )
}

export function DashboardIntroScene() {
  const frame = useCurrentFrame()
  // Active nav sweeps from "Vue d'ensemble" to "Automatisation" to sell the
  // breadth of the dashboard in one motion. Thresholds sized to this scene's
  // own DURATIONS.dashboardIntro (theme.ts) — keep roughly in thirds if you
  // retime it.
  const active = frame < 65 ? '/dashboard' : frame < 135 ? '/dashboard/customers' : '/dashboard/playbooks'
  const frameOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const frameScale = interpolate(frame, [0, 15], [0.96, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: '100%', height: '100%', background: colors.secondaryDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SceneKicker label="Côté commerçant" />

      <div style={{ opacity: frameOpacity, transform: `scale(${frameScale})` }}>
        <BrowserFrame>
          <DashboardSidebar activeHref={active} />
          <div style={{ flex: 1, background: colors.secondary, padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.foreground }}>Vue d’ensemble</h1>
            <p style={{ margin: '4px 0 24px', fontSize: 14, color: colors.mutedForeground }}>
              Les réponses que le carton ne vous a jamais données.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {TILES.map((t) => (
                <StatTile key={t.label} {...t} frame={frame} />
              ))}
            </div>
          </div>
        </BrowserFrame>
      </div>

      <Caption text={getCaption('dashboardIntro')} delay={55} />
    </div>
  )
}

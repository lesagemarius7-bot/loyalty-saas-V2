import { interpolate, useCurrentFrame } from 'remotion'
import { BrowserFrame, DashboardSidebar } from '../components/DashboardChrome'
import { PlaybookCard } from '../components/PlaybookCard'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

export function PlaybookActivateScene() {
  const frame = useCurrentFrame()
  const frameOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const toggling = frame > 55 && frame < 75
  const enabled = frame >= 65
  const statOpacity = interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const statY = interpolate(frame, [110, 130], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: '100%', height: '100%', background: colors.secondaryDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SceneKicker label="Côté commerçant" />

      <div style={{ opacity: frameOpacity }}>
        <BrowserFrame>
          <DashboardSidebar activeHref="/dashboard/playbooks" />
          <div style={{ flex: 1, background: colors.secondary, padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.foreground }}>Playbooks & Automatisation</h1>
            <p style={{ margin: '4px 0 24px', fontSize: 14, color: colors.mutedForeground }}>
              Un client inactif ? L’IA le relance pour vous, automatiquement.
            </p>

            <PlaybookCard enabled={enabled} toggling={toggling} />

            <div style={{ opacity: statOpacity, transform: `translateY(${statY}px)`, marginTop: 16 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${colors.accent}1a`,
                  color: colors.accent,
                  borderRadius: 999,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ↗ +18% de clients réactivés ce mois-ci
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>

      <Caption text={getCaption('playbookActivate')} delay={50} />
    </div>
  )
}

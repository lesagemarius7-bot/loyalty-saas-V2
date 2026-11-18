import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BrowserFrame, DashboardSidebar } from '../components/DashboardChrome'
import { NotificationComposerPreview } from '../components/NotificationComposerPreview'
import { Button } from '../components/ui/Button'
import { PhoneFrame, StatusBar } from '../components/PhoneFrame'
import { LockScreenWallpaper, LockScreenClock, NotificationBanner } from '../components/LockScreen'
import { Caption, SceneKicker } from '../components/Caption'
import { getCaption } from '../data/script'
import { colors } from '../theme'

const FULL_TITLE = 'Spécial habitués ✨'
const FULL_BODY = 'Vos makis préférés à -15% ce midi, juste pour vous.'

function typedSlice(text: string, frame: number, start: number, charsPerFrame = 1.7) {
  const chars = Math.max(0, Math.floor((frame - start) * charsPerFrame))
  return text.slice(0, chars)
}

// Acte 1 — the payoff of AudienceTargetingScene: the message gets written
// for that exact 47-person segment, sent, and lands where it matters — the
// client's lock screen. Two phases in one scene (dashboard → phone) so the
// "sent" action and its real-world result read as one continuous beat.
export function SendTargetedCampaignScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const frameOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const title = typedSlice(FULL_TITLE, frame, 10)
  const body = typedSlice(FULL_BODY, frame, 26)

  const sendPress = interpolate(frame, [88, 94, 100], [1, 0.93, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const toastOpacity = interpolate(frame, [102, 114], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const toastY = interpolate(frame, [102, 114], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Phase B — crossfade into the phone, the banner landing on the lock screen.
  const dashboardOutOpacity = interpolate(frame, [118, 140], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const phoneInOpacity = interpolate(frame, [128, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bannerProgress = spring({ frame: frame - 150, fps, config: { damping: 15, mass: 0.7 } })
  const bannerY = interpolate(bannerProgress, [0, 1], [-140, 0])
  const bannerOpacity = interpolate(frame, [150, 160], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ width: '100%', height: '100%', background: colors.secondaryDark, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SceneKicker label="Côté commerçant" />

      <div style={{ position: 'absolute', inset: 0, opacity: frameOpacity * dashboardOutOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BrowserFrame>
          <DashboardSidebar activeHref="/dashboard/notifications" />
          <div style={{ flex: 1, background: colors.secondary, padding: 32, position: 'relative' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.foreground }}>Notifications</h1>
            <p style={{ margin: '4px 0 24px', fontSize: 14, color: colors.mutedForeground }}>
              Envoi à <strong>47 clients ciblés</strong> — habitués du midi, amateurs de makis.
            </p>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <NotificationComposerPreview title={title} body={body} />
              <div style={{ transform: `scale(${sendPress})`, marginTop: 4 }}>
                <Button>Envoyer la campagne</Button>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: 32,
                opacity: toastOpacity,
                transform: `translateY(${toastY}px)`,
                background: '#fff',
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: '14px 20px',
                boxShadow: '0 20px 40px rgba(15,23,41,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ color: colors.accent, fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.foreground }}>47 notifications envoyées</span>
            </div>
          </div>
        </BrowserFrame>
      </div>

      <div style={{ position: 'absolute', inset: 0, opacity: phoneInOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PhoneFrame>
          <LockScreenWallpaper>
            <StatusBar />
            <LockScreenClock />
            <div style={{ position: 'absolute', top: 330, left: 0, right: 0, opacity: bannerOpacity, transform: `translateY(${bannerY}px)` }}>
              <NotificationBanner title="Sushi Yama" body={FULL_BODY} />
            </div>
          </LockScreenWallpaper>
        </PhoneFrame>
      </div>

      <Caption text={getCaption('sendTargetedCampaign')} delay={125} />
    </div>
  )
}

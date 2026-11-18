import './font'
import { Composition } from 'remotion'
import './index.css'
import { PromoVideo } from './PromoVideo'
import { VIDEO_WIDTH, VIDEO_HEIGHT, FPS, TOTAL_DURATION, DURATIONS } from './theme'

import { HookScene } from './scenes/00-Hook'
import { FirstVisitCardReceivedScene } from './scenes/01-FirstVisitCardReceived'
import { CardLostDisappointmentScene } from './scenes/02-CardLostDisappointment'
import { DigitalShiftScene } from './scenes/03-DigitalShift'
import { ScanQRScene } from './scenes/04-ScanQR'
import { WalletAddScene } from './scenes/05-WalletAdd'
import { RealtimeTrackingScene } from './scenes/06-RealtimeTracking'
import { DashboardIntroScene } from './scenes/07-DashboardIntro'
import { AudienceTargetingScene } from './scenes/08-AudienceTargeting'
import { SendTargetedCampaignScene } from './scenes/09-SendTargetedCampaign'
import { PlaybookActivateScene } from './scenes/10-PlaybookActivate'
import { OutroScene } from './scenes/11-Outro'

// Individual scenes are also registered standalone below — handy in Remotion
// Studio for retiming/tweaking one beat without scrubbing the full cut.
const SCENES: { id: string; key: keyof typeof DURATIONS; Component: React.FC }[] = [
  { id: 'Scene-00-Hook', key: 'hook', Component: HookScene },
  { id: 'Scene-01-FirstVisitCardReceived', key: 'firstVisitCardReceived', Component: FirstVisitCardReceivedScene },
  { id: 'Scene-02-CardLostDisappointment', key: 'cardLostDisappointment', Component: CardLostDisappointmentScene },
  { id: 'Scene-03-DigitalShift', key: 'digitalShift', Component: DigitalShiftScene },
  { id: 'Scene-04-ScanQR', key: 'scanQR', Component: ScanQRScene },
  { id: 'Scene-05-WalletAdd', key: 'walletAdd', Component: WalletAddScene },
  { id: 'Scene-06-RealtimeTracking', key: 'realtimeTracking', Component: RealtimeTrackingScene },
  { id: 'Scene-07-DashboardIntro', key: 'dashboardIntro', Component: DashboardIntroScene },
  { id: 'Scene-08-AudienceTargeting', key: 'audienceTargeting', Component: AudienceTargetingScene },
  { id: 'Scene-09-SendTargetedCampaign', key: 'sendTargetedCampaign', Component: SendTargetedCampaignScene },
  { id: 'Scene-10-PlaybookActivate', key: 'playbookActivate', Component: PlaybookActivateScene },
  { id: 'Scene-11-Outro', key: 'outro', Component: OutroScene },
]

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LoyaltyPromo"
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      {SCENES.map(({ id, key, Component }) => (
        <Composition
          key={id}
          id={id}
          component={Component}
          durationInFrames={DURATIONS[key]}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
        />
      ))}
    </>
  )
}

import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'

import { DURATIONS, TRANSITION_FRAMES } from './theme'
import { VOICEOVER_SRC } from './data/script'

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

const transitionTiming = linearTiming({ durationInFrames: TRANSITION_FRAMES })

// Voiceover is on hold for now — flip this back to true once voiceover.mp3
// is the real narration again (and re-check DURATIONS in theme.ts, which
// were retimed for a silent/visual-only cut in the meantime).
const AUDIO_ENABLED = false

// The full ~57s "le midi au restaurant japonais" cut — 11 scenes, crossfading
// into each other. See DURATIONS/SCRIPT in theme.ts / data/script.ts for the
// story-arc breakdown (edit timing/text there, not here).
export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.firstVisitCardReceived}>
          <FirstVisitCardReceivedScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.cardLostDisappointment}>
          <CardLostDisappointmentScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.digitalShift}>
          <DigitalShiftScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.scanQR}>
          <ScanQRScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.walletAdd}>
          <WalletAddScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.realtimeTracking}>
          <RealtimeTrackingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.dashboardIntro}>
          <DashboardIntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.audienceTargeting}>
          <AudienceTargetingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.sendTargetedCampaign}>
          <SendTargetedCampaignScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.playbookActivate}>
          <PlaybookActivateScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Drop your voiceover file at public/audio/voiceover.* and update
          VOICEOVER_SRC in src/data/script.ts — ships pointing at a silent
          placeholder (scripts/generate-silence.mjs) so the timeline always
          renders out of the box. Currently disabled — see AUDIO_ENABLED above. */}
      {AUDIO_ENABLED && <Audio src={staticFile(VOICEOVER_SRC)} />}
    </AbsoluteFill>
  )
}

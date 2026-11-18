// Brand tokens mirrored from loyalty-saas/src/app/globals.css (CSS HSL custom
// properties) converted to hex, since this standalone Remotion project can't
// import the main app's Tailwind v3 config (this project runs Tailwind v4).
// Keep in sync by hand if the main app's palette changes — see that file's
// `:root` / `.dark` blocks for the source of truth.
export const colors = {
  // "Primary" — matches the Loyalty logo's "L" mark (#453ee8 sampled from
  // public/branding/loyalty-logo-horizontal.png).
  primary: '#483fe9',
  primaryDark: '#706af1',
  primaryForeground: '#ffffff',
  // "Accent" — the logo's star-badge green, used sparingly for positive highlights.
  accent: '#1bc08f',
  accentDark: '#25d09d',
  accentForeground: '#ffffff',
  background: '#ffffff',
  backgroundDark: '#090e1a',
  foreground: '#0f1729',
  foregroundDark: '#f8fafc',
  card: '#ffffff',
  cardDark: '#0e1525',
  secondary: '#f3f4f6',
  secondaryDark: '#1d283a',
  secondaryForeground: '#0f1729',
  border: '#e5e7eb',
  borderDark: '#222f44',
  mutedForeground: '#6b7280',
  mutedForegroundDark: '#94a3b8',
  destructive: '#ef4343',
  white: '#ffffff',
} as const

// 30fps throughout — standard for web/social promo cuts, smooth enough for
// UI screen-capture-style motion without the file-size cost of 60fps.
export const FPS = 30

// Scene durations in frames @30fps. Source of truth for both the timeline
// (PromoVideo.tsx) and the voiceover script timecodes (VOICEOVER_SCRIPT.md) —
// if you retime a scene, update both.
//
// v3 "le midi au restaurant japonais" story arc, SILENT CUT — audio track
// is disabled (see AUDIO_ENABLED in PromoVideo.tsx) while the voiceover is
// on hold, so these durations are not paced against speech. Each one is
// instead sized to its own animation: entrance + the beat's key action + a
// short hold just long enough to read the on-screen Caption, then cut — no
// dead air waiting on a line of narration that isn't playing. When you
// re-enable the VO, tell Claude to retime these against the real audio
// again. A few scenes have internal frame thresholds tied to their own
// total duration — check the comments in 07-DashboardIntro.tsx (nav sweep)
// if you retime that one.
export const DURATIONS = {
  firstVisitCardReceived: 140, // 0:00–0:04.7
  cardLostDisappointment: 145, // 0:04.7–0:09.5
  digitalShift: 175, // 0:09.5–0:15.3
  scanQR: 145, // 0:15.3–0:20.2
  walletAdd: 155, // 0:20.2–0:25.3
  realtimeTracking: 110, // 0:25.3–0:29.0
  dashboardIntro: 175, // 0:29.0–0:34.8
  audienceTargeting: 130, // 0:34.8–0:39.2
  sendTargetedCampaign: 215, // 0:39.2–0:46.3
  playbookActivate: 160, // 0:46.3–0:51.7
  outro: 170, // 0:51.7–0:57.3
} as const

export const TRANSITION_FRAMES = 15 // 0.5s crossfade/slide between scenes

// The scenes actually chained in PromoVideo.tsx's TransitionSeries, in
// order — NOT necessarily all of DURATIONS's keys. firstVisitCardReceived
// and cardLostDisappointment (the comptoir/ticket intro) were cut from the
// main edit so it opens straight on the Loyalty pivot, but their scene
// files/components are kept and still registered standalone in Root.tsx —
// nothing was deleted, just excluded from this cut. Add/remove a key here
// (and the matching TransitionSeries.Sequence in PromoVideo.tsx) to change
// what's actually in the rendered video.
export const MAIN_CUT: (keyof typeof DURATIONS)[] = [
  'digitalShift',
  'scanQR',
  'walletAdd',
  'realtimeTracking',
  'dashboardIntro',
  'audienceTargeting',
  'sendTargetedCampaign',
  'playbookActivate',
  'outro',
]

export const TOTAL_DURATION =
  MAIN_CUT.reduce((sum, key) => sum + DURATIONS[key], 0) - (MAIN_CUT.length - 1) * TRANSITION_FRAMES

export const VIDEO_WIDTH = 1920
export const VIDEO_HEIGHT = 1080

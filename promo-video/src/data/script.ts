import { DURATIONS } from '../theme'

// Single source of truth for the voiceover text, scene by scene — mirrors
// VOICEOVER_SCRIPT.md (the human-readable deliverable) and DURATIONS in
// theme.ts (the frame timing). scripts/generate-voiceover.mjs reads this
// file directly so the generated audio always matches what's on screen.
// Keep all three in sync if you edit one. `caption` is also what actually
// renders on screen right now (via getCaption) — AUDIO_ENABLED is false in
// PromoVideo.tsx, so these captions currently carry the whole narrative on
// their own, not just as subtitles for a VO track.
//
// Story arc (v3 — "le midi au restaurant japonais"):
//   Acte 0 — Le problème     : firstVisitCardReceived, cardLostDisappointment
//   Acte 0 → 1 — Le pivot    : digitalShift, scanQR, walletAdd
//   Acte 1 — La puissance    : realtimeTracking, dashboardIntro,
//                               audienceTargeting, sendTargetedCampaign,
//                               playbookActivate
//   Acte 2 — Conclusion      : outro
export const SCRIPT: { key: keyof typeof DURATIONS; vo: string; caption: string }[] = [
  {
    key: 'firstVisitCardReceived',
    vo: 'Midi, chez Sushi Yama. Une carte de fidélité tamponnée glisse hors d’une poche de manteau — et disparaît.',
    caption: 'Une carte tamponnée glisse hors d’une poche… et disparaît.',
  },
  {
    key: 'cardLostDisappointment',
    vo: 'La visite suivante, au comptoir : un ticket de caisse vide. Pas de carte, pas de points.',
    caption: 'La visite suivante : un ticket vide. Pas de carte, pas de points.',
  },
  {
    key: 'digitalShift',
    vo: 'Entre-temps, Sushi Yama avait adopté Loyalty : la fidélité entre enfin dans l’ère du smartphone.',
    caption: 'La fidélité entre enfin dans l’ère du smartphone.',
  },
  {
    key: 'scanQR',
    vo: 'Un scan en caisse. Cinq secondes. Zéro application à télécharger.',
    caption: 'Un scan. Cinq secondes. Zéro app.',
  },
  {
    key: 'walletAdd',
    vo: 'Sa carte s’installe dans son Wallet, et ses points tombent aussitôt — impossible à perdre, cette fois.',
    caption: 'Ses points tombent aussitôt. Impossible à perdre, cette fois.',
  },
  {
    key: 'realtimeTracking',
    vo: 'Chaque passage, chaque tampon : suivi en temps réel, côté commerçant.',
    caption: 'Chaque passage, suivi en temps réel.',
  },
  {
    key: 'dashboardIntro',
    vo: 'Fini le bout de carton muet. Place à un vrai tableau de bord : qui revient, qui décroche, qui dépense le plus.',
    caption: 'Fini le carton muet. Place à la donnée.',
  },
  {
    key: 'audienceTargeting',
    vo: 'Les habitués du midi, les amateurs de makis : une audience ciblée, bâtie sur leur historique d’achats réel.',
    caption: 'Une audience ciblée, bâtie sur l’historique d’achats.',
  },
  {
    key: 'sendTargetedCampaign',
    vo: 'Le bon message, au bon client, envoyé directement sur son écran verrouillé.',
    caption: 'Le bon message, au bon client, en un clic.',
  },
  {
    key: 'playbookActivate',
    vo: 'Un client inactif ? Un Playbook IA le relance automatiquement — zéro effort, zéro oubli.',
    caption: 'Un Playbook IA relance vos clients inactifs.',
  },
  {
    key: 'outro',
    vo: 'Loyalty. La fidélité client devient enfin un levier de croissance automatique.',
    caption: 'La fidélité devient un levier de croissance.',
  },
]

export function getCaption(key: (typeof SCRIPT)[number]['key']): string {
  return SCRIPT.find((s) => s.key === key)!.caption
}

export const VOICEOVER_SRC = 'audio/voiceover.mp3'

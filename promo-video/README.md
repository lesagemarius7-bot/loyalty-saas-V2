# Loyalty — vidéo de démo produit (Remotion)

Pipeline vidéo automatisé pour la vidéo de démo produit style YC (~58s) de
Loyalty : alternance Côté client (mockup iPhone — scan QR, Apple Wallet,
notification écran verrouillé, tampon) / Côté commerçant (dashboard réel —
navigation, activation d'un Playbook CRM, envoi de campagne).

Tous les composants visuels (carte Wallet, sidebar, cartes de playbook,
aperçu de notification, logo, palette de couleurs) sont **portés depuis
`loyalty-saas`**, pas redessinés à l'œil — voir [Composants réutilisés](#composants-réutilisés-depuis-loyalty-saas).

## Démarrer

```console
npm install
npm run dev        # ouvre Remotion Studio (aperçu + scrubbing + édition live)
```

Dans Remotion Studio, la composition `LoyaltyPromo` est le montage complet.
Chaque scène est aussi enregistrée seule (`Scene-01-FirstVisitCardReceived`,
`Scene-02-CardLostDisappointment`, … `Scene-11-Outro`) pour retoucher le
timing d'un seul beat sans faire défiler tout le montage.

## Rendre la vidéo

```console
npx remotion render LoyaltyPromo out/LoyaltyPromo.mp4
```

~52s @ 1920×1080, 30fps, **actuellement silencieuse** (`AUDIO_ENABLED = false`
dans `PromoVideo.tsx` — voir « Ajouter la voix-off »). `out/` est ignoré par git.

## Ajouter la voix-off

Le texte complet (français, découpé scène par scène avec timecodes) est dans
[`VOICEOVER_SCRIPT.md`](./VOICEOVER_SCRIPT.md). Deux options :

**1. Enregistrement humain / outil externe (Descript, ElevenLabs Studio, …)**
Déposez le fichier dans `public/audio/voiceover.mp3`, puis dans
`src/data/script.ts` :

```ts
export const VOICEOVER_SRC = 'audio/voiceover.mp3'
```

**2. Génération automatique (TTS)**

```console
ELEVENLABS_API_KEY=sk_...   node scripts/generate-voiceover.mjs   # recommandé
# ou
OPENAI_API_KEY=sk-...       node scripts/generate-voiceover.mjs
```

Écrit directement dans `public/audio/voiceover.mp3` et vous rappelle de
mettre à jour `VOICEOVER_SRC`. Sans clé API, le script affiche ces
instructions et ne modifie rien.

Le projet est livré en pointant sur un **silence généré**
(`public/audio/voiceover.wav`, via `scripts/generate-silence.mjs`) pour que
le montage se prévisualise et se rende correctement avant même d'avoir une
vraie narration. **La piste audio est désactivée** (`const AUDIO_ENABLED =
false` en haut de `PromoVideo.tsx`) pendant que la voix-off est en attente —
le montage silencieux se lit entièrement via les Captions à l'écran. Une
fois `voiceover.mp3` en place, repassez `AUDIO_ENABLED` à `true` et dites à
Claude de retimer `DURATIONS` (dans `src/theme.ts`) sur la durée réelle du
fichier.

## Structure

```
src/
  theme.ts                 # palette (portée de globals.css), timing des scènes (frames @30fps)
  data/script.ts            # texte de la voix-off, scène par scène — source de vérité avec VOICEOVER_SCRIPT.md
  PromoVideo.tsx             # montage complet : TransitionSeries + Audio
  Root.tsx                   # enregistre la composition finale + chaque scène individuellement
  font.ts                    # charge la vraie police Inter (next/font côté app → @remotion/google-fonts ici)
  scenes/                    # une scène = un beat du montage (voir VOICEOVER_SCRIPT.md pour le détail)
    01-FirstVisitCardReceived.tsx  # Acte 0 — comptoir à emporter, la carte en carton change de mains
    02-CardLostDisappointment.tsx   # Acte 0 — quelques jours plus tard, la carte a disparu
    03-DigitalShift.tsx              # Acte 0→1 — le pivot : carton → WalletCard → logo Loyalty
    04-ScanQR.tsx                     # Acte 1 — scan QR en caisse
    05-WalletAdd.tsx                   # Acte 1 — ajout à Apple Wallet, points instantanés
    06-RealtimeTracking.tsx             # Acte 1 — tampon + compteur dashboard qui se mettent à jour ensemble
    07-DashboardIntro.tsx                # Acte 1 — tableau de bord (qui revient / décroche / dépense)
    08-AudienceTargeting.tsx              # Acte 1 — segment "habitués du midi" / "amateurs de makis"
    09-SendTargetedCampaign.tsx            # Acte 1 — composer + envoi + atterrissage sur l'écran verrouillé
    10-PlaybookActivate.tsx                 # Acte 1 — activation du Playbook IA
    11-Outro.tsx                              # Acte 2 — conclusion / CTA
  components/
    ui/                      # Button/Badge/Switch/Card — portés de src/components/ui
    PhoneFrame.tsx            # chrome iPhone dessiné (dynamic island, boutons, StatusBar)
    LockScreen.tsx             # fond + horloge + bannière de notification écran verrouillé
    WalletCard.tsx              # port de LoyaltyCardVisual (style Apple Wallet) — la carte "après" (Sushi Yama)
    PaperCard.tsx                 # carte de fidélité en carton dessinée — la carte "avant"
    TakeoutCounter.tsx              # décor comptoir à emporter partagé par les scènes 01 et 02
    DashboardChrome.tsx          # sidebar (copie exacte des sections/icônes de sidebar.tsx) + chrome navigateur
    PlaybookCard.tsx              # port de dormant-customer-playbook.tsx
    NotificationComposerPreview.tsx # port du panneau d'aperçu de notification-composer.tsx — utilisé dans la scène 09
    Logo.tsx / QRCode.tsx / Caption.tsx
scripts/
  generate-silence.mjs       # régénère le silence placeholder si vous changez le timing
  generate-voiceover.mjs     # génère la vraie narration via ElevenLabs/OpenAI
public/
  brand/                     # logo-mark.png, loyalty-logo-horizontal.png — copiés depuis loyalty-saas/public
  audio/                     # voiceover.wav (placeholder) puis voiceover.mp3 (le vôtre)
```

## Composants réutilisés depuis loyalty-saas

Ce projet est un package npm à part (Remotion a besoin de Tailwind v4, l'app
principale est en v3 — pas d'import cross-package possible côté bundler),
donc les pièces suivantes sont **portées** (classes/structure identiques,
copiées à la main) plutôt qu'importées :

| Composant vidéo | Source dans `loyalty-saas/src/` |
|---|---|
| `theme.ts` (couleurs) | `app/globals.css` (tokens `--primary`, `--accent`, …, convertis HSL→hex) |
| `components/ui/*` | `components/ui/button.tsx`, `badge.tsx`, `switch.tsx`, `card.tsx` |
| `components/WalletCard.tsx` | `components/wallet/loyalty-card-visual.tsx` (variante Apple) |
| `components/DashboardChrome.tsx` (sidebar) | `components/dashboard/sidebar.tsx` (sections/icônes identiques) |
| `components/PlaybookCard.tsx` | `components/dashboard/playbooks/dormant-customer-playbook.tsx` |
| `components/NotificationComposerPreview.tsx` | `components/dashboard/notifications/notification-composer.tsx` (bloc aperçu écran verrouillé) |
| `public/brand/*.png` | `public/branding/loyalty-logo-horizontal.png`, `public/images/logo-mark.png` |

Si l'app principale change de palette, de logo ou de wording dans un de ces
composants, reportez le changement ici à la main.

## Docs Remotion

[remotion.dev/docs](https://www.remotion.dev/docs) · [Discord](https://discord.gg/6VzzNDwUwV)

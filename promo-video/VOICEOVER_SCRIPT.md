# Script voix-off — Loyalty, vidéo de démo (~52s silencieux / viser ~52-57s en VO)

**Storytelling v3 — « le midi au restaurant japonais ».** Une histoire
incarnée en 2 temps (la carte perdue, puis le déclic Loyalty) avant
d'enchaîner sur la puissance marketing côté commerçant. Ton incarné, direct,
percutant. Débit normal à légèrement soutenu (~155-165 mots/min).

**État actuel : AUDIO_ENABLED = false** dans `PromoVideo.tsx` — la vidéo
rendue est silencieuse, portée uniquement par les Captions à l'écran (le
texte `caption` ci-dessous, pas `vo`). Pour réactiver la narration : générez
`voiceover.mp3` (ci-dessous), repassez `AUDIO_ENABLED` à `true`, et dites à
Claude de remesurer l'audio et retimer `DURATIONS` dessus.

Source de vérité : `src/data/script.ts` (texte) + `src/theme.ts` (`DURATIONS`,
en frames @30fps).

## Acte 0 — Le problème (la carte perdue)

| # | Scène | Côté | Voix-off |
|---|-------|------|----------|
| 1 | La carte reçue | — | « Midi, chez Sushi Yama. Le client récupère son plat — et une carte en carton, glissée dans sa poche. » |
| 2 | La carte perdue | — | « Quelques jours plus tard, il revient. Il fouille ses poches : la carte a disparu. Pas de carte, pas de points. » |

## Acte 0 → 1 — Le pivot digital

| # | Scène | Côté | Voix-off |
|---|-------|------|----------|
| 3 | Le déclic Loyalty | — | « Entre-temps, Sushi Yama avait adopté Loyalty : la fidélité entre enfin dans l'ère du smartphone. » |
| 4 | Scan QR | Client 📱 | « Un scan en caisse. Cinq secondes. Zéro application à télécharger. » |
| 5 | Ajout Wallet | Client 📱 | « Sa carte s'installe dans son Wallet, et ses points tombent aussitôt — impossible à perdre, cette fois. » |

## Acte 1 — La puissance marketing & rétention (côté commerçant)

| # | Scène | Côté | Voix-off |
|---|-------|------|----------|
| 6 | Tracking en direct | Client + Commerçant | « Chaque passage, chaque tampon : suivi en temps réel, côté commerçant. » |
| 7 | Tableau de bord | Commerçant 💻 | « Fini le bout de carton muet. Place à un vrai tableau de bord : qui revient, qui décroche, qui dépense le plus. » |
| 8 | Ciblage d'audience | Commerçant 💻 | « Les habitués du midi, les amateurs de makis : une audience ciblée, bâtie sur leur historique d'achats réel. » |
| 9 | Envoi de la campagne | Commerçant 💻 → Client 📱 | « Le bon message, au bon client, envoyé directement sur son écran verrouillé. » |
| 10 | Playbook IA | Commerçant 💻 | « Un client inactif ? Un Playbook IA le relance automatiquement — zéro effort, zéro oubli. » |

## Acte 2 — Conclusion

| # | Scène | Côté | Voix-off |
|---|-------|------|----------|
| 11 | Outro / CTA | — | « Loyalty. La fidélité client devient enfin un levier de croissance automatique. » |

---

**Texte complet (pour enregistrement en une prise ou pour un TTS) :**

> Midi, chez Sushi Yama. Le client récupère son plat — et une carte en
> carton, glissée dans sa poche. Quelques jours plus tard, il revient. Il
> fouille ses poches : la carte a disparu. Pas de carte, pas de points.
> Entre-temps, Sushi Yama avait adopté Loyalty : la fidélité entre enfin
> dans l'ère du smartphone. Un scan en caisse. Cinq secondes. Zéro
> application à télécharger. Sa carte s'installe dans son Wallet, et ses
> points tombent aussitôt — impossible à perdre, cette fois. Chaque
> passage, chaque tampon : suivi en temps réel, côté commerçant. Fini le
> bout de carton muet. Place à un vrai tableau de bord : qui revient, qui
> décroche, qui dépense le plus. Les habitués du midi, les amateurs de
> makis : une audience ciblée, bâtie sur leur historique d'achats réel. Le
> bon message, au bon client, envoyé directement sur son écran verrouillé.
> Un client inactif ? Un Playbook IA le relance automatiquement — zéro
> effort, zéro oubli. Loyalty. La fidélité client devient enfin un levier
> de croissance automatique.

## Pour l'enregistrer

- **Voix humaine** : enregistrez le bloc ci-dessus en une prise, exportez en
  MP3, déposez le fichier dans `public/audio/voiceover.mp3`.
- **TTS automatique** : `node scripts/generate-voiceover.mjs` (clé
  `ELEVENLABS_API_KEY` ou `OPENAI_API_KEY` requise — voir le README).

Une fois le MP3 en place : repassez `AUDIO_ENABLED = true` dans
`PromoVideo.tsx`, puis dites à Claude de remesurer sa durée réelle et de
retimer `DURATIONS` (dans `src/theme.ts`) dessus — comme pour les versions
précédentes du script.

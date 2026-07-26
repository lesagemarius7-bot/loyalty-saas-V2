# Loyalty SaaS

Plateforme SaaS en marque blanche de cartes de fidélité. Les commerçants gèrent leurs
clients et campagnes de points depuis un dashboard ; les clients finaux ajoutent leur
carte à Apple Wallet / Google Wallet et se font scanner en boutique.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **Supabase** — Postgres + Auth + Storage, isolation multi-tenant via Row Level Security
- **Stripe** — abonnements commerçants (Checkout + Billing Portal + webhooks)
- **passkit-generator** — génération de `.pkpass` signés pour Apple Wallet
- **Google Wallet API** — objets de carte de fidélité via JWT signé (service account)
- **Tailwind CSS** — UI

## Structure

```
src/
  app/
    (marketing)/        landing page, pricing — public
    (auth)/              login, signup — public
    (dashboard)/          dashboard commerçant — protégé (middleware + RLS)
      dashboard/
        customers/        liste & détail clients
        scan/              scanner QR (PWA, caméra navigateur)
        campaigns/         règles du programme de fidélité
        settings/          branding (logo, couleurs), infos commerce
        billing/           abonnement Stripe
    (wallet)/             pages publiques orientées client final
      join/[merchantSlug]/  formulaire d'inscription au programme
      card/[cardId]/         vue de la carte + boutons Add to Wallet
    api/
      stripe/               checkout session, portal session
      webhooks/stripe/      événements d'abonnement
      wallet/apple/          génération .pkpass + web service PassKit (push updates)
      wallet/google/         génération du lien "Add to Google Wallet"
      points/add/            créditer des points (appelé depuis /scan)
  components/
    ui/                    primitives (button, card, input, badge)
    dashboard/, wallet/, marketing/
  lib/
    supabase/              clients browser/server + helper middleware
    stripe/                client Stripe
    wallet/                génération de passes Apple/Google
  types/                   types domaine + types générés Supabase
supabase/
  migrations/              schéma SQL versionné
  seed.sql                 données de démo
```

## Modèle de données (résumé)

- `merchants` — un commerçant = un tenant. `owner_id` référence `auth.users`.
- `staff_members` — comptes staff supplémentaires rattachés à un commerçant (rôles).
- `loyalty_programs` — règles du programme (points/€, seuil de récompense) par commerçant.
- `customers` — client final, scopé à un commerçant (un même email peut exister chez
  plusieurs commerçants, en marque blanche chaque enseigne possède sa propre base).
- `loyalty_cards` — une carte par client/programme ; `serial_number` sert de payload QR
  et d'identifiant de pass Apple/Google.
- `transactions` — historique des mouvements de points (earn/redeem/adjust).
- `apple_wallet_registrations` — appareils enregistrés pour les push updates PassKit.

Toutes les tables tenant sont protégées par RLS : un commerçant ne peut lire/écrire que
les lignes où `merchant_id` pointe vers un `merchants.owner_id = auth.uid()`.

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # renseigner Supabase, Stripe, Apple, Google
npx supabase init                  # si pas déjà fait
npx supabase start                 # Postgres local
npm run supabase:migrate           # applique supabase/migrations
npm run supabase:types             # génère src/types/database.types.ts
npm run dev
```

### Stripe

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Apple Wallet

Voir `certificates/README.md` pour générer les certificats et les encoder en base64
dans `.env.local`. Le Pass Type ID est partagé entre tous les commerçants (marque
blanche) — la distinction se fait via `serial_number` et les champs personnalisés
(logo, couleurs) injectés depuis `merchants` à la génération du pass.

### Google Wallet

Créer un compte de service dans la Google Wallet Business Console, l'associer à
`GOOGLE_WALLET_ISSUER_ID`, et encoder sa clé privée en base64 dans
`GOOGLE_WALLET_PRIVATE_KEY_BASE64`.

## Prochaines étapes suggérées

- Générer les types Supabase réels (`npm run supabase:types`) et les brancher partout
  où `src/types/index.ts` sert de stub temporaire.
- Implémenter le push APNs dans `lib/wallet/apple-pass.ts::pushPassUpdate` (aujourd'hui
  un stub) pour rafraîchir les passes déjà installés après un ajout de points.
- Ajouter des tests (Vitest + Testing Library) sur les routes API sensibles
  (points/add, webhooks Stripe).
- Brancher un rate-limiter (ex. Upstash) sur `/api/points/add` et le scanner.

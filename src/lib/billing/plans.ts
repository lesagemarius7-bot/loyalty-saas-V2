export type PlanId = 'essentiel' | 'performance_ia'

export interface PlanDefinition {
  id: PlanId
  label: string
  price: number
  recommended: boolean
  tagline: string
  features: string[]
}

// Single source of truth for the 2 commercial offers — shared by the
// dashboard's PlanSelector (/dashboard/billing, choosing the post-POC plan)
// and the public marketing pages (landing page + /pricing), so the pitch
// shown to a prospect can never drift from what an existing merchant sees.
export const PLANS: PlanDefinition[] = [
  {
    id: 'essentiel',
    label: 'Essentiel Wallet',
    price: 49,
    recommended: false,
    tagline: 'Remplacez la carte papier par une carte digitale élégante.',
    features: [
      '📱 Carte Apple Wallet & Google Wallet illimitée (100% marque blanche)',
      '☕ Icônes de tampons personnalisés & verso enrichi (avis Google, horaires, réseaux)',
      '📢 Communications manuelles illimitées (plat du jour, offres flash, nouveautés)',
      '📊 Tableau de bord d’activité de base',
      '📲 QR code comptoir & chevalet à imprimer',
    ],
  },
  {
    id: 'performance_ia',
    label: 'Performance & CRM IA',
    price: 89,
    recommended: true,
    tagline: 'Automatisez votre chiffre d’affaires et votre rétention client.',
    features: [
      '⭐ Tout ce qui est inclus dans l’offre Essentiel Wallet',
      '🤖 Copilote Marketing IA autonome : relance anti-churn, détection météo, ciblage selon l’historique d’achat',
      '⚡ Playbooks CRM 1-clic : relance clients dormants & boost jours creux',
      '📍 Geofencing GPS : notification automatique à proximité du magasin',
      '💰 Indicateurs ROI & CA stimulé estimé',
    ],
  },
]

// Standardized on 1 month — was 60 (2 months) here while the DB default
// was also 60 but the signup page's own copy said "14 jours", none of
// which agreed with each other. Migration 0018 changes the DB default to
// match.
export const POC_DURATION_DAYS = 30

export const NOTIFICATION_VARIABLES: { tag: string; label: string }[] = [
  { tag: '{{first_name}}', label: '+ Prénom' },
  { tag: '{{last_name}}', label: '+ Nom' },
  { tag: '{{last_purchased_category}}', label: '+ Dernière catégorie' },
  { tag: '{{last_transaction_at}}', label: '+ Date dernier achat' },
  { tag: '{{current_stamps}}', label: '+ Tampons actuels' },
  { tag: '{{business_name}}', label: '+ Nom du commerce' },
]

export interface SystemTemplate {
  id: string
  name: string
  titleTemplate: string
  bodyTemplate: string
}

// Ids match the ?template= deep link from the dashboard's "Animation Flash"
// quick action (see /dashboard/page.tsx) — the first 3 entries are that
// original quick-select set, now folded into the same template system
// instead of living as a separate parallel list.
export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  { id: 'plat-du-jour', name: 'Plat du jour 🍽️', titleTemplate: '', bodyTemplate: '🍽️ Plat du jour : ' },
  { id: 'offre-flash', name: 'Offre Flash ⚡', titleTemplate: '', bodyTemplate: '⚡ Offre flash : ' },
  { id: 'information', name: 'Information 📢', titleTemplate: '', bodyTemplate: '📢 Information : ' },
  {
    id: 'relance-produit',
    name: 'Relance Produit',
    titleTemplate: 'On pense à vous ! 👋',
    bodyTemplate: 'Bonjour {{first_name}}, ça fait un moment — revenez découvrir nos nouveautés en {{last_purchased_category}} !',
  },
  {
    id: 'offre-anniversaire',
    name: 'Offre Anniversaire',
    titleTemplate: 'Joyeux anniversaire 🎂',
    bodyTemplate: 'Bonjour {{first_name}}, {{business_name}} vous offre un cadeau pour votre anniversaire !',
  },
  {
    id: 'nouveaute-categorie',
    name: 'Nouveauté Catégorie',
    titleTemplate: 'Nouveautés ✨',
    bodyTemplate: 'Bonjour {{first_name}}, découvrez nos nouveautés en {{favorite_category}} chez {{business_name}} !',
  },
  {
    id: 'tampon-offert',
    name: 'Rappel Tampon Bonus',
    titleTemplate: 'Un tampon offert 🎁',
    bodyTemplate: 'Bonjour {{first_name}}, vous avez {{current_stamps}} tampons — plus qu’un effort pour votre récompense !',
  },
]

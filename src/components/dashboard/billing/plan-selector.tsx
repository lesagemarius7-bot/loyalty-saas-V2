'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    id: 'essentiel' as const,
    label: 'Essentiel Wallet',
    price: '49 €',
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
    id: 'performance_ia' as const,
    label: 'Performance & CRM IA',
    price: '89 €',
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

export function PlanSelector({ merchantId, currentPlan }: { merchantId: string; currentPlan: 'essentiel' | 'performance_ia' }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSelect(planId: 'essentiel' | 'performance_ia') {
    if (planId === currentPlan) return
    setSaving(planId)
    const supabase = createClient()
    await supabase.from('merchants').update({ subscription_plan: planId }).eq('id', merchantId)
    setSaving(null)
    router.refresh()
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlan
        return (
          <Card key={plan.id} className={cn(plan.recommended && 'border-primary')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{plan.label}</CardTitle>
                {plan.recommended && <Badge variant="accent">Recommandé</Badge>}
                {isCurrent && <Badge variant="success">Sélectionné</Badge>}
              </div>
              <p className="text-2xl font-bold">
                {plan.price} <span className="text-sm font-normal text-muted-foreground">/ mois</span>
              </p>
              <CardDescription>{plan.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'secondary' : 'default'}
                disabled={isCurrent || saving !== null}
                onClick={() => handleSelect(plan.id)}
                className="w-full"
              >
                {saving === plan.id ? 'Enregistrement…' : isCurrent ? 'Formule actuelle' : 'Choisir cette formule'}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

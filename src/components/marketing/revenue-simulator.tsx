'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PLANS } from '@/lib/billing/plans'

// Loyalty-program industry benchmarks vary a lot by source and trade, so
// this uses one clearly-labeled, conservative assumption (+15% of visit
// frequency from engaged loyalty members) rather than a per-industry
// "scientific" figure we can't actually back up — the point is to give a
// prospect a believable order of magnitude, not a number dressed up as a
// measurement. Said as "estimation" everywhere it's shown.
const ENGAGEMENT_UPLIFT = 0.15

const performancePlan = PLANS.find((p) => p.id === 'performance_ia') ?? PLANS[PLANS.length - 1]

function formatEuro(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value))
}

export function RevenueSimulator({
  defaultTicket,
  defaultVisits,
}: {
  defaultTicket: number
  defaultVisits: number
}) {
  const [clients, setClients] = useState(150)
  const [ticket, setTicket] = useState(defaultTicket)
  const [visits, setVisits] = useState(defaultVisits)

  const baseMonthlyRevenue = clients * ticket * visits
  const additionalMonthlyRevenue = baseMonthlyRevenue * ENGAGEMENT_UPLIFT
  const additionalAnnualRevenue = additionalMonthlyRevenue * 12
  const monthsOfSubscriptionCovered = performancePlan ? additionalMonthlyRevenue / performancePlan.price : 0

  return (
    <Card>
      <CardContent className="grid gap-8 p-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Combien Loyalty peut rapporter à votre activité ?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajustez les chiffres à votre réalité — les valeurs par défaut sont des moyennes observées sur ce type de
              commerce.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sim-clients">
              Clients fidèles actifs
            </label>
            <Input
              id="sim-clients"
              type="number"
              min={0}
              value={clients}
              onChange={(e) => setClients(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sim-ticket">
              Panier moyen (€)
            </label>
            <Input
              id="sim-ticket"
              type="number"
              min={0}
              step={0.5}
              value={ticket}
              onChange={(e) => setTicket(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sim-visits">
              Visites moyennes par mois et par client
            </label>
            <Input
              id="sim-visits"
              type="number"
              min={0}
              step={0.5}
              value={visits}
              onChange={(e) => setVisits(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl bg-secondary/60 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chiffre d’affaires additionnel estimé
          </p>
          <p className="mt-2 text-4xl font-bold text-primary">+{formatEuro(additionalMonthlyRevenue)} €</p>
          <p className="text-sm text-muted-foreground">par mois</p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-left">
            <div>
              <p className="text-xs text-muted-foreground">Sur un an</p>
              <p className="text-lg font-semibold">+{formatEuro(additionalAnnualRevenue)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Abonnement couvert</p>
              <p className="text-lg font-semibold">{monthsOfSubscriptionCovered.toFixed(1)}x</p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Estimation basée sur une hypothèse de +{Math.round(ENGAGEMENT_UPLIFT * 100)}% de visites pour les clients
            engagés dans le programme de fidélité — un ordre de grandeur indicatif, pas une garantie contractuelle.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

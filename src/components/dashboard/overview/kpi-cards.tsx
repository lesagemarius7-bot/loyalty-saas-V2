import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import type { DashboardOverview } from '@/lib/analytics/dashboard-overview'

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>
  const positive = pct >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-destructive'}`}>
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}
      {pct}% ce mois-ci
    </span>
  )
}

export function KpiCards({ kpis }: { kpis: DashboardOverview['kpis'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>👥 Cartes Wallet Actives</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{kpis.activeWalletPasses.value}</p>
          <div className="mt-1">
            <Trend pct={kpis.activeWalletPasses.trendPct} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>☕ Tampons Distribués (Mois)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{kpis.stampsThisMonth.value}</p>
          <div className="mt-1">
            <Trend pct={kpis.stampsThisMonth.trendPct} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>🎁 Récompenses Débloquées</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{kpis.rewardsRedeemedThisMonth.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {kpis.rewardsRedeemedThisMonth.retentionRatePct !== null
              ? `${kpis.rewardsRedeemedThisMonth.retentionRatePct}% des clients reviennent ≥2 fois/mois`
              : 'Pas encore assez de données'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>💰 CA Stimulé (Estimé)</CardDescription>
        </CardHeader>
        <CardContent>
          {kpis.estimatedRevenue.avgBasketConfigured ? (
            <p className="text-3xl font-bold">{kpis.estimatedRevenue.value} €</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-muted-foreground">Non configuré</p>
              <Link href="/dashboard/settings" className="mt-1 block text-xs text-primary underline">
                Configurez votre panier moyen
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

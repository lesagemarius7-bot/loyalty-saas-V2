import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeAdminFinance } from '@/lib/analytics/admin-finance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PLAN_LABELS: Record<string, string> = {
  essentiel: 'Essentiel Wallet',
  performance_ia: 'Performance & CRM IA',
}

export default async function AdminFinancePage() {
  const service = createServiceRoleClient()
  const finance = await computeAdminFinance(service)

  const maxMrr = Math.max(finance.currentMrr, ...finance.projection.map((p) => p.mrr), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Finance</h1>
        <p className="text-slate-400">MRR, ARR et projection à venir en fonction des abonnements actifs et des POC en cours.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>💰 MRR actuel</CardDescription>
            <CardTitle className="text-3xl">{finance.currentMrr} €</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {finance.activeSubscriptions} abonnement(s) payant(s) actif(s)
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>📈 ARR actuel</CardDescription>
            <CardTitle className="text-3xl">{finance.currentArr} €</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">MRR actuel × 12</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🧪 POC en cours</CardDescription>
            <CardTitle className="text-3xl">{finance.pocInProgress}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pas encore comptabilisés dans le MRR
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🎯 MRR potentiel (POC)</CardDescription>
            <CardTitle className="text-3xl">+{finance.pocPotentialMrr} €</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Si tous les POC actuels convertissent à leur plan choisi
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projection MRR — 6 prochains mois</CardTitle>
          <CardDescription>
            Hypothèse : les abonnements actifs se maintiennent, et chaque commerçant en POC convertit à la fin de
            son essai (date de début + durée du POC), au tarif du plan qu’il a choisi. Aucune croissance ou perte de
            client future n’est inventée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 pt-2" style={{ height: 180 }}>
            {finance.projection.map((month) => (
              <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-white">{month.mrr} €</span>
                <div
                  className="w-full rounded-t-md bg-[#706af1]"
                  style={{ height: Math.max(4, Math.round((month.mrr / maxMrr) * 130)) }}
                  title={`${month.label} : ${month.mrr} €`}
                />
                <span className="text-center text-xs capitalize text-slate-400">{month.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversions POC attendues</CardTitle>
          <CardDescription>Détail des commerçants en essai et de leur bascule prévue en abonnement payant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {finance.projection.every((m) => m.newlyConverted.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              {finance.pocInProgress === 0
                ? 'Aucun commerçant en POC actuellement.'
                : 'Aucune conversion prévue dans les 6 prochains mois.'}
            </p>
          ) : (
            finance.projection
              .filter((m) => m.newlyConverted.length > 0)
              .map((m) => (
                <div key={m.month} className="border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0">
                  <p className="font-medium capitalize text-white">{m.label}</p>
                  {m.newlyConverted.map((c) => (
                    <p key={c.businessName} className="text-slate-400">
                      {c.businessName} — {PLAN_LABELS[c.plan] ?? c.plan} · +{c.amount} €/mois
                    </p>
                  ))}
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

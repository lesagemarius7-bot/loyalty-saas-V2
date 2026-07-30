import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeAdminFinance, computePocHealth, computeDunningData } from '@/lib/analytics/admin-finance'
import { AdminCard, AdminCardContent, AdminCardDescription, AdminCardHeader, AdminCardTitle } from '@/components/admin/admin-card'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { DunningTable } from '@/components/admin/dunning-table'
import { PocHealthTable } from '@/components/admin/poc-health-table'
import { FinanceExportForm } from '@/components/admin/finance-export-form'

const PLAN_LABELS: Record<string, string> = {
  essentiel: 'Essentiel Wallet',
  performance_ia: 'Performance & CRM IA',
}

export default async function AdminFinancePage() {
  const service = createServiceRoleClient()
  const [finance, pocHealth, dunning] = await Promise.all([
    computeAdminFinance(service),
    computePocHealth(service),
    computeDunningData(service),
  ])

  const maxMrr = Math.max(finance.currentMrr, ...finance.projection.map((p) => p.mrr), 1)
  const { unitEconomics: ue, grossMargin: gm } = finance

  const dunningAlertCount = dunning.failedPayments.length + dunning.cardsExpiringSoon.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Finance</h1>
        <p className="text-slate-400">
          Pilotage financier, unit economics, recouvrement et exports comptables de la plateforme Loyalty.
        </p>
      </div>

      <AdminTabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Vue d’ensemble & Projections',
            content: (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>💰 MRR actuel</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{finance.currentMrr} €</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">
                      {finance.activeSubscriptions} abonnement(s) payant(s) actif(s)
                    </AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>📈 ARR actuel</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{finance.currentArr} €</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">MRR actuel × 12</AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>👤 ARPU</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{ue.arpu} €</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">Panier moyen / commerçant payant</AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>💎 LTV estimée</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{ue.ltvEstimateEur !== null ? `${ue.ltvEstimateEur} €` : '—'}</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">
                      {ue.ltvEstimateEur !== null ? 'ARPU ÷ taux de churn logo' : 'Non calculable — pas de churn ce mois-ci'}
                    </AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>📉 Churn logo (ce mois)</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{ue.logoChurnRatePct !== null ? `${ue.logoChurnRatePct}%` : '—'}</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">
                      {ue.hasHistoricalData ? 'Basé sur les résiliations réelles enregistrées' : 'Aucun historique avant ce mois-ci'}
                    </AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>💸 Churn revenu (ce mois)</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{ue.revenueChurnEurThisMonth} €</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">MRR perdu sur résiliations réelles</AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>🚀 Expansion MRR (ce mois)</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">+{ue.expansionMrrThisMonth} €</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">Montées en gamme Essentiel → Performance IA</AdminCardContent>
                  </AdminCard>

                  <AdminCard>
                    <AdminCardHeader className="pb-2">
                      <AdminCardDescription>⚖️ Marge brute globale</AdminCardDescription>
                      <AdminCardTitle className="text-3xl">{gm.grossMarginPct !== null ? `${gm.grossMarginPct}%` : '—'}</AdminCardTitle>
                    </AdminCardHeader>
                    <AdminCardContent className="text-xs text-slate-400">
                      Coûts infra estimés : {gm.estimatedCogsEur} € (dont {gm.pushSentThisMonth} notifications push)
                    </AdminCardContent>
                  </AdminCard>
                </div>

                {!ue.hasHistoricalData && (
                  <p className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-slate-400">
                    ℹ️ Le churn et l’expansion MRR se basent sur un journal d’événements réel qui vient d’être mis en
                    place — ces indicateurs se rempliront au fil des changements de statut/plan à venir, pas de
                    donnée historique reconstituée artificiellement.
                  </p>
                )}

                <AdminCard>
                  <AdminCardHeader>
                    <AdminCardTitle className="text-base">Projection MRR — 6 prochains mois</AdminCardTitle>
                    <AdminCardDescription>
                      Hypothèse : les abonnements actifs se maintiennent, et chaque commerçant en POC convertit à la
                      fin de son essai (date de début + durée du POC), au tarif du plan qu’il a choisi. Aucune
                      croissance ou perte de client future n’est inventée.
                    </AdminCardDescription>
                  </AdminCardHeader>
                  <AdminCardContent>
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
                  </AdminCardContent>
                </AdminCard>

                <AdminCard>
                  <AdminCardHeader>
                    <AdminCardTitle className="text-base">Conversions POC attendues</AdminCardTitle>
                    <AdminCardDescription>Détail des commerçants en essai et de leur bascule prévue en abonnement payant.</AdminCardDescription>
                  </AdminCardHeader>
                  <AdminCardContent className="space-y-2">
                    {finance.projection.every((m) => m.newlyConverted.length === 0) ? (
                      <p className="text-sm text-slate-400">
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
                  </AdminCardContent>
                </AdminCard>
              </div>
            ),
          },
          {
            id: 'dunning',
            label: `🛡️ Recouvrement & Impayés${dunningAlertCount > 0 ? ` (${dunningAlertCount})` : ''}`,
            content: (
              <DunningTable
                failedPayments={dunning.failedPayments}
                cardsExpiringSoon={dunning.cardsExpiringSoon}
                stripeReachable={dunning.stripeReachable}
              />
            ),
          },
          {
            id: 'poc',
            label: `🔮 Maturité des POCs (${pocHealth.length})`,
            content: <PocHealthTable entries={pocHealth} />,
          },
          {
            id: 'exports',
            label: '📄 Exports Comptables',
            content: <FinanceExportForm />,
          },
        ]}
      />
    </div>
  )
}

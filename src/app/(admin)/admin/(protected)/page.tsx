import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeAdminOverview } from '@/lib/analytics/admin-overview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const BILLING_STATUS_LABELS: Record<string, string> = {
  poc_active: 'Essai (POC)',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
}

export default async function AdminOverviewPage() {
  const service = createServiceRoleClient()
  const overview = await computeAdminOverview(service)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Vue d’ensemble</h1>
        <p className="text-slate-400">Activité globale de la plateforme Loyalty, tous commerçants confondus.</p>
      </div>

      {overview.merchants.pendingRequests > 0 && (
        <Link
          href="/admin/merchants"
          className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-6 py-4 hover:bg-primary/10"
        >
          <span className="text-sm font-medium">
            📋 {overview.merchants.pendingRequests} demande(s) d’accès en attente de validation
          </span>
          <span className="text-sm font-medium text-primary">Examiner →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🏬 Commerçants inscrits</CardDescription>
            <CardTitle className="text-3xl">{overview.merchants.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overview.merchants.active} actif(s) · {overview.merchants.pocActive} en essai ·{' '}
            {overview.merchants.suspended} suspendu(s) · {overview.merchants.pendingRequests} en attente
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>📲 Cartes Wallet en circulation</CardDescription>
            <CardTitle className="text-3xl">{overview.walletPasses.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Apple + Google Wallet, tous commerçants</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>⚡ Notifications push (ce mois)</CardDescription>
            <CardTitle className="text-3xl">{overview.deliverability.pushAttempted}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overview.deliverability.pushSuccessRatePct !== null
              ? `${overview.deliverability.pushSuccessRatePct}% de succès`
              : 'Aucun envoi enregistré'}
            {' · '}e-mails : non journalisé
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>💰 MRR projeté</CardDescription>
            <CardTitle className="text-3xl">{overview.revenue.projectedMrr} €</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Basé sur le plan de chaque commerçant — pas un chiffre Stripe réel
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement ce mois-ci</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-8 text-sm">
          <p>
            <span className="text-2xl font-semibold">{overview.engagement.stampsThisMonth}</span>{' '}
            <span className="text-muted-foreground">tampons distribués</span>
          </p>
          <p>
            <span className="text-2xl font-semibold">{overview.engagement.rewardsThisMonth}</span>{' '}
            <span className="text-muted-foreground">récompenses converties</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières inscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview.recentSignups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun commerçant pour le moment.</p>
          ) : (
            overview.recentSignups.map((m) => (
              <Link
                key={m.id}
                href={`/admin/merchants/${m.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                <span className="font-medium">{m.businessName}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                  <Badge variant={m.billingStatus === 'active' ? 'success' : 'secondary'}>
                    {BILLING_STATUS_LABELS[m.billingStatus] ?? m.billingStatus}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

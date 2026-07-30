import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeDashboardOverview } from '@/lib/analytics/dashboard-overview'
import { stripe } from '@/lib/stripe/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MerchantAdminActions } from '@/components/admin/merchant-admin-actions'
import type { Merchant } from '@/types'

// Real Stripe invoices only, no reconstruction from subscription_plan —
// gracefully empty (not an error page) whenever there's no Stripe customer
// yet, or Stripe itself is unreachable (e.g. production's current
// placeholder billing key).
async function fetchRecentInvoices(stripeCustomerId: string | null) {
  if (!stripeCustomerId) return []
  try {
    const invoices = await stripe.invoices.list({ customer: stripeCustomerId, limit: 12 })
    return invoices.data
  } catch (err) {
    console.error('[admin/merchants/:id] failed to fetch Stripe invoices', err)
    return []
  }
}

const BILLING_STATUS_LABELS: Record<string, string> = {
  poc_active: 'Essai (POC)',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Suspendu / résilié',
}

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente de validation',
  approved: 'Approuvé',
  rejected: 'Refusé',
}

export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params
  const service = createServiceRoleClient()

  const { data: merchant } = await service.from('merchants').select('*').eq('id', merchantId).single<Merchant>()
  if (!merchant) notFound()

  const {
    data: { user: owner },
  } = await service.auth.admin.getUserById(merchant.owner_id)

  // Reuses the exact same per-merchant analytics the merchant sees on their
  // own /dashboard — an admin inspecting a merchant should see the identical
  // numbers, not a parallel/approximate computation.
  const overview = await computeDashboardOverview(service, merchant, 30)
  const invoices = await fetchRecentInvoices(merchant.stripe_customer_id)

  const { data: campaigns } = await service
    .from('notification_campaigns')
    .select('id, message, type, recipient_count, created_at, target_summary')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{merchant.business_name}</h1>
        <p className="text-slate-400">
          {owner?.email ?? 'e-mail inconnu'} · Inscrit le {new Date(merchant.created_at).toLocaleDateString('fr-FR')}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {merchant.approval_status !== 'approved' && (
            <Badge variant={merchant.approval_status === 'rejected' ? 'destructive' : 'secondary'}>
              {APPROVAL_STATUS_LABELS[merchant.approval_status] ?? merchant.approval_status}
            </Badge>
          )}
          <Badge variant={merchant.billing_status === 'active' ? 'success' : 'secondary'}>
            {BILLING_STATUS_LABELS[merchant.billing_status] ?? merchant.billing_status}
          </Badge>
          <Badge variant="outline">{merchant.subscription_plan}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cartes Wallet actives</CardDescription>
                <CardTitle className="text-3xl">{overview.kpis.activeWalletPasses.value}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tampons distribués (ce mois)</CardDescription>
                <CardTitle className="text-3xl">{overview.kpis.stampsThisMonth.value}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Récompenses converties (ce mois)</CardDescription>
                <CardTitle className="text-3xl">{overview.kpis.rewardsRedeemedThisMonth.value}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Taux de rétention</CardDescription>
                <CardTitle className="text-3xl">
                  {overview.kpis.rewardsRedeemedThisMonth.retentionRatePct ?? '—'}
                  {overview.kpis.rewardsRedeemedThisMonth.retentionRatePct !== null && '%'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des campagnes & envois</CardTitle>
              <CardDescription>Notifications manuelles, ciblées, et envois automatiques post-paiement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!campaigns || campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune campagne envoyée pour le moment.</p>
              ) : (
                campaigns.map((c) => (
                  <div key={c.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.target_summary ?? (c.type === 'manual' ? 'Diffusion générale' : 'Ciblée')}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{c.message}</p>
                    <p className="text-xs text-muted-foreground">{c.recipient_count} destinataire(s)</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Factures</CardTitle>
              <CardDescription>Duplicatas Stripe réels — visibles une fois la facturation réelle activée pour ce commerçant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!merchant.stripe_customer_id ? (
                <p className="text-sm text-muted-foreground">Pas encore de compte Stripe (facturation manuelle / POC).</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture trouvée pour ce commerçant.</p>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{invoice.number ?? invoice.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date((invoice.created ?? 0) * 1000).toLocaleDateString('fr-FR')} · {((invoice.total ?? 0) / 100).toFixed(2)} €
                      </p>
                    </div>
                    {invoice.hosted_invoice_url && (
                      <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline">
                        Voir le PDF
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <MerchantAdminActions merchant={merchant} />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeDashboardOverview } from '@/lib/analytics/dashboard-overview'
import { stripe } from '@/lib/stripe/client'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle, AdminCardDescription } from '@/components/admin/admin-card'
import { AdminBadge } from '@/components/admin/admin-badge'
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

const BILLING_STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'destructive'> = {
  poc_active: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'destructive',
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
        <Link
          href="/admin/merchants"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux commerçants
        </Link>
        <h1 className="text-2xl font-semibold text-white">{merchant.business_name}</h1>
        <p className="text-slate-400">
          {owner?.email ?? 'e-mail inconnu'} · Inscrit le {new Date(merchant.created_at).toLocaleDateString('fr-FR')}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {merchant.approval_status !== 'approved' && (
            <AdminBadge variant={merchant.approval_status === 'rejected' ? 'destructive' : 'warning'}>
              {APPROVAL_STATUS_LABELS[merchant.approval_status] ?? merchant.approval_status}
            </AdminBadge>
          )}
          <AdminBadge variant={BILLING_STATUS_VARIANT[merchant.billing_status] ?? 'secondary'}>
            {BILLING_STATUS_LABELS[merchant.billing_status] ?? merchant.billing_status}
          </AdminBadge>
          <AdminBadge variant="outline">{merchant.subscription_plan}</AdminBadge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminCard>
              <AdminCardHeader className="pb-2">
                <AdminCardDescription>Cartes Wallet actives</AdminCardDescription>
                <AdminCardTitle className="text-3xl">{overview.kpis.activeWalletPasses.value}</AdminCardTitle>
              </AdminCardHeader>
            </AdminCard>
            <AdminCard>
              <AdminCardHeader className="pb-2">
                <AdminCardDescription>Tampons distribués (ce mois)</AdminCardDescription>
                <AdminCardTitle className="text-3xl">{overview.kpis.stampsThisMonth.value}</AdminCardTitle>
              </AdminCardHeader>
            </AdminCard>
            <AdminCard>
              <AdminCardHeader className="pb-2">
                <AdminCardDescription>Récompenses converties (ce mois)</AdminCardDescription>
                <AdminCardTitle className="text-3xl">{overview.kpis.rewardsRedeemedThisMonth.value}</AdminCardTitle>
              </AdminCardHeader>
            </AdminCard>
            <AdminCard>
              <AdminCardHeader className="pb-2">
                <AdminCardDescription>Taux de rétention</AdminCardDescription>
                <AdminCardTitle className="text-3xl">
                  {overview.kpis.rewardsRedeemedThisMonth.retentionRatePct ?? '—'}
                  {overview.kpis.rewardsRedeemedThisMonth.retentionRatePct !== null && '%'}
                </AdminCardTitle>
              </AdminCardHeader>
            </AdminCard>
          </div>

          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle className="text-base">Historique des campagnes & envois</AdminCardTitle>
              <AdminCardDescription>Notifications manuelles, ciblées, et envois automatiques post-paiement.</AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-2">
              {!campaigns || campaigns.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune campagne envoyée pour le moment.</p>
              ) : (
                campaigns.map((c) => (
                  <div key={c.id} className="border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-100">
                        {c.target_summary ?? (c.type === 'manual' ? 'Diffusion générale' : 'Ciblée')}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-slate-400">{c.message}</p>
                    <p className="text-xs text-slate-500">{c.recipient_count} destinataire(s)</p>
                  </div>
                ))
              )}
            </AdminCardContent>
          </AdminCard>

          <AdminCard accent="green">
            <AdminCardHeader>
              <AdminCardTitle className="text-base">Factures</AdminCardTitle>
              <AdminCardDescription>
                Duplicatas Stripe réels — visibles une fois la facturation réelle activée pour ce commerçant.
              </AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-2">
              {!merchant.stripe_customer_id ? (
                <p className="text-sm text-slate-400">Pas encore de compte Stripe (facturation manuelle / POC).</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune facture trouvée pour ce commerçant.</p>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{invoice.number ?? invoice.id}</p>
                      <p className="text-xs text-slate-400">
                        {new Date((invoice.created ?? 0) * 1000).toLocaleDateString('fr-FR')} ·{' '}
                        {((invoice.total ?? 0) / 100).toFixed(2)} €
                      </p>
                    </div>
                    {invoice.hosted_invoice_url && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[#706af1] underline"
                      >
                        Voir le PDF
                      </a>
                    )}
                  </div>
                ))
              )}
            </AdminCardContent>
          </AdminCard>
        </div>

        <MerchantAdminActions merchant={merchant} />
      </div>
    </div>
  )
}

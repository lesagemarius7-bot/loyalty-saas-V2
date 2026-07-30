import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeAdminOverview } from '@/lib/analytics/admin-overview'
import { AdminCard, AdminCardContent, AdminCardDescription, AdminCardHeader, AdminCardTitle } from '@/components/admin/admin-card'
import { AdminBadge } from '@/components/admin/admin-badge'
import { cn } from '@/lib/utils'

const BILLING_STATUS_LABELS: Record<string, string> = {
  poc_active: 'Essai (POC)',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
}

const BILLING_STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'destructive'> = {
  poc_active: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'destructive',
}

// Matches BILLING_STATUS_VARIANT's semantics one-for-one — a colored left
// edge per row so the list scans at a glance (which signups need attention)
// without having to read every badge individually.
const BILLING_STATUS_EDGE: Record<string, string> = {
  poc_active: 'border-l-[#706af1]',
  active: 'border-l-emerald-500',
  past_due: 'border-l-amber-500',
  canceled: 'border-l-red-500',
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
          className="flex items-center justify-between rounded-xl border border-[#706af1]/40 bg-[#453ee8]/10 px-6 py-4 hover:bg-[#453ee8]/15"
        >
          <span className="text-sm font-medium text-slate-100">
            📋 {overview.merchants.pendingRequests} demande(s) d’accès en attente de validation
          </span>
          <span className="text-sm font-medium text-[#a5a0f5]">Examiner →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>🏬 Commerçants inscrits</AdminCardDescription>
            <AdminCardTitle className="text-3xl">{overview.merchants.total}</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="text-xs text-slate-400">
            {overview.merchants.active} actif(s) · {overview.merchants.pocActive} en essai ·{' '}
            {overview.merchants.suspended} suspendu(s) · {overview.merchants.pendingRequests} en attente
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>📲 Cartes Wallet en circulation</AdminCardDescription>
            <AdminCardTitle className="text-3xl">{overview.walletPasses.total}</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="text-xs text-slate-400">Apple + Google Wallet, tous commerçants</AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>⚡ Notifications push (ce mois)</AdminCardDescription>
            <AdminCardTitle className="text-3xl">{overview.deliverability.pushAttempted}</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="text-xs text-slate-400">
            {overview.deliverability.pushSuccessRatePct !== null
              ? `${overview.deliverability.pushSuccessRatePct}% de succès`
              : 'Aucun envoi enregistré'}
            {' · '}e-mails : non journalisé
          </AdminCardContent>
        </AdminCard>

        <AdminCard accent="green">
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>💰 MRR projeté</AdminCardDescription>
            <AdminCardTitle className="text-3xl">{overview.revenue.projectedMrr} €</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="text-xs text-slate-400">
            Basé sur le plan de chaque commerçant — pas un chiffre Stripe réel
          </AdminCardContent>
        </AdminCard>
      </div>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="text-base">Engagement ce mois-ci</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="flex gap-8 text-sm">
          <p>
            <span className="text-2xl font-semibold text-white">{overview.engagement.stampsThisMonth}</span>{' '}
            <span className="text-slate-400">tampons distribués</span>
          </p>
          <p>
            <span className="text-2xl font-semibold text-white">{overview.engagement.rewardsThisMonth}</span>{' '}
            <span className="text-slate-400">récompenses converties</span>
          </p>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="text-base">Dernières inscriptions</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="space-y-2">
          {overview.recentSignups.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun commerçant pour le moment.</p>
          ) : (
            overview.recentSignups.map((m) => (
              <Link
                key={m.id}
                href={`/admin/merchants/${m.id}`}
                className={cn(
                  'flex items-center justify-between rounded-md border border-l-4 border-slate-800 px-3 py-2 text-sm hover:bg-slate-800/50',
                  BILLING_STATUS_EDGE[m.billingStatus] ?? 'border-l-slate-600'
                )}
              >
                <span className="font-medium text-slate-100">{m.businessName}</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                  <AdminBadge variant={BILLING_STATUS_VARIANT[m.billingStatus] ?? 'secondary'}>
                    {BILLING_STATUS_LABELS[m.billingStatus] ?? m.billingStatus}
                  </AdminBadge>
                </div>
              </Link>
            ))
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}

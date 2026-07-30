'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminCard, AdminCardContent, ADMIN_OUTLINE_BUTTON } from '@/components/admin/admin-card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { AdminMerchantSummary } from '@/lib/analytics/admin-merchants-list'

type FilterKey = 'all' | 'this_week' | 'poc_expiring' | 'inactive'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'this_week', label: 'Inscrits cette semaine' },
  { key: 'poc_expiring', label: 'POC expirant bientôt (< 10j)' },
  { key: 'inactive', label: 'Inactifs (> 14j)' },
]

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
}

// Low-opacity saturated bg + light-toned text of the same hue — reads well
// on the dark admin shell, unlike the light bg-X-100/text-X-800 pairs this
// used to use (calibrated for a white page, illegible-ish on slate-900).
function activityBadge(merchant: AdminMerchantSummary) {
  if (merchant.approvalStatus === 'pending') {
    return { label: 'En attente de validation', className: 'bg-violet-500/20 text-violet-300' }
  }
  if (merchant.approvalStatus === 'rejected') {
    return { label: 'Refusé', className: 'bg-red-500/20 text-red-300' }
  }

  const reference = merchant.lastActivityAt ?? merchant.createdAt
  const hours = (Date.now() - new Date(reference).getTime()) / (60 * 60 * 1000)

  if (merchant.billingStatus === 'poc_active' && merchant.pocDaysRemaining !== null) {
    return { label: `POC actif — ${merchant.pocDaysRemaining}j restants`, className: 'bg-blue-500/20 text-blue-300' }
  }
  if (hours < 48) return { label: 'En activité', className: 'bg-emerald-500/20 text-emerald-300' }
  if (hours > 7 * 24) return { label: 'Inactif', className: 'bg-orange-500/20 text-orange-300' }
  return { label: 'Actif', className: 'bg-emerald-500/20 text-emerald-300' }
}

export function AdminMerchantsTable({ merchants }: { merchants: AdminMerchantSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      if (filter === 'this_week') return daysSince(m.createdAt) <= 7
      if (filter === 'poc_expiring') return m.pocDaysRemaining !== null && m.pocDaysRemaining < 10
      if (filter === 'inactive') return daysSince(m.lastActivityAt ?? m.createdAt) > 14
      return true
    })
  }, [merchants, filter])

  async function extendPoc(merchantId: string) {
    setExtendingId(merchantId)
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend_poc', extraDays: 30 }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de la prolongation.')
        return
      }
      showToast('success', '✅ POC prolongé de 30 jours.')
      window.location.reload()
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setExtendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key
                ? 'border-[#706af1] bg-[#453ee8]/10 text-[#a5a0f5]'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminCard>
        <AdminCardContent className="w-full max-w-full overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Enseigne</th>
                <th className="px-4 py-3 font-medium">Gérant</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
                <th className="px-4 py-3 font-medium">Clients</th>
                <th className="px-4 py-3 font-medium">Cartes Wallet</th>
                <th className="px-4 py-3 font-medium">Dernière activité</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const badge = activityBadge(m)
                return (
                  <tr key={m.id} className="border-b border-slate-800 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-slate-100">{m.businessName}</td>
                    <td className="px-4 py-3 text-slate-400">{m.ownerEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-slate-200">{m.customerCount}</td>
                    <td className="px-4 py-3 text-slate-200">{m.walletCardCount}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {m.lastActivityAt ? new Date(m.lastActivityAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent', badge.className)}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/merchants/${m.id}`}>
                          <Button size="sm" variant="outline" className={ADMIN_OUTLINE_BUTTON}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Inspecter
                          </Button>
                        </Link>
                        {m.approvalStatus === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={ADMIN_OUTLINE_BUTTON}
                            disabled={extendingId === m.id}
                            onClick={() => extendPoc(m.id)}
                          >
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                            {extendingId === m.id ? '…' : 'Prolonger POC'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Aucun commerçant ne correspond à ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminCardContent>
      </AdminCard>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </div>
  )
}

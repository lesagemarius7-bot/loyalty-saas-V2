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

// Mirrors the real stored approval_status/billing_status values (not the
// computed "En activité"/"Inactif" activity read) — lets an admin find e.g.
// every merchant currently past_due regardless of how recently their
// customers scanned a card.
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente de validation' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'poc_active', label: 'Essai (POC)' },
  { value: 'active', label: 'Actif' },
  { value: 'past_due', label: 'Paiement en retard' },
  { value: 'canceled', label: 'Suspendu / résilié' },
]

function matchesStatus(m: AdminMerchantSummary, statusValue: string): boolean {
  if (statusValue === 'all') return true
  if (statusValue === 'pending' || statusValue === 'rejected') return m.approvalStatus === statusValue
  return m.approvalStatus === 'approved' && m.billingStatus === statusValue
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
}

// Low-opacity saturated bg + light-toned text of the same hue — reads well
// on the dark admin shell, unlike the light bg-X-100/text-X-800 pairs this
// used to use (calibrated for a white page, illegible-ish on slate-900).
// `edge` feeds a matching colored left-border on the row so status is
// scannable down the whole column, not just inside the pill.
function activityBadge(merchant: AdminMerchantSummary) {
  if (merchant.approvalStatus === 'pending') {
    return { label: 'En attente de validation', className: 'bg-violet-500/20 text-violet-300', edge: 'border-l-violet-500' }
  }
  if (merchant.approvalStatus === 'rejected') {
    return { label: 'Refusé', className: 'bg-red-500/20 text-red-300', edge: 'border-l-red-500' }
  }

  const reference = merchant.lastActivityAt ?? merchant.createdAt
  const hours = (Date.now() - new Date(reference).getTime()) / (60 * 60 * 1000)

  if (merchant.billingStatus === 'poc_active' && merchant.pocDaysRemaining !== null) {
    return {
      label: `POC actif — ${merchant.pocDaysRemaining}j restants`,
      className: 'bg-[#706af1]/20 text-[#a5a0f5]',
      edge: 'border-l-[#706af1]',
    }
  }
  if (hours > 7 * 24) return { label: 'Inactif', className: 'bg-orange-500/20 text-orange-300', edge: 'border-l-orange-500' }
  return { label: 'Actif', className: 'bg-emerald-500/20 text-emerald-300', edge: 'border-l-emerald-500' }
}

export function AdminMerchantsTable({ merchants }: { merchants: AdminMerchantSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [statusValue, setStatusValue] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return merchants.filter((m) => {
      if (filter === 'this_week' && daysSince(m.createdAt) > 7) return false
      if (filter === 'poc_expiring' && !(m.pocDaysRemaining !== null && m.pocDaysRemaining < 10)) return false
      if (filter === 'inactive' && daysSince(m.lastActivityAt ?? m.createdAt) <= 14) return false

      if (!matchesStatus(m, statusValue)) return false

      if (term && !m.businessName.toLowerCase().includes(term) && !(m.ownerEmail ?? '').toLowerCase().includes(term)) {
        return false
      }

      const createdDate = m.createdAt.slice(0, 10)
      if (dateFrom && createdDate < dateFrom) return false
      if (dateTo && createdDate > dateTo) return false

      return true
    })
  }, [merchants, filter, search, statusValue, dateFrom, dateTo])

  const hasCustomFilters = Boolean(search || statusValue !== 'all' || dateFrom || dateTo)

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
        <AdminCardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-400">Recherche</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enseigne ou e-mail du gérant…"
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Statut</label>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Inscrit à partir du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Jusqu’au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            />
          </div>
          {hasCustomFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusValue('all')
                setDateFrom('')
                setDateTo('')
              }}
              className="rounded-md px-2 py-1.5 text-sm text-slate-400 underline hover:text-slate-200"
            >
              Réinitialiser
            </button>
          )}
        </AdminCardContent>
      </AdminCard>

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
                  <tr
                    key={m.id}
                    className={cn('border-b border-l-4 border-slate-800 last:border-0 hover:bg-white/[0.02]', badge.edge)}
                  >
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
                    Aucun commerçant ne correspond à ces filtres.
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

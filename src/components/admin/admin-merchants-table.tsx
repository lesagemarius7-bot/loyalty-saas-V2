'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

function activityBadge(merchant: AdminMerchantSummary) {
  const reference = merchant.lastActivityAt ?? merchant.createdAt
  const hours = (Date.now() - new Date(reference).getTime()) / (60 * 60 * 1000)

  if (merchant.billingStatus === 'poc_active' && merchant.pocDaysRemaining !== null) {
    return { label: `POC actif — ${merchant.pocDaysRemaining}j restants`, className: 'bg-blue-100 text-blue-800' }
  }
  if (hours < 48) return { label: 'En activité', className: 'bg-emerald-100 text-emerald-800' }
  if (hours > 7 * 24) return { label: 'Inactif', className: 'bg-orange-100 text-orange-800' }
  return { label: 'Actif', className: 'bg-emerald-100 text-emerald-800' }
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
    <>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="w-full max-w-full overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
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
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{m.businessName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.ownerEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">{m.customerCount}</td>
                    <td className="px-4 py-3">{m.walletCardCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.lastActivityAt ? new Date(m.lastActivityAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent', badge.className)}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/merchants/${m.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Inspecter
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" disabled={extendingId === m.id} onClick={() => extendPoc(m.id)}>
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                          {extendingId === m.id ? '…' : 'Prolonger POC'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun commerçant ne correspond à ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

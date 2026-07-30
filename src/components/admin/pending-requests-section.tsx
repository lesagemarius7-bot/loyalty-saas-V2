'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle, AdminCardDescription, ADMIN_OUTLINE_BUTTON } from '@/components/admin/admin-card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import type { AdminMerchantSummary } from '@/lib/analytics/admin-merchants-list'

export function PendingRequestsSection({ requests }: { requests: AdminMerchantSummary[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  if (requests.length === 0) return null

  async function handle(merchantId: string, action: 'approve' | 'reject') {
    setBusyId(merchantId)
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de l’action.')
        return
      }
      showToast(
        'success',
        action === 'approve' ? '✅ Accès activé — POC de 30 jours démarré, e-mail envoyé.' : '❌ Demande refusée.'
      )
      window.location.reload()
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminCard accent="neutral" className="border-[#453ee8]/40 bg-[#453ee8]/10">
        <AdminCardHeader>
          <AdminCardTitle className="text-base">📋 Demandes en attente ({requests.length})</AdminCardTitle>
          <AdminCardDescription>Nouvelles inscriptions en attente de validation.</AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{r.businessName}</p>
                <p className="text-xs text-slate-400">
                  {r.ownerName ?? 'Gérant inconnu'} · {r.ownerEmail ?? '—'}
                  {r.phone && ` · ${r.phone}`}
                </p>
                <p className="text-xs text-slate-400">Demandé le {new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={busyId === r.id} onClick={() => handle(r.id, 'approve')}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Accepter l’accès (POC 1 mois)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={ADMIN_OUTLINE_BUTTON}
                  disabled={busyId === r.id}
                  onClick={() => handle(r.id, 'reject')}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </AdminCardContent>
      </AdminCard>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

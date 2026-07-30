'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">📋 Demandes en attente ({requests.length})</CardTitle>
          <CardDescription>Nouvelles inscriptions en attente de validation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div>
                <p className="text-sm font-semibold">{r.businessName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.ownerName ?? 'Gérant inconnu'} · {r.ownerEmail ?? '—'}
                  {r.phone && ` · ${r.phone}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Demandé le {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={busyId === r.id} onClick={() => handle(r.id, 'approve')}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Accepter l’accès (POC 1 mois)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.id}
                  onClick={() => handle(r.id, 'reject')}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

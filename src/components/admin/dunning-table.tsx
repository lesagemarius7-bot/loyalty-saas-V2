'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminBadge } from '@/components/admin/admin-badge'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle, AdminCardDescription, ADMIN_OUTLINE_BUTTON } from '@/components/admin/admin-card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { DunningEntry, CardExpiringEntry } from '@/lib/analytics/admin-finance'

const DUNNING_LABELS: Record<DunningEntry['dunningStatus'], string> = {
  payment_failed: '❌ Prélèvement échoué',
  retry_1: '📩 1ère relance envoyée',
  suspended: '⛔ Accès suspendu',
}

const DUNNING_VARIANT: Record<DunningEntry['dunningStatus'], 'destructive' | 'warning'> = {
  payment_failed: 'destructive',
  retry_1: 'warning',
  suspended: 'destructive',
}

const DUNNING_EDGE: Record<DunningEntry['dunningStatus'], string> = {
  payment_failed: 'border-l-red-500',
  retry_1: 'border-l-amber-500',
  suspended: 'border-l-red-500',
}

export function DunningTable({
  failedPayments,
  cardsExpiringSoon,
  stripeReachable,
}: {
  failedPayments: DunningEntry[]
  cardsExpiringSoon: CardExpiringEntry[]
  stripeReachable: boolean
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  async function runAction(path: string, merchantId: string, successMessage: string) {
    setBusyId(merchantId)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de l’action.')
        return
      }
      showToast('success', successMessage)
      router.refresh()
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="text-base">Prélèvements échoués & relances</AdminCardTitle>
          <AdminCardDescription>
            Alimenté par les webhooks Stripe réels (invoice.payment_failed / payment_succeeded) — vide tant qu’aucun
            paiement Stripe réel n’a échoué.
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent className="space-y-2">
          {failedPayments.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun impayé en cours. 🎉</p>
          ) : (
            failedPayments.map((entry) => (
              <div
                key={entry.merchantId}
                className={cn(
                  'flex flex-col gap-2 rounded-md border border-l-4 border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                  DUNNING_EDGE[entry.dunningStatus]
                )}
              >
                <div>
                  <p className="font-medium text-white">{entry.businessName}</p>
                  <p className="text-xs text-slate-400">{entry.ownerEmail ?? 'e-mail inconnu'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminBadge variant={DUNNING_VARIANT[entry.dunningStatus]}>
                    {DUNNING_LABELS[entry.dunningStatus]}
                  </AdminBadge>
                  <Button
                    size="sm"
                    variant="outline"
                    className={ADMIN_OUTLINE_BUTTON}
                    disabled={busyId === entry.merchantId || !entry.hasStripeCustomer || entry.dunningStatus === 'suspended'}
                    title={!entry.hasStripeCustomer ? "Pas de compte Stripe pour ce commerçant." : undefined}
                    onClick={() =>
                      runAction('/api/admin/finance/dunning/retry', entry.merchantId, '📩 Lien de mise à jour CB envoyé.')
                    }
                  >
                    📩 Renvoyer lien CB
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === entry.merchantId || entry.dunningStatus === 'suspended'}
                    onClick={() =>
                      runAction('/api/admin/finance/dunning/suspend', entry.merchantId, '⛔ Accès suspendu pour impayé.')
                    }
                  >
                    ⛔ Suspendre
                  </Button>
                </div>
              </div>
            ))
          )}
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="text-base">Cartes bancaires expirant sous 30 jours</AdminCardTitle>
          <AdminCardDescription>
            {stripeReachable
              ? 'Vérification en direct via l’API Stripe pour les commerçants ayant un compte Stripe.'
              : 'Vérification indisponible — Stripe n’est pas joignable (clé de production non configurée pour la facturation réelle).'}
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent className="space-y-2">
          {!stripeReachable ? (
            <p className="text-sm text-slate-400">—</p>
          ) : cardsExpiringSoon.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune carte n’expire dans les 30 prochains jours.</p>
          ) : (
            cardsExpiringSoon.map((entry) => (
              <div
                key={entry.merchantId}
                className="flex items-center justify-between rounded-md border border-l-4 border-slate-800 border-l-amber-500 px-4 py-3"
              >
                <span className="font-medium text-white">{entry.businessName}</span>
                <span className="text-sm text-amber-400">
                  Expire {String(entry.expMonth).padStart(2, '0')}/{entry.expYear}
                </span>
              </div>
            ))
          )}
        </AdminCardContent>
      </AdminCard>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </div>
  )
}

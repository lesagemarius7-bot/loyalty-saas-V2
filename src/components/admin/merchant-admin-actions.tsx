'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin/admin-card'
import { ADMIN_OUTLINE_BUTTON } from '@/components/admin/admin-card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import { PLANS } from '@/lib/billing/plans'
import type { Merchant } from '@/types'

export function MerchantAdminActions({ merchant }: { merchant: Merchant }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [plan, setPlan] = useState(merchant.subscription_plan)
  const { toast, showToast, dismiss } = useToast()

  async function runAction(body: Record<string, unknown>, successMessage: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      setBusy(false)
    }
  }

  const isSuspended = merchant.billing_status === 'canceled'
  const isPending = merchant.approval_status === 'pending'

  async function handleImpersonate() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de la prise de main.')
        setBusy(false)
        return
      }
      router.push('/dashboard')
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isPending && (
        <AdminCard>
          <AdminCardContent className="pt-6">
            <Button variant="outline" className={`w-full ${ADMIN_OUTLINE_BUTTON}`} disabled={busy} onClick={handleImpersonate}>
              👁️ Se connecter en tant que {merchant.business_name}
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              Ouvre le tableau de bord de ce commerçant en mode support (1 heure). Une bannière reste visible en
              permanence tant que ce mode est actif.
            </p>
          </AdminCardContent>
        </AdminCard>
      )}

      {isPending && (
        <AdminCard className="border-[#453ee8]/40 bg-[#453ee8]/10">
          <AdminCardHeader>
            <AdminCardTitle className="text-base">Demande en attente</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="flex gap-2">
            <Button
              disabled={busy}
              onClick={() => runAction({ action: 'approve' }, '✅ Accès activé — POC de 30 jours démarré, e-mail envoyé.')}
            >
              Accepter l’accès (POC 1 mois)
            </Button>
            <Button
              variant="outline"
              className={ADMIN_OUTLINE_BUTTON}
              disabled={busy}
              onClick={() => runAction({ action: 'reject' }, '❌ Demande refusée.')}
            >
              Refuser
            </Button>
          </AdminCardContent>
        </AdminCard>
      )}

      <AdminCard className={isPending ? 'opacity-50' : undefined}>
        <AdminCardHeader>
          <AdminCardTitle className="text-base">Actions admin</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">Prolonger la période d’essai (POC)</p>
            <Button
              size="sm"
              variant="outline"
              className={ADMIN_OUTLINE_BUTTON}
              disabled={busy || isPending}
              onClick={() => runAction({ action: 'extend_poc', extraDays: 30 }, '✅ POC prolongé de 30 jours.')}
            >
              + 30 jours
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">Formule d’abonnement</p>
            <div className="flex items-center gap-2">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as typeof plan)}
                disabled={busy || isPending}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.price} €/mois
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className={ADMIN_OUTLINE_BUTTON}
                disabled={busy || isPending || plan === merchant.subscription_plan}
                onClick={() => runAction({ action: 'change_plan', plan }, '✅ Formule mise à jour.')}
              >
                Appliquer
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">Statut du compte</p>
            <Button
              size="sm"
              variant={isSuspended ? 'default' : 'destructive'}
              disabled={busy || isPending}
              onClick={() =>
                runAction(
                  { action: 'toggle_status', status: isSuspended ? 'active' : 'suspended' },
                  isSuspended ? '✅ Compte réactivé.' : '✅ Compte suspendu.'
                )
              }
            >
              {isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
            </Button>
          </div>
        </AdminCardContent>
      </AdminCard>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

export interface DeleteTargetCustomer {
  id: string
  fullName: string
}

// Shared confirmation dialog for both the per-row trash icon (a single
// customer) and the floating bulk-action bar (many) — same component, the
// message and the endpoint it calls are the only things that differ by
// customers.length.
export function ConfirmDeleteCustomersModal({
  customers,
  onClose,
  onDeleted,
}: {
  customers: DeleteTargetCustomer[]
  onClose: () => void
  onDeleted: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState<number | null>(null)
  const { toast, showToast, dismiss } = useToast()

  const isSingle = customers.length === 1

  async function handleConfirm() {
    setDeleting(true)
    try {
      const res = isSingle
        ? await fetch(`/api/customers/${customers[0]!.id}`, { method: 'DELETE' })
        : await fetch('/api/customers/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerIds: customers.map((c) => c.id) }),
          })

      const data = await res.json()

      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de la suppression.')
        setDeleting(false)
        return
      }

      const deletedCount = data.deletedCount ?? customers.length
      showToast('success', `✅ ${deletedCount} client(s) supprimé(s) avec succès.`)
      router.refresh()
      // Keep the modal (and its toast) mounted for a beat before the parent
      // unmounts it — matches SendTargetedNotificationModal's onSent delay,
      // otherwise the toast disappears the instant this component unmounts.
      setDeleted(deletedCount)
      setTimeout(() => onDeleted(), 900)
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        onClick={() => !deleting && deleted === null && onClose()}
      >
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <CardTitle id="confirm-delete-title" className="pt-1.5">
                  {isSingle ? `Supprimer ${customers[0]!.fullName} ?` : `Supprimer ${customers.length} clients ?`}
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={deleting || deleted !== null}
                aria-label="Fermer"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deleted !== null ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground">
                  ✅
                </span>
                <p className="font-medium">{deleted} client(s) supprimé(s) avec succès.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {isSingle
                    ? `Êtes-vous sûr de vouloir supprimer ${customers[0]!.fullName} ? Cette action est irréversible et désactivera sa carte Wallet.`
                    : `Êtes-vous sûr de vouloir supprimer définitivement ces ${customers.length} clients sélectionnés ? Cette action est irréversible et désactivera leurs cartes Wallet.`}
                </p>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
                    Annuler
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
                    {deleting ? 'Suppression…' : 'Supprimer'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

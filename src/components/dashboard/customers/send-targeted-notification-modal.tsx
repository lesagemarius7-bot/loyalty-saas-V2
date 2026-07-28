'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import { NotificationComposer, type PreviewCustomerData } from '@/components/dashboard/notifications/notification-composer'
import { formatDeliverySummary } from '@/lib/notifications/format-delivery-summary'
import type { NotificationTemplate } from '@/types'

export interface TargetedCustomer {
  id: string
  firstName: string
  lastName: string
  favoriteCategory: string | null
  lastPurchasedCategory: string | null
  lastTransactionAt: string | null
  currentStamps: number
}

export function SendTargetedNotificationModal({
  merchantId,
  businessName,
  templates,
  customers,
  targetSummary,
  onClose,
  onSent,
}: {
  merchantId: string
  businessName: string
  templates: NotificationTemplate[]
  customers: TargetedCustomer[]
  targetSummary: string
  onClose: () => void
  onSent: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch('/api/notifications/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: customers.map((c) => c.id),
          targetSummary,
          title: title.trim() || undefined,
          message,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de l’envoi.')
        return
      }

      showToast('success', `✅ Envoyé à ${data.recipientCount} client(s) — ${formatDeliverySummary(data.apple, data.google)}`)
      setSent(true)
      router.refresh()
      setTimeout(() => onSent(), 900)
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setSending(false)
    }
  }

  const first = customers[0]
  const previewCustomer: PreviewCustomerData | null = first
    ? {
        label: `${first.firstName} ${first.lastName}`.trim() || 'ce client',
        firstName: first.firstName,
        lastName: first.lastName,
        favoriteCategory: first.favoriteCategory,
        lastPurchasedCategory: first.lastPurchasedCategory,
        lastTransactionAt: first.lastTransactionAt,
        currentStamps: first.currentStamps,
      }
    : null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="targeted-notification-title"
        onClick={onClose}
      >
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle id="targeted-notification-title">
                  📢 Envoyer une notification ciblée ({customers.length} client{customers.length > 1 ? 's' : ''}{' '}
                  sélectionné{customers.length > 1 ? 's' : ''})
                </CardTitle>
                <CardDescription className="mt-1">Cible : {targetSummary}</CardDescription>
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground">
                  ✅
                </span>
                <p className="font-medium">Envoyé à {customers.length} client(s) avec succès !</p>
              </div>
            ) : (
              <>
                <NotificationComposer
                  merchantId={merchantId}
                  businessName={businessName}
                  title={title}
                  onTitleChange={setTitle}
                  body={message}
                  onBodyChange={setMessage}
                  templates={templates}
                  previewCustomer={previewCustomer}
                />

                <Button onClick={handleSend} disabled={!message.trim() || sending} className="w-full">
                  {sending ? 'Diffusion en cours…' : `🚀 Diffuser à ${customers.length} client(s)`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

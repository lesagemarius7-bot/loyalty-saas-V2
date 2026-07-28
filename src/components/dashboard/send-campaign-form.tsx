'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import { NotificationComposer, type PreviewCustomerData } from '@/components/dashboard/notifications/notification-composer'
import { SYSTEM_TEMPLATES } from '@/lib/notifications/variables'
import type { NotificationTemplate } from '@/types'

export function SendCampaignForm({
  recipientCount,
  merchantId,
  businessName,
  templates,
  previewCustomer,
  initialTemplateId,
}: {
  recipientCount: number
  merchantId: string
  businessName: string
  templates: NotificationTemplate[]
  previewCustomer: PreviewCustomerData | null
  /** Preselects a template — set via ?template=… from the dashboard's "Animation Flash" quick action. */
  initialTemplateId?: string
}) {
  const router = useRouter()
  const initial = SYSTEM_TEMPLATES.find((t) => t.id === initialTemplateId)
  const [title, setTitle] = useState(initial?.titleTemplate ?? '')
  const [message, setMessage] = useState(initial?.bodyTemplate ?? '')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  async function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || undefined, message }),
      })
      const data = await res.json()

      if (!res.ok) {
        showToast('error', data.error ?? 'Échec de l’envoi.')
        return
      }

      showToast('success', `✅ Message envoyé avec succès à ${data.recipientCount} client(s) !`)
      setSent(true)
      setTitle('')
      setMessage('')
      router.refresh()
      setTimeout(() => setSent(false), 2000)
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle notification</CardTitle>
          <CardDescription>
            Envoyée à vos {recipientCount} client(s) via Apple Wallet et Google Wallet — pas de SMS, pas d’email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground">
                ✅
              </span>
              <p className="font-medium">Envoyé à {recipientCount} client(s) avec succès !</p>
            </div>
          ) : (
            <>
              <NotificationComposer
                merchantId={merchantId}
                businessName={businessName}
                title={title}
                onTitleChange={(v) => {
                  setTitle(v)
                  setConfirming(false)
                }}
                body={message}
                onBodyChange={(v) => {
                  setMessage(v)
                  setConfirming(false)
                }}
                templates={templates}
                previewCustomer={previewCustomer}
              />

              <Button
                onClick={handleClick}
                disabled={!message.trim() || sending || recipientCount === 0}
                variant={confirming ? 'destructive' : 'default'}
              >
                <Send className="mr-1.5 h-4 w-4" />
                {sending
                  ? 'Envoi en cours…'
                  : confirming
                    ? `Confirmer l’envoi à ${recipientCount} client(s)`
                    : 'Envoyer'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

const MAX_LENGTH = 150

export function SendTargetedNotificationModal({
  customers,
  targetSummary,
  onClose,
  onSent,
}: {
  customers: { id: string; full_name: string }[]
  targetSummary: string
  onClose: () => void
  onSent: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
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

      const parts: string[] = []
      if (data.apple.configured) parts.push(`${data.apple.attempted} appareil(s) Apple`)
      if (data.google.configured) parts.push(`${data.google.attempted} carte(s) Google`)
      const detail = parts.length > 0 ? ` (${parts.join(', ')})` : ' — aucun wallet configuré, message enregistré uniquement.'
      showToast('success', `Notification diffusée à ${data.recipientCount} client(s)${detail}`)

      router.refresh()
      onSent()
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="targeted-notification-title"
        onClick={onClose}
      >
        <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
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
            <div className="space-y-1">
              <label className="text-sm font-medium">Titre du push (optionnel)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Offre exclusive sur notre collection T-Shirts !"
                maxLength={60}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Corps du message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="Bonjour {{first_name}}, profitez de -15% sur la nouvelle collection !"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-right text-xs text-muted-foreground">
                {message.length}/{MAX_LENGTH} — {'{{first_name}}'} est remplacé par le prénom de chaque client.
              </p>
            </div>

            <Button onClick={handleSend} disabled={!message.trim() || sending} className="w-full">
              {sending ? 'Diffusion en cours…' : `🚀 Diffuser à ${customers.length} client(s)`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

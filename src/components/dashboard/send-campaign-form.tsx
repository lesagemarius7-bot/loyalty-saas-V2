'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

const MAX_LENGTH = 150

// Pillar 1 — "animate your shop in 10 seconds": a starter string the merchant
// finishes typing (the actual dish/offer always varies), not a fully
// pre-written message — one click still needs a few words of real content
// before it means anything.
const TEMPLATES = [
  { id: 'plat-du-jour', label: 'Plat du jour 🍽️', text: '🍽️ Plat du jour : ' },
  { id: 'offre-flash', label: 'Offre Flash ⚡', text: '⚡ Offre flash : ' },
  { id: 'information', label: 'Information 📢', text: '📢 Information : ' },
]

export function SendCampaignForm({
  recipientCount,
  initialTemplateId,
}: {
  recipientCount: number
  /** Preselects a template — set via ?template=… from the dashboard's "Animation Flash" quick action. */
  initialTemplateId?: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState(
    () => TEMPLATES.find((t) => t.id === initialTemplateId)?.text ?? ''
  )
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
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
        body: JSON.stringify({ message }),
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
      showToast('success', `Notification envoyée à ${data.recipientCount} client(s)${detail}`)

      setMessage('')
      router.refresh()
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
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => {
                  setMessage(template.text)
                  setConfirming(false)
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {template.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value.slice(0, MAX_LENGTH))
                setConfirming(false)
              }}
              placeholder="Ex : Ventes privées ce week-end — -20% pour nos membres fidélité !"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="text-right text-xs text-muted-foreground">
              {message.length}/{MAX_LENGTH}
            </p>
          </div>

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
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

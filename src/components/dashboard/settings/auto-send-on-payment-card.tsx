'use client'

import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

type Channel = 'email' | 'link_only'

export function AutoSendOnPaymentCard({
  apiKey: initialApiKey,
  initialEnabled,
  initialChannel,
}: {
  apiKey: string
  initialEnabled: boolean | null | undefined
  initialChannel: Channel | null | undefined
}) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [enabled, setEnabled] = useState(initialEnabled ?? false)
  const [channel, setChannel] = useState<Channel>(initialChannel ?? 'email')
  const [toggling, setToggling] = useState(false)
  const [savingChannel, setSavingChannel] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState<'key' | 'url' | null>(null)
  const { toast, showToast, dismiss } = useToast()

  async function handleRegenerate() {
    if (
      !window.confirm(
        "Régénérer la clé API invalide immédiatement l'ancienne — toute caisse/terminal déjà connecté cessera de fonctionner jusqu'à ce que vous le reconfiguriez avec la nouvelle clé. Continuer ?"
      )
    ) {
      return
    }
    setRegenerating(true)
    try {
      const res = await fetch('/api/dashboard/api-key/regenerate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setApiKey(data.apiKey)
      showToast('success', 'Nouvelle clé API générée.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Échec de la régénération.')
    } finally {
      setRegenerating(false)
    }
  }

  async function save(overrides: { enabled?: boolean; channel?: Channel } = {}) {
    const res = await fetch('/api/program/auto-send-on-payment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: overrides.enabled ?? enabled,
        channel: overrides.channel ?? channel,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
  }

  async function handleToggle(next: boolean) {
    setToggling(true)
    const previous = enabled
    setEnabled(next)
    try {
      await save({ enabled: next })
      showToast('success', next ? 'Envoi automatique activé.' : 'Envoi automatique désactivé.')
    } catch (err) {
      setEnabled(previous)
      showToast('error', err instanceof Error ? err.message : 'Échec de la mise à jour.')
    } finally {
      setToggling(false)
    }
  }

  async function handleChannelChange(next: Channel) {
    setSavingChannel(true)
    const previous = channel
    setChannel(next)
    try {
      await save({ channel: next })
      showToast('success', 'Canal mis à jour.')
    } catch (err) {
      setChannel(previous)
      showToast('error', err instanceof Error ? err.message : 'Échec de la mise à jour.')
    } finally {
      setSavingChannel(false)
    }
  }

  async function copyToClipboard(value: string, which: 'key' | 'url') {
    await navigator.clipboard.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/payments/success` : ''
  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant_api_key": "${apiKey}",
    "customer_email": "client@example.com",
    "customer_name": "Sophie Martin",
    "transaction_amount": 24.50,
    "purchased_category": "Café & Pâtisserie"
  }'`

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Envoi automatique post-paiement</CardTitle>
              <CardDescription className="mt-1">
                Vos clients reçoivent leur carte Wallet par e-mail dès qu’ils paient en caisse, sans avoir à scanner
                de QR code.
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {toggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={toggling}
                aria-label="Activer l’envoi automatique post-paiement"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn('space-y-4 transition-opacity', !enabled && 'opacity-50')}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Canal d’envoi</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!enabled || savingChannel}
                onClick={() => handleChannelChange('email')}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
                  channel === 'email' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'
                )}
              >
                📧 E-mail automatique
              </button>
              <button
                type="button"
                disabled={!enabled || savingChannel}
                onClick={() => handleChannelChange('link_only')}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
                  channel === 'link_only' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'
                )}
              >
                🔗 Lien seul (ticket de caisse / SMS)
              </button>
            </div>
            {channel === 'link_only' && (
              <p className="text-xs text-muted-foreground">
                Loyalty n’envoie pas de SMS lui-même : le webhook renvoie un Smart Link à intégrer sur votre ticket de
                caisse numérique ou à transmettre via votre propre solution SMS.
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
            <p className="text-muted-foreground">
              Connectez votre terminal de paiement ou logiciel de caisse (Stripe Terminal, SumUp, Square, Payfit,
              Pennylane…) à ce webhook pour déclencher l’envoi à chaque paiement validé.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Clé API marchand</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 font-mono text-xs">{apiKey}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(apiKey, 'key')}>
                  {copied === 'key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={regenerating} onClick={handleRegenerate}>
                  {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '🔄 Régénérer'}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">URL du webhook de paiement</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 font-mono text-xs">{webhookUrl}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl, 'url')}>
                  {copied === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Exemple d’appel (cURL)</label>
              <pre className="overflow-x-auto rounded-md bg-secondary px-3 py-2 text-xs">{curlExample}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

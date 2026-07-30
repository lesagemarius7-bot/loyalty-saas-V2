'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

function samplePayload() {
  return JSON.stringify(
    {
      customer_email: 'test-integration@example.invalid',
      customer_name: 'Client Test',
      transaction_amount: 4.7,
      items: [
        { sku: 'CROISSANT-BIO', name: 'Croissant Artisanal', quantity: 2, price: 1.5, category: 'Viennoiserie' },
        { sku: 'CAFE-ESPRESSO', name: 'Espresso Bio', quantity: 1, price: 1.7, category: 'Boissons Chaudes' },
      ],
    },
    null,
    2
  )
}

// Sends a REAL request to the merchant's own webhook with their real API
// key — this genuinely creates/updates a customer record, not a dry-run
// simulation. Pre-filled with an obviously-fake email so testing here
// doesn't collide with a real customer, and the warning below says so
// explicitly rather than leaving that as a surprise.
export function WebhookTester({ apiKey }: { apiKey: string }) {
  const [payload, setPayload] = useState(samplePayload())
  const [response, setResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    setResponse(null)
    setStatus(null)
    try {
      const res = await fetch('/api/webhooks/payments/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Merchant-Api-Key': apiKey },
        body: payload,
      })
      const data = await res.json().catch(() => ({ error: 'Réponse non-JSON' }))
      setStatus(res.status)
      setResponse(JSON.stringify(data, null, 2))
    } catch {
      setResponse('Impossible de contacter le serveur.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-amber-700">
        ⚠️ Ce test envoie une vraie requête à votre webhook avec votre vraie clé API — un client « {' '}
        <code className="rounded bg-secondary px-1">test-integration@example.invalid</code> » sera réellement créé
        dans votre liste de clients. Modifiez le JSON si besoin, ou supprimez ce client de test ensuite.
      </p>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs"
      />
      <Button type="button" size="sm" onClick={handleSend} disabled={sending}>
        {sending ? 'Envoi…' : '▶️ Envoyer la requête de test'}
      </Button>
      {response && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Réponse ({status})</p>
          <pre className="max-w-full overflow-x-auto rounded-md bg-secondary px-3 py-2 text-xs">{response}</pre>
        </div>
      )}
    </div>
  )
}

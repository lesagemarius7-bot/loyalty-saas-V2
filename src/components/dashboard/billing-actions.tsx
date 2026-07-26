'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function BillingActions({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const [loading, setLoading] = useState(false)

  async function startCheckout(priceId: string) {
    setLoading(true)
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  async function openBillingPortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  if (hasActiveSubscription) {
    return (
      <Button onClick={openBillingPortal} disabled={loading}>
        {loading ? 'Redirection…' : 'Gérer mon abonnement'}
      </Button>
    )
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER!)}
        disabled={loading}
      >
        S’abonner — Starter
      </Button>
      <Button
        variant="outline"
        onClick={() => startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!)}
        disabled={loading}
      >
        S’abonner — Pro
      </Button>
    </div>
  )
}

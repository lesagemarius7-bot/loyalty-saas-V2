'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function EnrollForm({ merchantSlug, brandColor }: { merchantSlug: string; brandColor: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/customers/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantSlug, fullName, email: email || undefined, phone: phone || undefined }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error?.formErrors?.[0] ?? data.error ?? 'Une erreur est survenue')
      setLoading(false)
      return
    }

    router.push(`/card/${data.cardId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="tel"
        placeholder="Téléphone (optionnel si email renseigné)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: brandColor }}>
        {loading ? 'Inscription…' : 'Rejoindre le programme'}
      </Button>
    </form>
  )
}

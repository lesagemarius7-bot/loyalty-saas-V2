'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function MerchantCityForm({ merchantId, initialCity }: { merchantId: string; initialCity: string | null }) {
  const router = useRouter()
  const [city, setCity] = useState(initialCity ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)

    const supabase = createClient()
    await supabase
      .from('merchants')
      .update({ city: city.trim() || null })
      .eq('id', merchantId)

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <label className="text-sm font-medium">Ville de votre commerce</label>
        <Input placeholder="Ex : Lyon" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
      {saved && <span className="text-sm text-muted-foreground">✅</span>}
    </form>
  )
}

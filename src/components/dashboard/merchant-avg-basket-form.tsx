'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function MerchantAvgBasketForm({ merchantId, initialValue }: { merchantId: string; initialValue: number | null }) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue !== null ? String(initialValue) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)

    const parsed = value.trim() === '' ? null : Number(value)
    const supabase = createClient()
    await supabase
      .from('merchants')
      .update({ avg_basket_value: parsed !== null && parsed > 0 ? parsed : null })
      .eq('id', merchantId)

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <label className="text-sm font-medium">Panier moyen (€)</label>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Ex : 12.50"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
      {saved && <span className="text-sm text-muted-foreground">✅</span>}
    </form>
  )
}

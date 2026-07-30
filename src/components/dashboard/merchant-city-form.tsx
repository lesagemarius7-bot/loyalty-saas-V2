'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'

export function MerchantCityForm({
  merchantId,
  initialCity,
  initialWeatherTriggerEnabled,
}: {
  merchantId: string
  initialCity: string | null
  initialWeatherTriggerEnabled: boolean
}) {
  const router = useRouter()
  const [city, setCity] = useState(initialCity ?? '')
  const [weatherTriggerEnabled, setWeatherTriggerEnabled] = useState(initialWeatherTriggerEnabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)

    const supabase = createClient()
    await supabase
      .from('merchants')
      .update({ city: city.trim() || null, weather_trigger_enabled: weatherTriggerEnabled })
      .eq('id', merchantId)

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Ville de votre commerce</label>
          <Input placeholder="Ex : Lyon" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">✅</span>}
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Alertes météo automatiques</p>
          <p className="text-xs text-muted-foreground">
            Canicule ou pluie/froid : envoie une offre push à tous vos clients (max 1 par condition toutes les 48h).
            Nécessite une ville renseignée.
          </p>
        </div>
        <Switch
          checked={weatherTriggerEnabled}
          onCheckedChange={setWeatherTriggerEnabled}
          aria-label="Activer les alertes météo automatiques"
        />
      </div>
    </form>
  )
}

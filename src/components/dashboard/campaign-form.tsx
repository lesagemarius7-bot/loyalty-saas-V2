'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LoyaltyProgram } from '@/types'

export function CampaignForm({ program }: { program: LoyaltyProgram }) {
  const [name, setName] = useState(program.name)
  const [pointsPerEuro, setPointsPerEuro] = useState(program.points_per_euro)
  const [rewardThreshold, setRewardThreshold] = useState(program.reward_threshold)
  const [rewardDescription, setRewardDescription] = useState(program.reward_description)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)

    const supabase = createClient()
    await supabase
      .from('loyalty_programs')
      .update({
        name,
        points_per_euro: pointsPerEuro,
        reward_threshold: rewardThreshold,
        reward_description: rewardDescription,
      })
      .eq('id', program.id)

    setSaving(false)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Nom du programme</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Points par euro dépensé</label>
        <Input
          type="number"
          step="0.1"
          value={pointsPerEuro}
          onChange={(e) => setPointsPerEuro(Number(e.target.value))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Seuil de récompense (points)</label>
        <Input
          type="number"
          value={rewardThreshold}
          onChange={(e) => setRewardThreshold(Number(e.target.value))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description de la récompense</label>
        <Input value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Enregistré ✅</span>}
      </div>
    </form>
  )
}

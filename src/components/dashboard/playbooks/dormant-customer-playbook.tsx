'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

const THRESHOLD_PRESETS = [14, 21, 30]
const MAX_MESSAGE_LENGTH = 150
const DEFAULT_THRESHOLD_DAYS = 30

// Accepts null/undefined even though the page tries to always pass real
// values — a Supabase fetch error, a partially-applied migration, or a legacy
// row from before these columns existed can all still surface here as
// undefined at runtime despite what the page's own types promise. Every piece
// of state below has its own fallback so the component can never crash on a
// missing value (message.length on undefined was the concrete crash this
// guards against).
export function DormantCustomerPlaybook({
  initialEnabled,
  initialThresholdDays,
  initialMessage,
}: {
  initialEnabled: boolean | null | undefined
  initialThresholdDays: number | null | undefined
  initialMessage: string | null | undefined
}) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false)
  const [thresholdDays, setThresholdDays] = useState(initialThresholdDays ?? DEFAULT_THRESHOLD_DAYS)
  const [message, setMessage] = useState(initialMessage ?? '')
  const [togglingSwitch, setTogglingSwitch] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  async function save(overrides: { enabled?: boolean; thresholdDays?: number; message?: string } = {}) {
    const res = await fetch('/api/program/playbooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inactivityReminderEnabled: overrides.enabled ?? enabled,
        inactivityThresholdDays: overrides.thresholdDays ?? thresholdDays,
        inactivityMessage: overrides.message ?? message,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
  }

  async function handleToggle(next: boolean) {
    setTogglingSwitch(true)
    const previous = enabled
    setEnabled(next)
    try {
      await save({ enabled: next })
      showToast('success', next ? 'Playbook activé.' : 'Playbook désactivé.')
    } catch (err) {
      setEnabled(previous)
      showToast('error', err instanceof Error ? err.message : 'Échec de la mise à jour.')
    } finally {
      setTogglingSwitch(false)
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await save()
      showToast('success', 'Réglages enregistrés.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Échec de l’enregistrement.')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Relance Client Dormant</CardTitle>
                <Badge variant="success">Opérationnel</Badge>
              </div>
              <CardDescription className="mt-1">
                Relance automatiquement un client qui n’est pas venu depuis un nombre de jours défini — exécuté
                chaque jour par le moteur anti-churn.
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {togglingSwitch && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={togglingSwitch}
                aria-label="Activer la relance client dormant"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn('space-y-4 transition-opacity', !enabled && 'opacity-50')}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Seuil d’inactivité</label>
            <div className="flex flex-wrap items-center gap-2">
              {THRESHOLD_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setThresholdDays(n)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
                    thresholdDays === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  {n} jours
                </button>
              ))}
              <Input
                type="number"
                min={1}
                max={365}
                value={thresholdDays}
                disabled={!enabled}
                onChange={(e) => setThresholdDays(Math.max(1, Number(e.target.value)))}
                className="w-24"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Message envoyé au client</label>
            <textarea
              value={message}
              disabled={!enabled}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
            />
            <p className="text-right text-xs text-muted-foreground">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={!enabled || savingSettings}>
            {savingSettings ? 'Enregistrement…' : 'Enregistrer les réglages'}
          </Button>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

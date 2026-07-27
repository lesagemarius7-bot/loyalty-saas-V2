'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

// Copilote Marketing — the fully-autonomous pillar. Unlike the dormant-
// customer playbook, there's nothing to configure here (thresholds/messages
// are decided per-customer by the arbitration engine, not set globally), so
// this is a toggle plus explanatory copy rather than a form.
export function SmartEngagementPlaybook({
  initialEnabled,
  weatherConfigured,
}: {
  initialEnabled: boolean | null | undefined
  weatherConfigured: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false)
  const [toggling, setToggling] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  async function handleToggle(next: boolean) {
    setToggling(true)
    const previous = enabled
    setEnabled(next)
    try {
      const res = await fetch('/api/program/smart-engagement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smartEngagementEnabled: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      showToast('success', next ? 'Copilote Marketing activé.' : 'Copilote Marketing désactivé.')
    } catch (err) {
      setEnabled(previous)
      showToast('error', err instanceof Error ? err.message : 'Échec de la mise à jour.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Copilote Marketing</CardTitle>
                <Badge variant="success">{weatherConfigured ? 'Opérationnel' : 'Opérationnel (sans météo)'}</Badge>
              </div>
              <CardDescription className="mt-1">
                Croise les habitudes d’achat, la météo locale et le risque d’inactivité pour envoyer, chaque jour et
                pour chaque client, le seul message le plus pertinent — ou aucun s’il n’y a rien à dire.
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {toggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={toggling}
                aria-label="Activer le Copilote Marketing"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Habitudes d’achat : calculées automatiquement à partir des passages réels enregistrés.</li>
            <li>
              Météo locale :{' '}
              {weatherConfigured
                ? 'connectée, renseignez votre ville dans Paramètres.'
                : 'non connectée — ajoutez OPENWEATHER_API_KEY pour l’activer.'}
            </li>
            <li>Anti-spam intégré : un client reçoit au maximum un message de ce moteur par jour.</li>
          </ul>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}

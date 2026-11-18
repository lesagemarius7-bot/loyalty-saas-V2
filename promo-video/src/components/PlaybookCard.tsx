import { Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Switch } from './ui/Switch'
import { cn } from '../lib'

// Ported from loyalty-saas/src/components/dashboard/playbooks/dormant-customer-playbook.tsx
// — same Card/Badge/Switch structure and copy, state passed in as props
// (driven by frame progress in the scene) instead of local useState.
export function PlaybookCard({ enabled, toggling = false }: { enabled: boolean; toggling?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Relance Client Dormant</CardTitle>
              <Badge variant="success">Opérationnel</Badge>
            </div>
            <CardDescription className="mt-1">
              Relance automatiquement un client qui n’est pas venu depuis un nombre de jours défini — exécuté chaque
              jour par le moteur anti-churn.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {toggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch checked={enabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4 transition-opacity', !enabled && 'opacity-50')}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Seuil d’inactivité</label>
          <div className="flex flex-wrap items-center gap-2">
            {[14, 21, 30].map((n) => (
              <span
                key={n}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium',
                  n === 30 ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                )}
              >
                {n} jours
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

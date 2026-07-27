import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { RecentActivityEvent } from '@/lib/analytics/dashboard-overview'

const ICONS: Record<RecentActivityEvent['type'], string> = {
  stamp: '☕',
  reward: '🎁',
  wallet_install: '📲',
}

export function RecentActivityFeed({ events }: { events: RecentActivityEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fil d’activité récente</CardTitle>
        <CardDescription>Les derniers événements enregistrés en boutique.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-3 py-3 text-sm">
                <span aria-hidden>{ICONS[event.type]}</span>
                <span className="flex-1">{event.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(event.occurredAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune activité pour le moment — les tampons, récompenses et cartes Wallet installées apparaîtront ici.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

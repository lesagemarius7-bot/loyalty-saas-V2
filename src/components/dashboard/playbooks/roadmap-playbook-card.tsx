import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Static "coming soon" teaser for playbooks that aren't built yet — no
// 'use client' needed here since it has no interactivity of its own; the
// disabled Switch inside is a client component but that's fine to render
// from a server component tree.
export function RoadmapPlaybookCard({
  title,
  description,
  tooltip,
}: {
  title: string
  description: string
  tooltip: string
}) {
  return (
    <Card className="opacity-75">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="secondary">Bientôt disponible</Badge>
            </div>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <span title={tooltip} className="shrink-0">
            <Switch checked={false} onCheckedChange={() => {}} disabled aria-label={`${title} — bientôt disponible`} />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{tooltip}</p>
      </CardContent>
    </Card>
  )
}

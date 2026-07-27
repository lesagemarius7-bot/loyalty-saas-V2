import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Static "coming soon" teaser for playbooks that aren't built yet. Deliberately
// does NOT render the interactive <Switch> component: passing it a real
// onCheckedChange handler from this Server Component crashes at render time
// ("Event handlers cannot be passed to Client Component props" — a function
// defined in a Server Component can't be serialized across the RSC boundary to
// a Client Component, even a disabled one). Since this switch is always
// off/disabled here anyway, a static visual copy avoids the crash and skips
// shipping a Client Component for something with zero interactivity.
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
          <span
            title={tooltip}
            role="switch"
            aria-checked={false}
            aria-disabled="true"
            aria-label={`${title} — bientôt disponible`}
            className="inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-secondary opacity-50"
          >
            <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{tooltip}</p>
      </CardContent>
    </Card>
  )
}

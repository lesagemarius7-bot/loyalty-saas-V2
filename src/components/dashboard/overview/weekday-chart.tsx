import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardOverview } from '@/lib/analytics/dashboard-overview'

export function WeekdayChart({ visitsByWeekday }: { visitsByWeekday: DashboardOverview['charts']['visitsByWeekday'] }) {
  const max = Math.max(1, ...visitsByWeekday.map((d) => d.count))
  const hasData = visitsByWeekday.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fréquentation par jour de la semaine</CardTitle>
        <CardDescription>90 derniers jours — identifiez vos jours creux.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex h-40 items-end gap-2">
            {visitsByWeekday.map((day) => (
              <div key={day.dayIndex} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{ height: `${Math.max((day.count / max) * 100, 4)}%` }}
                  title={`${day.count} passage(s)`}
                />
                <span className="text-[10px] text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pas encore assez de passages enregistrés pour repérer vos jours creux.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

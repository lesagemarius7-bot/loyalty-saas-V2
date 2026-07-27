import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { DownloadQrButton } from '@/components/dashboard/overview/download-qr-button'
import type { DashboardOverview } from '@/lib/analytics/dashboard-overview'

// "Copilote Recommandations" — always shows the counter enrollment shortcut
// (useful on day one with zero data), and adds the anti-churn / quiet-day
// suggestions only once there's real signal to base them on, so a brand-new
// account sees a guided next step instead of a false "0 inactive clients"
// alert or a quiet-day guess with no data behind it.
export function QuickActions({
  quickActions,
  enrollmentUrl,
}: {
  quickActions: DashboardOverview['quickActions']
  enrollmentUrl: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre d’actions rapides</CardTitle>
        <CardDescription>Ce que le Copilote vous recommande de faire maintenant.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {quickActions.inactiveCustomersCount > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              🔴 {quickActions.inactiveCustomersCount} client(s) n’ont pas visité depuis 21 jours
            </p>
            <Link href="/dashboard/campaigns" className={buttonVariants({ size: 'sm', className: 'mt-3' })}>
              ⚡ Lancer une relance express
            </Link>
          </div>
        )}

        {quickActions.quietestWeekday && (
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium">
              📉 {quickActions.quietestWeekday.label} est votre jour le plus calme
            </p>
            <Link
              href="/dashboard/playbooks"
              className={buttonVariants({ size: 'sm', variant: 'outline', className: 'mt-3' })}
            >
              Activer « Boost Jour Creux »
            </Link>
          </div>
        )}

        <div className="rounded-md border border-border p-4">
          <p className="text-sm font-medium">📢 Animez votre boutique en 1 clic</p>
          <Link
            href="/dashboard/notifications?template=plat-du-jour"
            className={buttonVariants({ size: 'sm', variant: 'outline', className: 'mt-3' })}
          >
            🍽️ Pousser le Plat du Jour
          </Link>
        </div>

        <div className="rounded-md border border-border p-4">
          <p className="text-sm font-medium">🖨️ Enrôlement comptoir</p>
          <div className="mt-3">
            <DownloadQrButton enrollmentUrl={enrollmentUrl} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

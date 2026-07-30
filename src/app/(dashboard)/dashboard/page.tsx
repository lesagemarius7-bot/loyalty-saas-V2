import Image from 'next/image'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { computeDashboardOverview } from '@/lib/analytics/dashboard-overview'
import { KpiCards } from '@/components/dashboard/overview/kpi-cards'
import { QuickActions } from '@/components/dashboard/overview/quick-actions'
import { WalletInstallsChart } from '@/components/dashboard/overview/wallet-installs-chart'
import { WeekdayChart } from '@/components/dashboard/overview/weekday-chart'
import { RecentActivityFeed } from '@/components/dashboard/overview/recent-activity-feed'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

const DEFAULT_WINDOW_DAYS = 30

export default async function DashboardOverviewPage() {
  const { merchant, dataClient } = await getCurrentMerchant()

  try {
    const overview = await computeDashboardOverview(dataClient, merchant, DEFAULT_WINDOW_DAYS)
    const enrollmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${merchant.slug}`

    return (
      <div className="space-y-8">
        <Image
          src="/branding/loyalty-logo-horizontal.png"
          alt="Loyalty"
          width={405}
          height={200}
          className="h-10 w-auto"
        />

        <div>
          <h1 className="text-2xl font-semibold">Vue d’ensemble</h1>
          <p className="text-muted-foreground">
            {overview.onboarding.hasAnyCustomers
              ? `Bienvenue, ${merchant.business_name}.`
              : `Bienvenue, ${merchant.business_name} — partagez votre QR code pour enrôler votre premier client.`}
          </p>
        </div>

        <KpiCards kpis={overview.kpis} />

        <QuickActions quickActions={overview.quickActions} enrollmentUrl={enrollmentUrl} />

        <div className="grid gap-6 lg:grid-cols-2">
          <WalletInstallsChart initialData={overview.charts.walletInstallsByDay} initialWindowDays={DEFAULT_WINDOW_DAYS} />
          <WeekdayChart visitsByWeekday={overview.charts.visitsByWeekday} />
        </div>

        <RecentActivityFeed events={overview.recentActivity} />
      </div>
    )
  } catch (err) {
    console.error('[dashboard] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger la vue d’ensemble"
        message="Une erreur inattendue est survenue pendant le chargement de vos statistiques. Réessayez dans un instant."
      />
    )
  }
}

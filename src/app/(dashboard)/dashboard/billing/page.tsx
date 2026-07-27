import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BillingActions } from '@/components/dashboard/billing-actions'
import { PocCountdownWidget } from '@/components/dashboard/billing/poc-countdown-widget'
import { PlanSelector } from '@/components/dashboard/billing/plan-selector'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

const BILLING_STATUS_LABELS: Record<string, string> = {
  poc_active: 'Essai POC',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Annulé',
}

export default async function BillingPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const hasActiveSubscription = merchant.subscription_status === 'active'
    const isPocActive = merchant.billing_status === 'poc_active'

    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Facturation</h1>
          <p className="text-muted-foreground">Gérez votre abonnement Loyalty.</p>
        </div>

        {isPocActive && (
          <PocCountdownWidget pocStartDate={merchant.poc_start_date} pocDurationDays={merchant.poc_duration_days} />
        )}

        <div>
          <h2 className="mb-1 text-lg font-semibold">Vos formules</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {isPocActive
              ? 'Choisissez la formule sur laquelle vous basculerez automatiquement à la fin de votre essai.'
              : 'Changez de formule à tout moment.'}
          </p>
          <PlanSelector merchantId={merchant.id} currentPlan={merchant.subscription_plan} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Abonnement</CardTitle>
              <Badge variant={hasActiveSubscription ? 'success' : 'secondary'}>
                {BILLING_STATUS_LABELS[merchant.billing_status] ?? merchant.billing_status}
              </Badge>
            </div>
            <CardDescription>
              {isPocActive
                ? 'Aucun paiement Stripe requis tant que votre essai est actif.'
                : 'Gérez votre moyen de paiement et vos factures.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingActions hasActiveSubscription={hasActiveSubscription} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error('[dashboard/billing] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger la facturation"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

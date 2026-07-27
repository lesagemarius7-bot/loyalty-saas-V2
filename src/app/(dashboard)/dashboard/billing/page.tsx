import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BillingActions } from '@/components/dashboard/billing-actions'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

const STATUS_LABELS: Record<string, string> = {
  trialing: "En essai",
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Annulé',
  incomplete: 'Incomplet',
}

export default async function BillingPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const hasActiveSubscription = merchant.subscription_status === 'active'

    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Facturation</h1>
          <p className="text-muted-foreground">Gérez votre abonnement Loyalty.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Abonnement</CardTitle>
              <Badge variant={hasActiveSubscription ? 'success' : 'secondary'}>
                {STATUS_LABELS[merchant.subscription_status] ?? merchant.subscription_status}
              </Badge>
            </div>
            <CardDescription>Plan actuel : {merchant.plan}</CardDescription>
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

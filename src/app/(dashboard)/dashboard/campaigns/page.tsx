import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CampaignForm } from '@/components/dashboard/campaign-form'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function CampaignsPage() {
  const { merchant, dataClient: supabase } = await getCurrentMerchant()

  try {
    // .maybeSingle(), not .single() — a merchant with no active program yet
    // (new account, or a signup-time insert that failed) is a valid state to
    // render, not an error to throw on.
    const { data: program, error: programError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (programError) {
      console.error('[dashboard/campaigns] failed to fetch program', programError)
    }

    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Programme de fidélité</h1>
          <p className="text-muted-foreground">Définissez les règles d’attribution de points.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Règles</CardTitle>
            <CardDescription>Ces règles s’appliquent à toutes les cartes de vos clients.</CardDescription>
          </CardHeader>
          <CardContent>
            {program ? (
              <CampaignForm program={program} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {programError
                  ? `Impossible de charger le programme (${programError.message}).`
                  : 'Aucun programme actif pour le moment — il sera créé automatiquement dès votre première modification depuis Design de la carte.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error('[dashboard/campaigns] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger le programme"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

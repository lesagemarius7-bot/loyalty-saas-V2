import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { AskLoyaltyChat } from '@/components/dashboard/ai/ask-loyalty-chat'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function AskLoyaltyAiPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    return (
      <div className="flex h-[calc(100vh-4rem)] max-w-3xl flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">✨ Ask Loyalty AI</h1>
          <p className="text-muted-foreground">
            Décrivez ce que vous voulez faire — je propose un ciblage et un message, vous validez avant l’envoi.
          </p>
        </div>

        <AskLoyaltyChat businessName={merchant.business_name} />
      </div>
    )
  } catch (err) {
    console.error('[dashboard/ai] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger Ask Loyalty AI"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

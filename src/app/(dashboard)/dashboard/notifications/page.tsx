import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SendCampaignForm } from '@/components/dashboard/send-campaign-form'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function NotificationsPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const supabase = await createClient()

    const [
      { count: recipientCount, error: recipientError },
      { data: campaigns, error: campaignsError },
    ] = await Promise.all([
      supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
      supabase
        .from('notification_campaigns')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (recipientError) console.error('[dashboard/notifications] recipient count failed', recipientError)
    if (campaignsError) console.error('[dashboard/notifications] campaigns fetch failed', campaignsError)

    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            Envoyez un message qui apparaît directement sur le Wallet de vos clients.
          </p>
        </div>

        <SendCampaignForm recipientCount={recipientCount ?? 0} />

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>Les 10 dernières notifications envoyées.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <ul className="divide-y divide-border">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="py-3 text-sm">
                    <p>{campaign.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleString('fr-FR')} · {campaign.recipient_count} client(s)
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {campaignsError
                  ? `Impossible de charger l’historique (${campaignsError.message}).`
                  : 'Aucune notification envoyée pour le moment.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error('[dashboard/notifications] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger les notifications"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

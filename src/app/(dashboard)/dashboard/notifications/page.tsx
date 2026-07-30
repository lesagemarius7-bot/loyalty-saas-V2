import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SendCampaignForm } from '@/components/dashboard/send-campaign-form'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { merchant, dataClient: supabase } = await getCurrentMerchant()
  const { template } = await searchParams

  try {
    const [
      { count: recipientCount, error: recipientError },
      { data: campaigns, error: campaignsError },
      { data: templates, error: templatesError },
      { data: sampleCustomer, error: sampleError },
    ] = await Promise.all([
      supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
      supabase
        .from('notification_campaigns')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('notification_templates').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('full_name, loyalty_cards(points_balance), customer_purchase_habits(favorite_category, last_purchased_category, last_transaction_at)')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (recipientError) console.error('[dashboard/notifications] recipient count failed', recipientError)
    if (campaignsError) console.error('[dashboard/notifications] campaigns fetch failed', campaignsError)
    if (templatesError) console.error('[dashboard/notifications] templates fetch failed', templatesError)
    if (sampleError) console.error('[dashboard/notifications] sample customer fetch failed', sampleError)

    // Real per-campaign delivery stats — older campaigns (sent before this
    // table existed) simply have no rows here, so they show no stats badge
    // rather than a misleading "0 delivered".
    const campaignIds = (campaigns ?? []).map((c) => c.id)
    const { data: deliveryRows, error: deliveryRowsError } =
      campaignIds.length > 0
        ? await supabase.from('notification_deliveries').select('campaign_id, status').in('campaign_id', campaignIds)
        : { data: [] as { campaign_id: string | null; status: string }[], error: null }

    if (deliveryRowsError) console.error('[dashboard/notifications] delivery stats fetch failed', deliveryRowsError)

    const statsByCampaign = new Map<string, { success: number; failed: number; uninstalled: number }>()
    for (const row of deliveryRows ?? []) {
      if (!row.campaign_id) continue
      const entry = statsByCampaign.get(row.campaign_id) ?? { success: 0, failed: 0, uninstalled: 0 }
      if (row.status === 'success') entry.success += 1
      else if (row.status === 'uninstalled') entry.uninstalled += 1
      else if (row.status === 'failed') entry.failed += 1
      statsByCampaign.set(row.campaign_id, entry)
    }

    const previewCustomer = sampleCustomer
      ? (() => {
          const [firstName, ...rest] = sampleCustomer.full_name.split(' ')
          return {
            label: sampleCustomer.full_name,
            firstName: firstName || sampleCustomer.full_name,
            lastName: rest.join(' '),
            favoriteCategory: sampleCustomer.customer_purchase_habits?.favorite_category ?? null,
            lastPurchasedCategory: sampleCustomer.customer_purchase_habits?.last_purchased_category ?? null,
            lastTransactionAt: sampleCustomer.customer_purchase_habits?.last_transaction_at ?? null,
            currentStamps: sampleCustomer.loyalty_cards?.[0]?.points_balance ?? 0,
          }
        })()
      : null

    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            Envoyez un message qui apparaît directement sur le Wallet de vos clients.
          </p>
        </div>

        <SendCampaignForm
          recipientCount={recipientCount ?? 0}
          merchantId={merchant.id}
          businessName={merchant.business_name}
          templates={templates ?? []}
          previewCustomer={previewCustomer}
          initialTemplateId={template}
        />

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>Les 10 dernières notifications envoyées.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <ul className="divide-y divide-border">
                {campaigns.map((campaign) => {
                  const stats = statsByCampaign.get(campaign.id)
                  return (
                    <li key={campaign.id} className="py-3 text-sm">
                      <p>{campaign.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleString('fr-FR')} · {campaign.recipient_count} client(s)
                        {campaign.type === 'targeted' && campaign.target_summary && ` · ${campaign.target_summary}`}
                      </p>
                      {stats && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          ✅ {stats.success} reçu(s)
                          {stats.uninstalled > 0 && ` · ❌ ${stats.uninstalled} désinstallation(s)`}
                          {stats.failed > 0 && ` · ⚠️ ${stats.failed} échec(s)`}
                        </p>
                      )}
                    </li>
                  )
                })}
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

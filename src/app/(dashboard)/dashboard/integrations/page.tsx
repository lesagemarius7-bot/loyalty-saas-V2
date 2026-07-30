import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'
import { AutoSendOnPaymentCard } from '@/components/dashboard/settings/auto-send-on-payment-card'
import { PosGuides } from '@/components/dashboard/integrations/pos-guides'
import { WebhookTester } from '@/components/dashboard/integrations/webhook-tester'

export default async function IntegrationsPage() {
  const { merchant, dataClient: supabase } = await getCurrentMerchant()

  try {
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('auto_send_on_payment_enabled, auto_send_channel')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Intégrations</h1>
          <p className="text-muted-foreground">
            Connectez votre terminal de paiement ou logiciel de caisse pour que chaque vente crédite
            automatiquement la carte de fidélité du client, sans QR code à scanner.
          </p>
        </div>

        <AutoSendOnPaymentCard
          apiKey={merchant.api_key}
          initialEnabled={program?.auto_send_on_payment_enabled}
          initialChannel={program?.auto_send_channel}
        />

        <Card>
          <CardHeader>
            <CardTitle>Guides d’intégration POS</CardTitle>
            <CardDescription>
              Étapes pas à pas pour connecter votre terminal de paiement à ce webhook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PosGuides />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Panier détaillé (articles)</CardTitle>
            <CardDescription>
              En plus du montant total, votre caisse peut envoyer le détail des articles vendus (SKU, nom,
              quantité, catégorie) — Loyalty s’en sert pour calculer les catégories préférées de chaque client et
              lui suggérer un prochain article pertinent, affiché au dos de sa carte Wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-w-full overflow-x-auto rounded-md bg-secondary px-3 py-2 text-xs">
{`{
  "customer_email": "client@example.com",
  "transaction_amount": 4.70,
  "items": [
    { "sku": "CROISSANT-BIO", "name": "Croissant Artisanal", "quantity": 2, "price": 1.50, "category": "Viennoiserie" },
    { "sku": "CAFE-ESPRESSO", "name": "Espresso Bio", "quantity": 1, "price": 1.70, "category": "Boissons Chaudes" }
  ]
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tester le webhook</CardTitle>
            <CardDescription>Envoyez une requête réelle pour vérifier que tout est bien branché.</CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookTester apiKey={merchant.api_key} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error('[dashboard/integrations] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger les intégrations"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

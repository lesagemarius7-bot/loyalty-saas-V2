import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LoyaltyCardWithRelations, Merchant, CustomerNotificationInbox } from '@/types'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// The "Mon espace" / "Voir mes offres" link on the back of the Wallet pass —
// same capability-based trust model as /card/[cardId] and
// /api/passes/download/[cardId]: knowing the card id is what proves this is
// your own card, like the QR code printed on it. No login, since the whole
// point is a customer opening this days after a push notification already
// disappeared from their lock screen.
export default async function MyOffersPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params
  const supabase = createServiceRoleClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customer:customers(*), program:loyalty_programs(*)')
    .eq('id', cardId)
    .single<LoyaltyCardWithRelations>()

  if (!card) notFound()

  const { data: merchant } = await supabase.from('merchants').select('*').eq('id', card.merchant_id).single<Merchant>()
  if (!merchant) notFound()

  const { data: inbox } = await supabase
    .from('customer_notifications_inbox')
    .select('*')
    .eq('customer_id', card.customer_id)
    .eq('merchant_id', card.merchant_id)
    .order('created_at', { ascending: false })

  const notifications: CustomerNotificationInbox[] = inbox ?? []
  const now = Date.now()
  const activeOffers = notifications.filter(
    (n) => !n.is_used && (!n.expires_at || new Date(n.expires_at).getTime() > now) && (n.discount || n.offer_code)
  )

  return (
    <div className="min-h-screen bg-secondary/40 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-sm text-muted-foreground">{card.customer.full_name}</p>
          <h1 className="text-2xl font-semibold">{merchant.business_name}</h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes tampons</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {card.program.stamp_icon} {card.points_balance} / {card.program.reward_threshold}
            </p>
            <Badge variant={card.status === 'active' ? 'success' : 'secondary'}>
              {card.points_balance >= card.program.reward_threshold ? 'Récompense prête 🎉' : card.program.reward_description}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bons de réduction actifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune offre active pour le moment.</p>
            ) : (
              activeOffers.map((offer) => (
                <div key={offer.id} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {offer.discount && <p className="font-semibold text-primary">{offer.discount}</p>}
                      <p className="text-sm">{offer.title || offer.message}</p>
                    </div>
                    {offer.offer_code && (
                      <code className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-mono">{offer.offer_code}</code>
                    )}
                  </div>
                  {offer.expires_at && (
                    <p className="mt-1 text-xs text-muted-foreground">Jusqu’au {formatDate(offer.expires_at)}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vous n’avez pas encore reçu de message.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                  <p className="text-muted-foreground">{formatDate(n.created_at)}</p>
                  {n.title && <p className="font-medium">{n.title}</p>}
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="max-w-[400px] text-center text-xs text-muted-foreground">
          Présentez vos bons de réduction en caisse — {merchant.business_name} les valide directement depuis cette page.
        </p>
      </div>
    </div>
  )
}

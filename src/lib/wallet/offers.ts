import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ActiveOffer {
  title: string | null
  message: string
  discount: string | null
  expiresAt: string | null
}

// Up to 3 most recent non-expired, non-redeemed offers for a
// (customer, merchant) pair — shown on the back of the Wallet pass so a
// customer can find their active deal days after the lock-screen push has
// already disappeared. Same 3-item cap the pass backfield and the /my-offers
// hub both use, so what a customer sees in Wallet always matches what a
// fresh page load would show.
export async function getActiveOffers(customerId: string, merchantId: string): Promise<ActiveOffer[]> {
  const supabase = createServiceRoleClient()
  const nowIso = new Date().toISOString()

  const { data } = await supabase
    .from('customer_notifications_inbox')
    .select('title, message, discount, expires_at')
    .eq('customer_id', customerId)
    .eq('merchant_id', merchantId)
    .eq('is_used', false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(3)

  return (data ?? []).map((row) => ({
    title: row.title,
    message: row.message,
    discount: row.discount,
    expiresAt: row.expires_at,
  }))
}

// Shared by the Apple backfield and the Google textModulesData body so the
// exact same line of text shows up on both platforms.
export function formatOfferLine(offer: ActiveOffer): string {
  const base = offer.discount ? `${offer.discount} — ${offer.title ?? offer.message}` : (offer.title ?? offer.message)
  if (!offer.expiresAt) return base
  const formatted = new Date(offer.expiresAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${base} (jusqu'au ${formatted})`
}

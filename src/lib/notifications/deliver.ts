import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage } from '@/lib/wallet/google-wallet'
import { interpolateTemplate } from '@/lib/notifications/interpolate'

type Client = SupabaseClient<Database>

export interface DeliveryCard {
  id: string
  googleObjectId: string | null
  firstName: string
  lastName: string
  favoriteCategory: string | null
  lastPurchasedCategory: string | null
  lastTransactionAt: string | null
  currentStamps: number
}

export interface DeliveryResult {
  cardsUpdated: number
  apple: { configured: boolean; attempted: number }
  google: { configured: boolean; attempted: number }
}

// Shared by /api/campaigns/send (broadcast) and /api/notifications/send-bulk
// (segmented) so template-variable interpolation only lives in one place —
// a merchant composing with {{first_name}} etc. gets the same real
// per-customer substitution regardless of which send flow they used.
export async function deliverToCards(
  supabase: Client,
  cards: DeliveryCard[],
  titleTemplate: string | undefined,
  bodyTemplate: string,
  businessName: string
): Promise<DeliveryResult> {
  const appleConfigured = isAppleWalletConfigured()
  const googleConfigured = isGoogleWalletConfigured()
  const service = createServiceRoleClient()
  const now = new Date().toISOString()

  let cardsUpdated = 0
  let appleAttempted = 0
  let googleAttempted = 0

  for (const card of cards) {
    const ctx = {
      firstName: card.firstName || 'là',
      lastName: card.lastName,
      favoriteCategory: card.favoriteCategory,
      lastPurchasedCategory: card.lastPurchasedCategory,
      lastTransactionAt: card.lastTransactionAt,
      currentStamps: card.currentStamps,
      businessName,
    }
    const personalizedBody = interpolateTemplate(bodyTemplate, ctx)
    const personalizedTitle = titleTemplate ? interpolateTemplate(titleTemplate, ctx) : null
    const combined = personalizedTitle ? `${personalizedTitle} — ${personalizedBody}` : personalizedBody

    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({ last_message: combined, last_message_at: now })
      .eq('id', card.id)

    if (updateError) {
      console.error('[notifications/deliver] failed to update card', card.id, updateError)
      continue
    }
    cardsUpdated += 1

    if (appleConfigured) {
      const { data: registrations } = await service
        .from('apple_wallet_registrations')
        .select('push_token')
        .eq('card_id', card.id)

      appleAttempted += registrations?.length ?? 0
      const results = await Promise.allSettled((registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token)))
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('[notifications/deliver] apple push failed', r.reason)
      })
    }

    if (googleConfigured && card.googleObjectId) {
      googleAttempted += 1
      try {
        await sendGoogleWalletMessage(card.id, personalizedTitle || 'Loyalty', personalizedBody)
      } catch (err) {
        console.error('[notifications/deliver] google message failed', card.id, err)
      }
    }
  }

  return {
    cardsUpdated,
    apple: { configured: appleConfigured, attempted: appleAttempted },
    google: { configured: googleConfigured, attempted: googleAttempted },
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate, ApplePushError } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage, GoogleWalletDeliveryError } from '@/lib/wallet/google-wallet'
import { interpolateTemplate } from '@/lib/notifications/interpolate'

type Client = SupabaseClient<Database>

// Checked by every notification-sending route before it touches the DB —
// with neither wallet configured, deliverToCards would still "succeed"
// (loyalty_cards.last_message gets written, cardsUpdated counts up) while
// never actually pushing to a single device. That silent no-op used to come
// back as a 200 the merchant would read as "sent". Better to fail loudly.
export function isAnyWalletChannelConfigured(): boolean {
  return isAppleWalletConfigured() || isGoogleWalletConfigured()
}

export interface DeliveryCard {
  id: string
  customerId: string
  googleObjectId: string | null
  firstName: string
  lastName: string
  favoriteCategory: string | null
  lastPurchasedCategory: string | null
  lastTransactionAt: string | null
  currentStamps: number
}

interface PlatformStats {
  configured: boolean
  attempted: number
  success: number
  failed: number
  uninstalled: number
}

export interface DeliveryResult {
  cardsUpdated: number
  apple: PlatformStats
  google: PlatformStats
}

function emptyStats(configured: boolean): PlatformStats {
  return { configured, attempted: 0, success: 0, failed: 0, uninstalled: 0 }
}

export interface AttemptOutcome {
  success: boolean
  uninstalled: boolean
}

// A customer can have several Apple device registrations; this reduces their
// individual outcomes to the single status logged for that customer:
// 'success' if any device received it, 'uninstalled' only if every attempt
// came back APNs 410 (all their tokens are dead), 'failed' otherwise. Pulled
// out as a pure function so the status logic can be exercised directly
// against fabricated outcome combinations without real APNs credentials.
export function classifyDeliveryStatus(outcomes: AttemptOutcome[]): 'success' | 'failed' | 'uninstalled' {
  if (outcomes.length === 0) return 'failed'
  if (outcomes.some((o) => o.success)) return 'success'
  if (outcomes.every((o) => o.uninstalled)) return 'uninstalled'
  return 'failed'
}

// Shared by /api/campaigns/send (broadcast) and /api/notifications/send-bulk
// (segmented) so template-variable interpolation and delivery tracking only
// live in one place. Logs one notification_deliveries row per (customer,
// platform) — the table's actual grain — even though a customer can have
// several Apple device registrations: Apple's push is attempted on all of
// them, but "did this customer receive it on Apple" is a single yes/no for
// reporting purposes. A push that comes back 410 Gone (device token dead —
// the customer removed the pass) deletes that registration so future sends
// stop retrying it.
export interface OfferMeta {
  offerCode?: string
  discount?: string
  expiresAt?: string
}

export async function deliverToCards(
  supabase: Client,
  cards: DeliveryCard[],
  titleTemplate: string | undefined,
  bodyTemplate: string,
  businessName: string,
  context: { merchantId: string; campaignId: string | null },
  offer?: OfferMeta
): Promise<DeliveryResult> {
  const appleConfigured = isAppleWalletConfigured()
  const googleConfigured = isGoogleWalletConfigured()
  const service = createServiceRoleClient()
  const now = new Date().toISOString()

  const apple = emptyStats(appleConfigured)
  const google = emptyStats(googleConfigured)
  let cardsUpdated = 0

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

    // Persistent record independent of push success/failure — the point is
    // "the merchant sent this to this customer", which is true whether or
    // not any device happened to receive the lock-screen notification. This
    // is what the pass backfield and /my-offers/[cardId] both read from
    // later, so it can't be conditioned on delivery outcome.
    const { error: inboxError } = await service.from('customer_notifications_inbox').insert({
      customer_id: card.customerId,
      merchant_id: context.merchantId,
      title: personalizedTitle,
      message: personalizedBody,
      offer_code: offer?.offerCode ?? null,
      discount: offer?.discount ?? null,
      expires_at: offer?.expiresAt ?? null,
    })
    if (inboxError) console.error('[notifications/deliver] failed to log inbox entry', card.id, inboxError)

    const deliveryRows: {
      campaign_id: string | null
      merchant_id: string
      customer_id: string
      platform: 'apple' | 'google'
      message_text: string
      status: 'success' | 'failed' | 'uninstalled'
      error_details: string | null
    }[] = []

    if (appleConfigured) {
      const { data: registrations } = await service
        .from('apple_wallet_registrations')
        .select('push_token')
        .eq('card_id', card.id)

      if (registrations && registrations.length > 0) {
        apple.attempted += 1

        const outcomes: AttemptOutcome[] = []
        let lastError: string | null = null
        const staleTokens: string[] = []

        for (const registration of registrations) {
          try {
            await pushAppleWalletUpdate(registration.push_token)
            outcomes.push({ success: true, uninstalled: false })
          } catch (err) {
            const uninstalled = err instanceof ApplePushError && err.uninstalled
            if (uninstalled) staleTokens.push(registration.push_token)
            outcomes.push({ success: false, uninstalled })
            lastError = err instanceof Error ? err.message : String(err)
            console.error('[notifications/deliver] apple push failed', card.id, err)
          }
        }

        if (staleTokens.length > 0) {
          const { error: cleanupError } = await service
            .from('apple_wallet_registrations')
            .delete()
            .eq('card_id', card.id)
            .in('push_token', staleTokens)
          if (cleanupError) console.error('[notifications/deliver] failed to prune stale tokens', card.id, cleanupError)
        }

        const status = classifyDeliveryStatus(outcomes)
        if (status === 'success') apple.success += 1
        else if (status === 'uninstalled') apple.uninstalled += 1
        else apple.failed += 1

        deliveryRows.push({
          campaign_id: context.campaignId,
          merchant_id: context.merchantId,
          customer_id: card.customerId,
          platform: 'apple',
          message_text: combined,
          status,
          error_details: status === 'success' ? null : lastError,
        })
      }
    }

    if (googleConfigured && card.googleObjectId) {
      google.attempted += 1
      try {
        await sendGoogleWalletMessage(card.id, personalizedTitle || 'Loyalty', personalizedBody)
        google.success += 1
        deliveryRows.push({
          campaign_id: context.campaignId,
          merchant_id: context.merchantId,
          customer_id: card.customerId,
          platform: 'google',
          message_text: personalizedBody,
          status: 'success',
          error_details: null,
        })
      } catch (err) {
        const isUninstalled = err instanceof GoogleWalletDeliveryError && err.status === 404
        if (isUninstalled) google.uninstalled += 1
        else google.failed += 1
        console.error('[notifications/deliver] google message failed', card.id, err)
        deliveryRows.push({
          campaign_id: context.campaignId,
          merchant_id: context.merchantId,
          customer_id: card.customerId,
          platform: 'google',
          message_text: personalizedBody,
          status: isUninstalled ? 'uninstalled' : 'failed',
          error_details: err instanceof Error ? err.message : String(err),
        })
      }
    }

    if (deliveryRows.length > 0) {
      const { error: deliveryError } = await service.from('notification_deliveries').insert(deliveryRows)
      if (deliveryError) console.error('[notifications/deliver] failed to log deliveries', card.id, deliveryError)
    }
  }

  return { cardsUpdated, apple, google }
}

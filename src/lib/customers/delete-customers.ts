import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, expireGoogleLoyaltyObject } from '@/lib/wallet/google-wallet'

type Client = SupabaseClient<Database>

export interface DeleteCustomersResult {
  deletedCount: number
  errors: string[]
}

// Shared by DELETE /api/customers/[customerId] (single row, from the trash
// icon) and POST /api/customers/bulk-delete (the floating action bar) — one
// implementation so both paths invalidate wallet passes and scope the delete
// to the caller's own merchant_id identically.
//
// customerIds is filtered through `.eq('merchant_id', merchantId)` on every
// query here, not just trusted from the caller — the API routes pass in
// whatever the client sent, and a customerId belonging to another merchant
// must silently no-op rather than delete (or even reveal the existence of)
// someone else's data.
export async function deleteCustomers(supabase: Client, merchantId: string, customerIds: string[]): Promise<DeleteCustomersResult> {
  if (customerIds.length === 0) return { deletedCount: 0, errors: [] }

  const { data: cards, error: cardsError } = await supabase
    .from('loyalty_cards')
    .select('id, google_object_id')
    .eq('merchant_id', merchantId)
    .in('customer_id', customerIds)

  if (cardsError) {
    return { deletedCount: 0, errors: [cardsError.message] }
  }

  const appleConfigured = isAppleWalletConfigured()
  const googleConfigured = isGoogleWalletConfigured()

  // Best-effort: a push/expire failure (unreachable APNs, expired Google
  // credentials, etc.) must never block the actual deletion — the customer
  // record and its data are the source of truth the merchant is trying to
  // erase; a stale pass on someone's phone is a lesser, separate problem.
  if ((appleConfigured || googleConfigured) && cards && cards.length > 0) {
    const service = createServiceRoleClient()

    await Promise.all(
      cards.map(async (card) => {
        if (appleConfigured) {
          const { data: registrations } = await service
            .from('apple_wallet_registrations')
            .select('push_token')
            .eq('card_id', card.id)

          for (const registration of registrations ?? []) {
            try {
              await pushAppleWalletUpdate(registration.push_token)
            } catch (err) {
              console.error('[delete-customers] apple push failed', card.id, err)
            }
          }
        }

        if (googleConfigured && card.google_object_id) {
          try {
            await expireGoogleLoyaltyObject(card.id)
          } catch (err) {
            console.error('[delete-customers] google expire failed', card.id, err)
          }
        }
      })
    )
  }

  // FK cascades (customers -> loyalty_cards -> transactions /
  // apple_wallet_registrations, plus customer_purchase_habits and
  // notification_deliveries directly on customers) take care of every
  // related table from this one delete.
  const { data: deleted, error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('merchant_id', merchantId)
    .in('id', customerIds)
    .select('id')

  if (deleteError) {
    return { deletedCount: 0, errors: [deleteError.message] }
  }

  return { deletedCount: deleted?.length ?? 0, errors: [] }
}

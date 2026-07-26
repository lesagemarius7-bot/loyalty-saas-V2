import { createServiceRoleClient } from '@/lib/supabase/server'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

// Shared by every route that resolves a public cardId capability into the full
// card + merchant it belongs to (apple/generate, google/generate,
// passes/download) — kept in one place so the join shape and 404 semantics
// can't drift between them.
export async function getCardWithMerchant(
  cardId: string
): Promise<{ card: LoyaltyCardWithRelations; merchant: Merchant } | null> {
  const supabase = createServiceRoleClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customer:customers(*), program:loyalty_programs(*)')
    .eq('id', cardId)
    .single<LoyaltyCardWithRelations>()

  if (!card) return null

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', card.merchant_id)
    .single<Merchant>()

  if (!merchant) return null

  return { card, merchant }
}

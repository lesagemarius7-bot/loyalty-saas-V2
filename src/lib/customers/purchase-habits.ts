import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

// Shared by lib/importers/import-customers.ts (a merchant's own file/API
// import) and lib/payments/process-payment-success.ts (a real POS payment
// webhook) — both are real, merchant-supplied purchase signals, just from
// different sources. Only ever touches the category/date fields, never
// favorite_category (that stays derived from real transaction history by
// recomputePurchaseHabits, not overwritten by a one-off event).
export async function applyPurchasedCategory(
  supabase: Client,
  merchantId: string,
  customerId: string,
  category: string
): Promise<void> {
  const { error } = await supabase.from('customer_purchase_habits').upsert({
    customer_id: customerId,
    merchant_id: merchantId,
    last_purchased_category: category,
    last_transaction_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) console.error('[purchase-habits] failed to apply purchased category', customerId, error)
}

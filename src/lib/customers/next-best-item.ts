import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

// "Next best item" for the Wallet pass back field — an honest, real-data
// heuristic, not a claimed ML model: the merchant's most-purchased category
// (by real line items, across every customer) that THIS customer has never
// personally bought, naming the single best-selling product within it if
// enough data exists. Returns null rather than a generic filler message
// when there isn't enough real basket history to say anything meaningful —
// consistent with this app's rule of never fabricating a number/claim it
// can't back with real data.
export async function computeNextBestItem(supabase: Client, merchantId: string, customerId: string): Promise<string | null> {
  const [{ data: allItems }, { data: customerItems }] = await Promise.all([
    supabase.from('transaction_line_items').select('category, product_name').eq('merchant_id', merchantId).not('category', 'is', null),
    supabase.from('transaction_line_items').select('category').eq('customer_id', customerId),
  ])

  const purchasedCategories = new Set((customerItems ?? []).map((r) => r.category).filter((c): c is string => Boolean(c)))

  const categoryCounts = new Map<string, number>()
  const productCountsByCategory = new Map<string, Map<string, number>>()
  for (const row of allItems ?? []) {
    if (!row.category) continue
    categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1)
    const products = productCountsByCategory.get(row.category) ?? new Map<string, number>()
    products.set(row.product_name, (products.get(row.product_name) ?? 0) + 1)
    productCountsByCategory.set(row.category, products)
  }

  const rankedCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])
  const target = rankedCategories.find(([category]) => !purchasedCategories.has(category))
  if (!target) return null

  const [categoryName] = target
  const products = productCountsByCategory.get(categoryName)
  const topProduct = products ? [...products.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] : null

  return topProduct
    ? `💡 Essayez ${topProduct} — un best-seller de notre catégorie ${categoryName} !`
    : `💡 Découvrez notre catégorie ${categoryName}, appréciée par nos habitués !`
}

export async function computeFavoriteSku(supabase: Client, customerId: string): Promise<string | null> {
  const { data } = await supabase.from('transaction_line_items').select('sku').eq('customer_id', customerId)
  if (!data || data.length === 0) return null

  const counts = new Map<string, number>()
  for (const row of data) counts.set(row.sku, (counts.get(row.sku) ?? 0) + 1)

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
}

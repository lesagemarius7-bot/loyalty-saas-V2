import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database.types'

type Client = SupabaseClient<Database>

function bucketHour(hour: number): 'morning' | 'midday' | 'evening' {
  if (hour < 11) return 'morning'
  if (hour < 15) return 'midday'
  return 'evening'
}

// Only reads a category when a real POS integration actually sent one on
// pos_transaction_events.payload — no fallback/guess, so a customer with no
// real event stays honestly uncategorized rather than showing a fabricated
// category.
function extractCategory(payload: Json): string | null {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'category' in payload) {
    const value = (payload as { category?: unknown }).category
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }
  return null
}

// Derives real behavioral signals from the transactions ledger — every
// "earn" row is a staff scan at checkout, so its timestamp is a genuine visit
// time and its points_delta is a genuine (proportional) basket-size proxy.
// Purchase-category fields (favorite_category / last_purchased_category) are
// only ever set from real pos_transaction_events rows — there is no
// product-level category on the points ledger itself, and simulating one
// would show a merchant fabricated insight about their own customers. Most
// merchants have zero pos_transaction_events today (no real POS connected
// yet — see api/webhooks/pos), so these stay null until one lands.
export async function recomputePurchaseHabits(
  supabase: Client,
  merchantId: string
): Promise<{ customersUpdated: number }> {
  const { data: cards, error: cardsError } = await supabase
    .from('loyalty_cards')
    .select('id, customer_id')
    .eq('merchant_id', merchantId)

  if (cardsError) throw new Error(cardsError.message)
  if (!cards || cards.length === 0) return { customersUpdated: 0 }

  let customersUpdated = 0

  for (const card of cards) {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('created_at, points_delta')
      .eq('card_id', card.id)
      .eq('type', 'earn')
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('[purchase-habits] failed to fetch transactions for card', card.id, txError)
      continue
    }
    if (!transactions || transactions.length === 0) continue

    const bucketCounts: Record<'morning' | 'midday' | 'evening', number> = { morning: 0, midday: 0, evening: 0 }
    for (const t of transactions) {
      bucketCounts[bucketHour(new Date(t.created_at).getHours())] += 1
    }
    // bucketCounts always has exactly the 3 declared keys, so the sorted
    // array is never empty — the non-null assertion just satisfies
    // noUncheckedIndexedAccess.
    const preferredTimeOfDay = (Object.entries(bucketCounts) as [keyof typeof bucketCounts, number][]).sort(
      (a, b) => b[1] - a[1]
    )[0]![0]

    let visitFrequencyDays: number | null = null
    if (transactions.length >= 2) {
      const gapsDays: number[] = []
      for (let i = 1; i < transactions.length; i++) {
        // Loop bounds (1 <= i < length) guarantee both indices are valid.
        const gapMs = new Date(transactions[i]!.created_at).getTime() - new Date(transactions[i - 1]!.created_at).getTime()
        gapsDays.push(gapMs / (1000 * 60 * 60 * 24))
      }
      visitFrequencyDays = gapsDays.reduce((sum, g) => sum + g, 0) / gapsDays.length
    }

    const avgPointsPerVisit = transactions.reduce((sum, t) => sum + t.points_delta, 0) / transactions.length

    const { data: posEvents, error: posError } = await supabase
      .from('pos_transaction_events')
      .select('payload, received_at')
      .eq('customer_id', card.customer_id)
      .order('received_at', { ascending: true })

    if (posError) {
      console.error('[purchase-habits] failed to fetch POS events for customer', card.customer_id, posError)
    }

    let favoriteCategory: string | null = null
    let lastPurchasedCategory: string | null = null
    let lastTransactionAt: string | null = null

    const categorizedEvents = (posEvents ?? [])
      .map((e) => ({ category: extractCategory(e.payload), receivedAt: e.received_at }))
      .filter((e): e is { category: string; receivedAt: string } => e.category !== null)

    if (categorizedEvents.length > 0) {
      const last = categorizedEvents[categorizedEvents.length - 1]!
      lastPurchasedCategory = last.category
      lastTransactionAt = last.receivedAt

      const counts = new Map<string, number>()
      for (const e of categorizedEvents) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
      favoriteCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
    }

    const { error: upsertError } = await supabase.from('customer_purchase_habits').upsert({
      customer_id: card.customer_id,
      merchant_id: merchantId,
      preferred_time_of_day: preferredTimeOfDay,
      visit_frequency_days: visitFrequencyDays,
      avg_points_per_visit: avgPointsPerVisit,
      favorite_category: favoriteCategory,
      last_purchased_category: lastPurchasedCategory,
      last_transaction_at: lastTransactionAt,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      console.error('[purchase-habits] failed to upsert habits for customer', card.customer_id, upsertError)
      continue
    }

    customersUpdated += 1
  }

  return { customersUpdated }
}

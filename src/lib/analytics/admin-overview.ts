import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { PLANS } from '@/lib/billing/plans'

type Client = SupabaseClient<Database>

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export interface AdminOverview {
  merchants: {
    total: number
    active: number
    pocActive: number
    suspended: number
  }
  walletPasses: { total: number }
  engagement: { stampsThisMonth: number; rewardsThisMonth: number }
  deliverability: {
    pushSuccessRatePct: number | null
    pushAttempted: number
    // Resend send outcomes aren't persisted anywhere in this schema (only
    // console.log'd from lib/email/resend.ts) — reporting null with an
    // honest label rather than a fabricated number.
    emailSuccessRatePct: null
  }
  revenue: { projectedMrr: number }
  recentSignups: { id: string; businessName: string; createdAt: string; billingStatus: string }[]
}

// Platform-wide counterpart to lib/analytics/dashboard-overview.ts's
// per-merchant computeDashboardOverview — same source tables
// (loyalty_cards, transactions, notification_deliveries), just aggregated
// across every merchant instead of scoped to one. Uses the service-role
// client (passed in by the caller) since this legitimately needs to read
// every merchant's data, not just the caller's own.
export async function computeAdminOverview(supabase: Client): Promise<AdminOverview> {
  const now = new Date()
  const monthStart = startOfMonth(now)

  const [
    { data: merchants, error: merchantsError },
    { data: walletCards, error: cardsError },
    { data: monthTransactions, error: txError },
    { data: deliveries, error: deliveriesError },
  ] = await Promise.all([
    supabase
      .from('merchants')
      .select('id, business_name, created_at, billing_status, subscription_plan')
      .order('created_at', { ascending: false }),
    supabase.from('loyalty_cards').select('id, apple_pass_updated_at, google_object_id'),
    supabase.from('transactions').select('type').gte('created_at', monthStart.toISOString()),
    supabase.from('notification_deliveries').select('status'),
  ])

  if (merchantsError) console.error('[admin-overview] merchants fetch failed', merchantsError)
  if (cardsError) console.error('[admin-overview] cards fetch failed', cardsError)
  if (txError) console.error('[admin-overview] transactions fetch failed', txError)
  if (deliveriesError) console.error('[admin-overview] deliveries fetch failed', deliveriesError)

  const allMerchants = merchants ?? []
  const total = allMerchants.length
  const active = allMerchants.filter((m) => m.billing_status === 'active').length
  const pocActive = allMerchants.filter((m) => m.billing_status === 'poc_active').length
  const suspended = allMerchants.filter((m) => m.billing_status === 'past_due' || m.billing_status === 'canceled').length

  const walletTotal = (walletCards ?? []).filter((c) => c.apple_pass_updated_at !== null || c.google_object_id !== null).length

  const monthTx = monthTransactions ?? []
  const stampsThisMonth = monthTx.filter((t) => t.type === 'earn').length
  const rewardsThisMonth = monthTx.filter((t) => t.type === 'redeem').length

  const allDeliveries = deliveries ?? []
  const pushAttempted = allDeliveries.length
  const pushSuccess = allDeliveries.filter((d) => d.status === 'success').length
  const pushSuccessRatePct = pushAttempted > 0 ? Math.round((pushSuccess / pushAttempted) * 100) : null

  // "Projeté" — sum of each merchant's assigned plan price, regardless of
  // billing_status (a POC merchant is what they'd pay if/when they convert
  // at their currently-selected plan), not real billed Stripe revenue.
  const projectedMrr = allMerchants.reduce((sum, m) => {
    const plan = PLANS.find((p) => p.id === m.subscription_plan)
    return sum + (plan?.price ?? 0)
  }, 0)

  const recentSignups = allMerchants.slice(0, 5).map((m) => ({
    id: m.id,
    businessName: m.business_name,
    createdAt: m.created_at,
    billingStatus: m.billing_status,
  }))

  return {
    merchants: { total, active, pocActive, suspended },
    walletPasses: { total: walletTotal },
    engagement: { stampsThisMonth, rewardsThisMonth },
    deliverability: { pushSuccessRatePct, pushAttempted, emailSuccessRatePct: null },
    revenue: { projectedMrr },
    recentSignups,
  }
}

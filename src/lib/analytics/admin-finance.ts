import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { PLANS } from '@/lib/billing/plans'

type Client = SupabaseClient<Database>

export interface FinanceProjectionMonth {
  month: string // 'YYYY-MM'
  label: string // 'août 2026'
  mrr: number
  newlyConverted: { businessName: string; plan: string; amount: number }[]
}

export interface AdminFinance {
  currentMrr: number
  currentArr: number
  activeSubscriptions: number
  pocInProgress: number
  pocPotentialMrr: number
  projection: FinanceProjectionMonth[]
}

function planPrice(planId: string) {
  return PLANS.find((p) => p.id === planId)?.price ?? 0
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_LABEL = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

// Projects MRR/ARR forward using only two honest data sources — no
// fabricated growth rate:
//   1. Merchants already billing_status='active' keep paying their current
//      plan every month (no churn modeled — this is a floor, not a
//      guarantee).
//   2. Merchants currently in POC (billing_status='poc_active') are assumed
//      to convert to their selected plan on their real trial-end date
//      (poc_start_date + poc_duration_days), and their price is added to
//      the projection from that month onward. A POC that's already past
//      its trial end (approval still pending a decision) is bucketed into
//      the first projected month rather than dropped or backdated.
export async function computeAdminFinance(supabase: Client, monthsAhead = 6): Promise<AdminFinance> {
  const { data: merchants, error } = await supabase
    .from('merchants')
    .select(
      'id, business_name, approval_status, billing_status, subscription_plan, poc_start_date, poc_duration_days, is_super_admin'
    )

  if (error) console.error('[admin-finance] merchants fetch failed', error)

  // Super admin accounts (e.g. the platform's own "Loyalty" shell account,
  // used to access the backoffice) are not real customers — including one
  // would silently inflate MRR/ARR with revenue that doesn't exist.
  const approved = (merchants ?? []).filter((m) => m.approval_status === 'approved' && !m.is_super_admin)
  const active = approved.filter((m) => m.billing_status === 'active')
  const pocActive = approved.filter((m) => m.billing_status === 'poc_active')

  const currentMrr = active.reduce((sum, m) => sum + planPrice(m.subscription_plan), 0)
  const currentArr = currentMrr * 12

  const pocPotentialMrr = pocActive.reduce((sum, m) => sum + planPrice(m.subscription_plan), 0)

  const now = new Date()
  const firstProjectedMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const months: Date[] = Array.from(
    { length: monthsAhead },
    (_, i) => new Date(firstProjectedMonth.getFullYear(), firstProjectedMonth.getMonth() + i, 1)
  )

  const projection: FinanceProjectionMonth[] = months.map((m) => ({
    month: monthKey(m),
    label: MONTH_LABEL.format(m),
    mrr: currentMrr,
    newlyConverted: [],
  }))

  for (const merchant of pocActive) {
    const conversionDate = new Date(merchant.poc_start_date)
    conversionDate.setDate(conversionDate.getDate() + merchant.poc_duration_days)

    // Clamp anything converting before the first projected month (already
    // overdue) into that first bucket, and anything past the projection
    // window is simply not shown rather than silently dropped from totals —
    // it still won't appear, so this is an honest limit of the horizon, not
    // a data error.
    let bucketIndex = months.findIndex(
      (m) => m.getFullYear() === conversionDate.getFullYear() && m.getMonth() === conversionDate.getMonth()
    )
    if (bucketIndex === -1 && conversionDate < firstProjectedMonth) bucketIndex = 0
    if (bucketIndex === -1) continue

    const amount = planPrice(merchant.subscription_plan)
    for (let i = bucketIndex; i < projection.length; i++) {
      const bucket = projection[i]
      if (!bucket) continue
      bucket.mrr += amount
      if (i === bucketIndex) {
        bucket.newlyConverted.push({
          businessName: merchant.business_name,
          plan: merchant.subscription_plan,
          amount,
        })
      }
    }
  }

  return {
    currentMrr,
    currentArr,
    activeSubscriptions: active.length,
    pocInProgress: pocActive.length,
    pocPotentialMrr,
    projection,
  }
}

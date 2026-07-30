import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { Database } from '@/types/database.types'
import { PLANS } from '@/lib/billing/plans'
import { estimateMonthlyCogs } from '@/lib/billing/cogs'
import { stripe } from '@/lib/stripe/client'

type Client = SupabaseClient<Database>

export interface FinanceProjectionMonth {
  month: string // 'YYYY-MM'
  label: string // 'août 2026'
  mrr: number
  newlyConverted: { businessName: string; plan: string; amount: number }[]
}

export interface UnitEconomics {
  arpu: number
  activePayingCount: number
  logoChurnRatePct: number | null
  revenueChurnEurThisMonth: number
  ltvEstimateEur: number | null
  expansionMrrThisMonth: number
  expansionEvents: { businessName: string; fromPlan: string; toPlan: string; deltaEur: number }[]
  hasHistoricalData: boolean
}

export interface GrossMargin {
  estimatedCogsEur: number
  grossMarginPct: number | null
  pushSentThisMonth: number
}

export interface AdminFinance {
  currentMrr: number
  currentArr: number
  activeSubscriptions: number
  pocInProgress: number
  pocPotentialMrr: number
  projection: FinanceProjectionMonth[]
  unitEconomics: UnitEconomics
  grossMargin: GrossMargin
}

export interface PocHealthEntry {
  merchantId: string
  businessName: string
  plan: string
  pocStartDate: string
  pocDurationDays: number
  daysRemaining: number
  stampsScanned: number
  walletInstalled: boolean
  notificationsConfigured: boolean
  daysSinceLastActivity: number | null
  score: 'high' | 'medium' | 'low'
  weightedMrrEur: number
}

export interface DunningEntry {
  merchantId: string
  businessName: string
  ownerEmail: string | null
  dunningStatus: 'payment_failed' | 'retry_1' | 'suspended'
  hasStripeCustomer: boolean
}

export interface CardExpiringEntry {
  merchantId: string
  businessName: string
  expMonth: number
  expYear: number
}

export interface DunningData {
  failedPayments: DunningEntry[]
  cardsExpiringSoon: CardExpiringEntry[]
  stripeReachable: boolean
}

function planPrice(planId: string) {
  return PLANS.find((p) => p.id === planId)?.price ?? 0
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_LABEL = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// POC health score weights — how much of a POC merchant's plan price counts
// toward the "pipeline MRR pondéré" figure. These are stated assumptions
// (documented, not derived from real conversion history — this app hasn't
// existed long enough to have observed real POC→paid conversion rates by
// score bucket yet), tuned to the spec's "Fort = conversion 90%+".
const HEALTH_WEIGHT: Record<PocHealthEntry['score'], number> = { high: 0.9, medium: 0.4, low: 0.1 }

// Projects MRR/ARR forward using only two honest data sources — no
// fabricated growth rate:
//   1. Merchants already billing_status='active' keep paying their current
//      plan every month (no churn modeled — this is a floor, not a
//      guarantee).
//   2. Merchants currently in POC (billing_status='poc_active') are assumed
//      to convert to their selected plan on their real trial-end date
//      (poc_start_date + poc_duration_days), and their price is added to
//      the projection from that month onward.
// Super admin shell accounts are excluded everywhere — not real customers.
export async function computeAdminFinance(supabase: Client, monthsAhead = 6): Promise<AdminFinance> {
  const now = new Date()
  const monthStart = startOfMonth(now)

  const [{ data: merchants, error }, { data: events }, { data: deliveries }] = await Promise.all([
    supabase
      .from('merchants')
      .select(
        'id, business_name, approval_status, billing_status, subscription_plan, poc_start_date, poc_duration_days, is_super_admin'
      ),
    supabase
      .from('merchant_status_events')
      .select('merchant_id, event_type, from_value, to_value, created_at')
      .gte('created_at', monthStart.toISOString()),
    supabase.from('notification_deliveries').select('id').gte('sent_at', monthStart.toISOString()),
  ])

  if (error) console.error('[admin-finance] merchants fetch failed', error)

  const approved = (merchants ?? []).filter((m) => m.approval_status === 'approved' && !m.is_super_admin)
  const active = approved.filter((m) => m.billing_status === 'active')
  const pocActive = approved.filter((m) => m.billing_status === 'poc_active')

  const currentMrr = active.reduce((sum, m) => sum + planPrice(m.subscription_plan), 0)
  const currentArr = currentMrr * 12
  const pocPotentialMrr = pocActive.reduce((sum, m) => sum + planPrice(m.subscription_plan), 0)

  // --- Projection -----------------------------------------------------
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
        bucket.newlyConverted.push({ businessName: merchant.business_name, plan: merchant.subscription_plan, amount })
      }
    }
  }

  // --- Unit economics ---------------------------------------------------
  const allEvents = events ?? []
  const cancelEvents = allEvents.filter((e) => e.event_type === 'billing_status_changed' && e.to_value === 'canceled')
  const planChangeEvents = allEvents.filter((e) => e.event_type === 'plan_changed')

  const merchantById = new Map(approved.map((m) => [m.id, m]))

  const revenueChurnEurThisMonth = cancelEvents.reduce((sum, e) => {
    // from_value holds the billing_status before cancellation, not the plan
    // — the plan they were paying is read from the merchant's current
    // subscription_plan (unaffected by a billing_status change).
    const merchant = merchantById.get(e.merchant_id)
    return sum + (merchant ? planPrice(merchant.subscription_plan) : 0)
  }, 0)

  // Approximates "active at the start of the month" as today's active count
  // plus whoever churned out during the month — the only baseline
  // reconstructible without a daily MRR snapshot table.
  const baselineActive = active.length + cancelEvents.length
  const logoChurnRatePct = baselineActive > 0 ? Math.round((cancelEvents.length / baselineActive) * 1000) / 10 : null

  const arpu = active.length > 0 ? Math.round((currentMrr / active.length) * 100) / 100 : 0
  const ltvEstimateEur = logoChurnRatePct !== null && logoChurnRatePct > 0 ? Math.round(arpu / (logoChurnRatePct / 100)) : null

  const expansionEvents = planChangeEvents
    .map((e) => {
      const merchant = merchantById.get(e.merchant_id)
      const fromPrice = e.from_value ? planPrice(e.from_value) : 0
      const toPrice = planPrice(e.to_value)
      return {
        businessName: merchant?.business_name ?? 'Commerçant supprimé',
        fromPlan: e.from_value ?? '—',
        toPlan: e.to_value,
        deltaEur: toPrice - fromPrice,
      }
    })
    .filter((e) => e.deltaEur > 0)

  const expansionMrrThisMonth = expansionEvents.reduce((sum, e) => sum + e.deltaEur, 0)

  const unitEconomics: UnitEconomics = {
    arpu,
    activePayingCount: active.length,
    logoChurnRatePct,
    revenueChurnEurThisMonth,
    ltvEstimateEur,
    expansionMrrThisMonth,
    expansionEvents,
    hasHistoricalData: allEvents.length > 0,
  }

  // --- Gross margin -------------------------------------------------------
  const pushSentThisMonth = (deliveries ?? []).length
  const estimatedCogsEur = estimateMonthlyCogs(pushSentThisMonth)
  const grossMargin: GrossMargin = {
    estimatedCogsEur,
    grossMarginPct: currentMrr > 0 ? Math.round(((currentMrr - estimatedCogsEur) / currentMrr) * 1000) / 10 : null,
    pushSentThisMonth,
  }

  return {
    currentMrr,
    currentArr,
    activeSubscriptions: active.length,
    pocInProgress: pocActive.length,
    pocPotentialMrr,
    projection,
    unitEconomics,
    grossMargin,
  }
}

function scorePoc(params: {
  stampsScanned: number
  walletInstalled: boolean
  notificationsConfigured: boolean
  daysSinceLastActivity: number | null
}): PocHealthEntry['score'] {
  const { stampsScanned, walletInstalled, notificationsConfigured, daysSinceLastActivity } = params
  if (daysSinceLastActivity === null || daysSinceLastActivity > 7) return 'low'
  if (stampsScanned > 15 && notificationsConfigured && walletInstalled) return 'high'
  return 'medium'
}

// Computed live from real activity signals on every read — deliberately not
// cached on the merchant row (see migration 0019's header comment): a POC
// merchant's health can change every time they scan a stamp, so a cached
// column would be wrong the moment it's read on a slow day.
export async function computePocHealth(supabase: Client): Promise<PocHealthEntry[]> {
  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, business_name, subscription_plan, poc_start_date, poc_duration_days, approval_status, billing_status, is_super_admin')
    .eq('approval_status', 'approved')
    .eq('billing_status', 'poc_active')
    .eq('is_super_admin', false)

  const pocMerchants = merchants ?? []
  if (pocMerchants.length === 0) return []

  const ids = pocMerchants.map((m) => m.id)
  const now = new Date()

  const [{ data: cards }, { data: earnTx }, { data: programs }] = await Promise.all([
    supabase.from('loyalty_cards').select('merchant_id, apple_pass_updated_at, google_object_id, last_visit_at').in('merchant_id', ids),
    supabase.from('transactions').select('merchant_id, created_at').eq('type', 'earn').in('merchant_id', ids),
    supabase.from('loyalty_programs').select('merchant_id, inactivity_reminder_enabled, smart_engagement_enabled').in('merchant_id', ids),
  ])

  return pocMerchants.map((merchant) => {
    const merchantCards = (cards ?? []).filter((c) => c.merchant_id === merchant.id)
    const walletInstalled = merchantCards.some((c) => c.apple_pass_updated_at !== null || c.google_object_id !== null)

    const pocStart = new Date(merchant.poc_start_date)
    const stampsScanned = (earnTx ?? []).filter((t) => t.merchant_id === merchant.id && new Date(t.created_at) >= pocStart).length

    const notificationsConfigured = (programs ?? []).some(
      (p) => p.merchant_id === merchant.id && (p.inactivity_reminder_enabled || p.smart_engagement_enabled)
    )

    const lastVisitDates = merchantCards.map((c) => c.last_visit_at).filter((d): d is string => d !== null)
    const referenceDate = lastVisitDates.length > 0 ? new Date(Math.max(...lastVisitDates.map((d) => new Date(d).getTime()))) : null
    const daysSinceLastActivity = referenceDate
      ? Math.floor((now.getTime() - referenceDate.getTime()) / 86_400_000)
      : Math.floor((now.getTime() - pocStart.getTime()) / 86_400_000)

    const score = scorePoc({ stampsScanned, walletInstalled, notificationsConfigured, daysSinceLastActivity })
    const daysRemaining = Math.max(
      0,
      merchant.poc_duration_days - Math.floor((now.getTime() - pocStart.getTime()) / 86_400_000)
    )

    return {
      merchantId: merchant.id,
      businessName: merchant.business_name,
      plan: merchant.subscription_plan,
      pocStartDate: merchant.poc_start_date,
      pocDurationDays: merchant.poc_duration_days,
      daysRemaining,
      stampsScanned,
      walletInstalled,
      notificationsConfigured,
      daysSinceLastActivity,
      score,
      weightedMrrEur: Math.round(planPrice(merchant.subscription_plan) * HEALTH_WEIGHT[score] * 100) / 100,
    }
  })
}

// Card-expiry check hits the real Stripe API — only meaningful once real
// subscriptions with a stripe_customer_id exist. A single lightweight probe
// call decides stripeReachable up front so a misconfigured/placeholder key
// (this app's current production state — no real billing is live yet)
// fails once and cleanly, instead of once per merchant with a stripe
// customer id.
export async function computeDunningData(supabase: Client): Promise<DunningData> {
  const { data: flagged } = await supabase
    .from('merchants')
    .select('id, business_name, owner_id, dunning_status, stripe_customer_id')
    .neq('dunning_status', 'ok')
    .eq('is_super_admin', false)

  const failedPayments: DunningEntry[] = []
  for (const merchant of flagged ?? []) {
    const { data: ownerData } = await supabase.auth.admin.getUserById(merchant.owner_id)
    failedPayments.push({
      merchantId: merchant.id,
      businessName: merchant.business_name,
      ownerEmail: ownerData.user?.email ?? null,
      dunningStatus: merchant.dunning_status as DunningEntry['dunningStatus'],
      hasStripeCustomer: merchant.stripe_customer_id !== null,
    })
  }

  const { data: withStripeCustomer } = await supabase
    .from('merchants')
    .select('id, business_name, stripe_customer_id')
    .not('stripe_customer_id', 'is', null)
    .eq('is_super_admin', false)

  const cardsExpiringSoon: CardExpiringEntry[] = []
  let stripeReachable = true

  if (withStripeCustomer && withStripeCustomer.length > 0) {
    try {
      await stripe.customers.list({ limit: 1 })
    } catch (err) {
      console.error('[admin-finance] Stripe unreachable — skipping card-expiry checks', err)
      stripeReachable = false
    }

    if (stripeReachable) {
      const now = new Date()
      const in30Days = new Date(now.getTime() + 30 * 86_400_000)

      for (const merchant of withStripeCustomer) {
        try {
          const customer = await stripe.customers.retrieve(merchant.stripe_customer_id!, {
            expand: ['invoice_settings.default_payment_method'],
          })
          if (customer.deleted) continue
          const pm = (customer as Stripe.Customer).invoice_settings?.default_payment_method
          const card = typeof pm === 'object' && pm !== null ? pm.card : null
          if (!card) continue

          const expiryDate = new Date(card.exp_year, card.exp_month - 1, 1)
          if (expiryDate <= in30Days) {
            cardsExpiringSoon.push({
              merchantId: merchant.id,
              businessName: merchant.business_name,
              expMonth: card.exp_month,
              expYear: card.exp_year,
            })
          }
        } catch (err) {
          console.error(`[admin-finance] card-expiry check failed for merchant ${merchant.id}`, err)
        }
      }
    }
  }

  return { failedPayments, cardsExpiringSoon, stripeReachable }
}

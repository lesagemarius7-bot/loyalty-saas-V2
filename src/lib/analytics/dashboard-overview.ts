import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Merchant } from '@/types'

type Client = SupabaseClient<Database>

const INACTIVITY_DAYS = 21
const WEEKDAY_WINDOW_DAYS = 90
const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export interface DashboardOverview {
  kpis: {
    activeWalletPasses: { value: number; trendPct: number | null }
    stampsThisMonth: { value: number; trendPct: number | null }
    rewardsRedeemedThisMonth: { value: number; retentionRatePct: number | null }
    estimatedRevenue: { value: number | null; avgBasketConfigured: boolean }
  }
  quickActions: {
    inactiveCustomersCount: number
    quietestWeekday: { dayIndex: number; label: string } | null
  }
  charts: {
    walletInstallsByDay: { date: string; count: number }[]
    visitsByWeekday: { dayIndex: number; label: string; count: number }[]
  }
  recentActivity: RecentActivityEvent[]
  onboarding: { hasAnyCustomers: boolean; hasAnyTransactions: boolean }
}

export interface RecentActivityEvent {
  id: string
  type: 'stamp' | 'reward' | 'wallet_install'
  message: string
  occurredAt: string
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfPreviousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

// Aggregates every KPI/chart/feed the /dashboard overview page and
// /api/dashboard/overview route need, in one place, so the two callers can't
// drift. `windowDays` only controls the wallet-install chart resolution (7 /
// 30 / 90) — every other metric is a fixed calendar-month or 90-day window,
// since those are what the KPI copy itself promises ("ce mois-ci").
export async function computeDashboardOverview(
  supabase: Client,
  merchant: Merchant,
  windowDays: number
): Promise<DashboardOverview> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const prevMonthStart = startOfPreviousMonth(now)
  const inactivityCutoff = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000)
  const weekdayWindowStart = new Date(now.getTime() - WEEKDAY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const chartWindowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  const [
    { count: customerCount, error: customerCountError },
    { data: activeCards, error: cardsError },
    { data: monthTransactions, error: monthTxError },
    { data: prevMonthEarnTx, error: prevMonthTxError },
    { data: weekdayTransactions, error: weekdayTxError },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase
      .from('loyalty_cards')
      .select('id, created_at, last_visit_at, apple_pass_updated_at, google_object_id, status')
      .eq('merchant_id', merchant.id)
      .eq('status', 'active'),
    supabase
      .from('transactions')
      .select(
        'id, type, points_delta, created_at, card_id, loyalty_cards(customer:customers(full_name), program:loyalty_programs(reward_description))'
      )
      .eq('merchant_id', merchant.id)
      .gte('created_at', monthStart.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('type', 'earn')
      .gte('created_at', prevMonthStart.toISOString())
      .lt('created_at', monthStart.toISOString()),
    supabase
      .from('transactions')
      .select('created_at')
      .eq('merchant_id', merchant.id)
      .eq('type', 'earn')
      .gte('created_at', weekdayWindowStart.toISOString()),
  ])

  if (customerCountError) console.error('[dashboard-overview] customer count failed', customerCountError)
  if (cardsError) console.error('[dashboard-overview] cards fetch failed', cardsError)
  if (monthTxError) console.error('[dashboard-overview] month transactions fetch failed', monthTxError)
  if (prevMonthTxError) console.error('[dashboard-overview] previous month transactions fetch failed', prevMonthTxError)
  if (weekdayTxError) console.error('[dashboard-overview] weekday transactions fetch failed', weekdayTxError)

  const cards = activeCards ?? []
  const monthTx = monthTransactions ?? []
  const monthEarnTx = monthTx.filter((t) => t.type === 'earn')
  const monthRedeemTx = monthTx.filter((t) => t.type === 'redeem')

  // -- Active wallet passes -------------------------------------------------
  const walletCards = cards.filter((c) => c.apple_pass_updated_at !== null || c.google_object_id !== null)
  const activeWalletPasses = walletCards.length
  // No dedicated "wallet installed at" column exists, so growth is
  // approximated from card creation date — real for cards created this
  // month, an honest proxy otherwise (see also apple-pass.ts's own
  // last-updated-vs-installed caveat).
  const walletCardsBeforeThisMonth = walletCards.filter((c) => new Date(c.created_at) < monthStart).length
  const walletTrendPct =
    walletCardsBeforeThisMonth === 0
      ? activeWalletPasses > 0
        ? 100
        : null
      : percentChange(activeWalletPasses, walletCardsBeforeThisMonth)

  // -- Stamps this month ------------------------------------------------------
  const stampsThisMonth = monthEarnTx.length
  const stampsLastMonth = (prevMonthEarnTx ?? []).length
  const stampsTrendPct = percentChange(stampsThisMonth, stampsLastMonth)

  // -- Rewards redeemed + retention -------------------------------------------
  const rewardsRedeemedThisMonth = monthRedeemTx.length
  // Each loyalty_card belongs to exactly one customer, so counting distinct
  // card_ids here is equivalent to counting distinct customers — no extra
  // join needed just to compute retention.
  const earnByCard = new Map<string, number>()
  for (const t of monthEarnTx) {
    earnByCard.set(t.card_id, (earnByCard.get(t.card_id) ?? 0) + 1)
  }
  const activeCustomersThisMonth = earnByCard.size
  const returningCustomersThisMonth = [...earnByCard.values()].filter((n) => n >= 2).length
  const retentionRatePct =
    activeCustomersThisMonth > 0 ? Math.round((returningCustomersThisMonth / activeCustomersThisMonth) * 100) : null

  // -- Estimated revenue --------------------------------------------------
  const avgBasketConfigured = merchant.avg_basket_value !== null && merchant.avg_basket_value > 0
  const estimatedRevenue = avgBasketConfigured ? Math.round((merchant.avg_basket_value as number) * stampsThisMonth) : null

  // -- Quick actions --------------------------------------------------------
  const inactiveCustomersCount = cards.filter((c) => {
    const reference = new Date(c.last_visit_at ?? c.created_at)
    return reference < inactivityCutoff
  }).length

  const weekdayCounts = new Array(7).fill(0)
  for (const t of weekdayTransactions ?? []) {
    weekdayCounts[new Date(t.created_at).getDay()] += 1
  }
  const visitsByWeekday = weekdayCounts.map((count, dayIndex) => ({ dayIndex, label: WEEKDAY_LABELS[dayIndex]!, count }))
  const hasEnoughWeekdayData = weekdayCounts.some((n) => n > 0)
  const quietestWeekday = hasEnoughWeekdayData
    ? visitsByWeekday.reduce((min, day) => (day.count < min.count ? day : min))
    : null

  // -- Wallet install chart ---------------------------------------------------
  const installDayBuckets = new Map<string, number>()
  for (const card of walletCards) {
    if (new Date(card.created_at) < chartWindowStart) continue
    const key = dayKey(card.created_at)
    installDayBuckets.set(key, (installDayBuckets.get(key) ?? 0) + 1)
  }
  const walletInstallsByDay: { date: string; count: number }[] = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = dayKey(d.toISOString())
    walletInstallsByDay.push({ date: key, count: installDayBuckets.get(key) ?? 0 })
  }

  // -- Recent activity feed -------------------------------------------------
  const stampEvents: RecentActivityEvent[] = monthEarnTx.slice(0, 10).map((t) => ({
    id: `tx-${t.id}`,
    type: 'stamp' as const,
    message: `${t.loyalty_cards?.customer?.full_name ?? 'Un client'} a gagné un tampon`,
    occurredAt: t.created_at,
  }))
  const rewardEvents: RecentActivityEvent[] = monthRedeemTx.slice(0, 10).map((t) => ({
    id: `tx-${t.id}`,
    type: 'reward' as const,
    message: `${t.loyalty_cards?.customer?.full_name ?? 'Un client'} a récupéré sa récompense${
      t.loyalty_cards?.program?.reward_description ? ` (${t.loyalty_cards.program.reward_description})` : ''
    }`,
    occurredAt: t.created_at,
  }))
  // Apple gives a real per-update timestamp; Google's Wallet Objects API has no
  // equivalent, so a google-only install falls back to the card's creation
  // date — the best timestamp actually available, not a fabricated one.
  const installEvents: RecentActivityEvent[] = cards
    .filter((c) => c.apple_pass_updated_at !== null || c.google_object_id !== null)
    .map((c) => ({
      id: `install-${c.id}`,
      type: 'wallet_install' as const,
      provider: c.apple_pass_updated_at !== null ? 'Apple' : 'Google',
      occurredAt: c.apple_pass_updated_at ?? c.created_at,
    }))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      type: c.type,
      message: `Une carte ${c.provider} Wallet a été installée`,
      occurredAt: c.occurredAt,
    }))

  const recentActivity = [...stampEvents, ...rewardEvents, ...installEvents]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10)

  return {
    kpis: {
      activeWalletPasses: { value: activeWalletPasses, trendPct: walletTrendPct },
      stampsThisMonth: { value: stampsThisMonth, trendPct: stampsTrendPct },
      rewardsRedeemedThisMonth: { value: rewardsRedeemedThisMonth, retentionRatePct },
      estimatedRevenue: { value: estimatedRevenue, avgBasketConfigured },
    },
    quickActions: {
      inactiveCustomersCount,
      quietestWeekday: quietestWeekday ? { dayIndex: quietestWeekday.dayIndex, label: quietestWeekday.label } : null,
    },
    charts: { walletInstallsByDay, visitsByWeekday },
    recentActivity,
    onboarding: { hasAnyCustomers: (customerCount ?? 0) > 0, hasAnyTransactions: monthTx.length > 0 },
  }
}

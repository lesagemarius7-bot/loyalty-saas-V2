import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

export interface AdminMerchantSummary {
  id: string
  businessName: string
  ownerName: string | null
  ownerEmail: string | null
  phone: string | null
  createdAt: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  billingStatus: 'poc_active' | 'active' | 'past_due' | 'canceled'
  subscriptionPlan: string
  pocDaysRemaining: number | null
  customerCount: number
  walletCardCount: number
  lastActivityAt: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

// Powers both /admin/merchants and GET /api/admin/merchants — one place to
// build the (merchant, customer count, wallet card count, last activity)
// join so the table and the API can't drift. Owner email comes from
// auth.users (not stored on merchants at all), fetched once via
// listUsers() and mapped by id rather than one admin.getUserById() call per
// merchant — avoids an N+1 as the merchant count grows.
export async function listAdminMerchants(supabase: Client): Promise<AdminMerchantSummary[]> {
  const [{ data: merchants, error: merchantsError }, { data: customers }, { data: cards }, usersResult] =
    await Promise.all([
      supabase
        .from('merchants')
        .select(
          'id, owner_id, business_name, owner_name, phone, created_at, approval_status, poc_start_date, poc_duration_days, billing_status, subscription_plan'
        )
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('merchant_id'),
      supabase.from('loyalty_cards').select('merchant_id, apple_pass_updated_at, google_object_id, last_visit_at'),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ])

  if (merchantsError) console.error('[admin-merchants-list] merchants fetch failed', merchantsError)
  if (usersResult.error) console.error('[admin-merchants-list] listUsers failed', usersResult.error)

  const emailByUserId = new Map(usersResult.data?.users.map((u) => [u.id, u.email ?? null]) ?? [])

  const customerCountByMerchant = new Map<string, number>()
  for (const c of customers ?? []) {
    customerCountByMerchant.set(c.merchant_id, (customerCountByMerchant.get(c.merchant_id) ?? 0) + 1)
  }

  const walletCountByMerchant = new Map<string, number>()
  const lastActivityByMerchant = new Map<string, string>()
  for (const c of cards ?? []) {
    if (c.apple_pass_updated_at !== null || c.google_object_id !== null) {
      walletCountByMerchant.set(c.merchant_id, (walletCountByMerchant.get(c.merchant_id) ?? 0) + 1)
    }
    if (c.last_visit_at) {
      const existing = lastActivityByMerchant.get(c.merchant_id)
      if (!existing || c.last_visit_at > existing) lastActivityByMerchant.set(c.merchant_id, c.last_visit_at)
    }
  }

  const now = Date.now()

  return (merchants ?? []).map((m) => {
    const pocEndMs = new Date(m.poc_start_date).getTime() + m.poc_duration_days * DAY_MS
    const pocDaysRemaining = m.billing_status === 'poc_active' ? Math.max(0, Math.ceil((pocEndMs - now) / DAY_MS)) : null

    return {
      id: m.id,
      businessName: m.business_name,
      ownerName: m.owner_name,
      ownerEmail: emailByUserId.get(m.owner_id) ?? null,
      phone: m.phone,
      createdAt: m.created_at,
      approvalStatus: m.approval_status,
      billingStatus: m.billing_status,
      subscriptionPlan: m.subscription_plan,
      pocDaysRemaining,
      customerCount: customerCountByMerchant.get(m.id) ?? 0,
      walletCardCount: walletCountByMerchant.get(m.id) ?? 0,
      lastActivityAt: lastActivityByMerchant.get(m.id) ?? null,
    }
  })
}

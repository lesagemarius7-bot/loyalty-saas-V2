import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { Merchant } from '@/types'

// Service-role lookup, not the session client — the point is checking the
// real is_super_admin flag without depending on any RLS policy for it (this
// project's live RLS state has already proven, in the merchants-insert
// signup bug, to not always match what's committed in migrations — this
// sidesteps that class of problem entirely by never relying on RLS for
// authorization here).
async function getSuperAdminMerchant(): Promise<Merchant | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const service = createServiceRoleClient()
  const { data: merchant } = await service.from('merchants').select('*').eq('owner_id', user.id).maybeSingle()

  if (!merchant || !merchant.is_super_admin) return null
  return merchant
}

// For Server Components / pages under (admin) — redirects rather than
// rendering an error page, since a merchant landing on /admin by mistake
// (typo, stale bookmark) should just end up back on their own dashboard.
export async function requireSuperAdmin(): Promise<Merchant> {
  const merchant = await getSuperAdminMerchant()
  if (!merchant) redirect('/dashboard')
  return merchant
}

// For Route Handlers under /api/admin/* — returns a 403 JSON response
// instead of redirecting (redirect() is a Server Component/Action
// mechanism, not meaningful from a route handler's perspective for an API
// caller).
export async function requireSuperAdminApi(): Promise<{ merchant: Merchant } | { response: NextResponse }> {
  const merchant = await getSuperAdminMerchant()
  if (!merchant) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { merchant }
}

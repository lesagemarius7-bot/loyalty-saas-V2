import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { computeAdminFinance, computePocHealth } from '@/lib/analytics/admin-finance'

export async function GET() {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const service = createServiceRoleClient()
  const [finance, pocHealth] = await Promise.all([computeAdminFinance(service), computePocHealth(service)])
  return NextResponse.json({ ...finance, pocHealth })
}

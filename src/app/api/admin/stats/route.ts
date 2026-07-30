import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { computeAdminOverview } from '@/lib/analytics/admin-overview'

export async function GET() {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const service = createServiceRoleClient()
  const overview = await computeAdminOverview(service)
  return NextResponse.json(overview)
}

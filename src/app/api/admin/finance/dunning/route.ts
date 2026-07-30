import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { computeDunningData } from '@/lib/analytics/admin-finance'

export async function GET() {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const service = createServiceRoleClient()
  const dunning = await computeDunningData(service)
  return NextResponse.json(dunning)
}

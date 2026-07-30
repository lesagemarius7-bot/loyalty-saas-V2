import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { listAdminMerchants } from '@/lib/analytics/admin-merchants-list'

export async function GET() {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const service = createServiceRoleClient()
  const merchants = await listAdminMerchants(service)
  return NextResponse.json({ merchants })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { computeDashboardOverview } from '@/lib/analytics/dashboard-overview'

const ALLOWED_WINDOWS = [7, 30, 90]

// Backs the wallet-install chart's 7/30/90-day toggle on /dashboard — the
// initial page load renders server-side with the 30-day default (see
// dashboard/page.tsx), this route is what the client hits when the merchant
// switches windows without a full page reload.
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { merchantId, dataClient } = await resolveMerchantId(supabase, user.id)
  if (!merchantId) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const { data: merchant, error: merchantError } = await dataClient.from('merchants').select('*').eq('id', merchantId).maybeSingle()

  if (merchantError) {
    return NextResponse.json({ error: merchantError.message }, { status: 500 })
  }
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const requestedWindow = Number(new URL(request.url).searchParams.get('days'))
  const windowDays = ALLOWED_WINDOWS.includes(requestedWindow) ? requestedWindow : 30

  try {
    const overview = await computeDashboardOverview(dataClient, merchant, windowDays)
    return NextResponse.json(overview)
  } catch (err) {
    console.error('[api/dashboard/overview] failed', err)
    return NextResponse.json(
      { error: "Impossible de calculer la vue d'ensemble.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

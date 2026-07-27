import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { recomputePurchaseHabits } from '@/lib/analytics/purchase-habits'

// Vercel Functions default to 10s on Hobby — a daily pass over every
// merchant's full transaction history needs more room.
export const maxDuration = 60

// Refreshes customer_purchase_habits for every merchant from real transaction
// data — feeds the smart-engagement arbitration engine (step D). Runs before
// that cron in vercel.json so the day's arbitration decisions use same-day
// fresh habits.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: merchants, error: merchantsError } = await supabase.from('merchants').select('id')
    if (merchantsError) {
      return NextResponse.json({ error: merchantsError.message }, { status: 500 })
    }

    let customersUpdated = 0
    for (const merchant of merchants ?? []) {
      try {
        const result = await recomputePurchaseHabits(supabase, merchant.id)
        customersUpdated += result.customersUpdated
      } catch (err) {
        console.error('[cron/compute-purchase-habits] failed for merchant', merchant.id, err)
      }
    }

    return NextResponse.json({ ok: true, merchantsProcessed: merchants?.length ?? 0, customersUpdated })
  } catch (err) {
    console.error('[cron/compute-purchase-habits] failed', err)
    return NextResponse.json(
      { error: 'Cron failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

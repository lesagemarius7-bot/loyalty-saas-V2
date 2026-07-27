import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database.types'

const bodySchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  source: z.string().min(1).default('unknown'),
  payload: z.record(z.string(), z.unknown()),
})

// Not wired to any real POS/Stripe product-level provider yet — no such
// integration exists. This is a landing zone: a future real webhook (Square,
// Stripe Terminal, a till system, whatever gets connected) has somewhere to
// send raw line-item events without another migration, and
// /api/cron/compute-purchase-habits can be extended later to read from
// pos_transaction_events instead of only the points ledger once that data
// exists. Protected by a shared secret since, unlike Stripe's own webhooks,
// there's no per-provider signature scheme to verify here.
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!process.env.POS_WEBHOOK_SECRET || authHeader !== `Bearer ${process.env.POS_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { error } = await supabase.from('pos_transaction_events').insert({
      merchant_id: parsed.data.merchantId,
      customer_id: parsed.data.customerId ?? null,
      source: parsed.data.source,
      // zod validates this is a plain string-keyed record of JSON-safe
      // values at runtime; the cast just bridges that to the generated Json
      // union, which TS can't infer from z.unknown() on its own.
      payload: parsed.data.payload as Json,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhooks/pos] failed', err)
    return NextResponse.json(
      { error: "Impossible de traiter l'événement.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

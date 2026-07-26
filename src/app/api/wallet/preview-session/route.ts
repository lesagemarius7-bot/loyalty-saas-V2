import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { previewPayloadSchema } from '@/lib/wallet/preview-card'

// Called (debounced) from the /dashboard/card-design form on every edit. Persists
// the draft so the "scan to test on your phone" QR code — which loads on a device
// with no dashboard session — can render a wallet pass that reflects live,
// possibly-unsaved changes. One row per merchant, upserted in place.
export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: merchant } = await supabase.from('merchants').select('id').eq('owner_id', user.id).single()

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const parsed = previewPayloadSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabase
    .from('card_preview_sessions')
    .upsert({ merchant_id: merchant.id, payload: parsed.data, updated_at: new Date().toISOString() })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

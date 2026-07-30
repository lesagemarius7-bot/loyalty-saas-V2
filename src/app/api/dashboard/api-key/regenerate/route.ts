import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { generateApiKey } from '@/lib/billing/api-keys'

// Regenerating immediately invalidates the old key — any POS/checkout
// integration still using it starts getting 401s from
// /api/webhooks/payments/success and /api/webhooks/customers/sync until
// reconfigured with the new one. The confirm step lives client-side (see
// AutoSendOnPaymentCard) since this route has no way to know whether a real
// integration is currently wired to the old key.
export async function POST() {
  try {
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

    const apiKey = generateApiKey()
    const { error } = await dataClient.from('merchants').update({ api_key: apiKey }).eq('id', merchantId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apiKey })
  } catch (err) {
    console.error('[dashboard/api-key/regenerate] failed', err)
    return NextResponse.json(
      { error: 'Impossible de régénérer la clé.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

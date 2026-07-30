import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'

const bodySchema = z.object({ merchantId: z.string().uuid() })

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceRoleClient()
  const { data: merchant } = await service
    .from('merchants')
    .select('id, billing_status')
    .eq('id', parsed.data.merchantId)
    .maybeSingle()

  if (!merchant) {
    return NextResponse.json({ error: 'Commerçant introuvable.' }, { status: 404 })
  }

  const { error } = await service
    .from('merchants')
    .update({ billing_status: 'canceled', dunning_status: 'suspended' })
    .eq('id', merchant.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (merchant.billing_status !== 'canceled') {
    await service.from('merchant_status_events').insert({
      merchant_id: merchant.id,
      event_type: 'billing_status_changed',
      from_value: merchant.billing_status,
      to_value: 'canceled',
    })
  }

  return NextResponse.json({ ok: true })
}

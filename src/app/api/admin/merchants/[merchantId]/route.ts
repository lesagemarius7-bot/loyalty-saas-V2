import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { PLANS, type PlanId } from '@/lib/billing/plans'
import type { Merchant } from '@/types'

const PLAN_IDS = PLANS.map((p) => p.id) as [PlanId, ...PlanId[]]

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('extend_poc'), extraDays: z.number().int().min(1).max(365) }),
  z.object({ action: z.literal('change_plan'), plan: z.enum(PLAN_IDS) }),
  // billing_status has no literal 'suspended' value in this schema — the
  // closest real status for "access should stop" is 'canceled'; 'active'
  // maps directly. Mapped explicitly below rather than writing a
  // non-existent enum value.
  z.object({ action: z.literal('toggle_status'), status: z.enum(['active', 'suspended']) }),
])

export async function PATCH(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  try {
    const { merchantId } = await params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = createServiceRoleClient()
    const { data: merchant } = await service
      .from('merchants')
      .select('id, poc_duration_days')
      .eq('id', merchantId)
      .maybeSingle()

    if (!merchant) {
      return NextResponse.json({ error: 'Commerçant introuvable.' }, { status: 404 })
    }

    let update: Partial<Merchant>
    switch (parsed.data.action) {
      case 'extend_poc':
        update = { poc_duration_days: merchant.poc_duration_days + parsed.data.extraDays }
        break
      case 'change_plan':
        update = { subscription_plan: parsed.data.plan }
        break
      case 'toggle_status':
        update = { billing_status: parsed.data.status === 'active' ? 'active' : 'canceled' }
        break
    }

    const { error } = await service.from('merchants').update(update).eq('id', merchantId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/merchants/:id] failed', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

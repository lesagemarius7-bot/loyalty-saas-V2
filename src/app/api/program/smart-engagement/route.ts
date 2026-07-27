import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  smartEngagementEnabled: z.boolean(),
})

// Backs the "Copilote Marketing" playbook toggle on /dashboard/playbooks —
// same round-trip pattern as /api/program/playbooks, kept as its own route
// since this toggle has no accompanying config fields to bundle it with.
export async function PATCH(request: Request) {
  try {
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

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data: program, error: programError } = await supabase
      .from('loyalty_programs')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (programError) {
      return NextResponse.json({ error: programError.message }, { status: 500 })
    }

    const fields = { smart_engagement_enabled: parsed.data.smartEngagementEnabled }

    const { error } = program
      ? await supabase.from('loyalty_programs').update(fields).eq('id', program.id)
      : await supabase.from('loyalty_programs').insert({ merchant_id: merchant.id, ...fields })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[program/smart-engagement] failed to update', err)
    return NextResponse.json(
      { error: 'Impossible de mettre à jour le playbook.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

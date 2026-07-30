import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'

const bodySchema = z.object({
  inactivityReminderEnabled: z.boolean(),
  inactivityThresholdDays: z.coerce.number().int().min(1).max(365),
  inactivityMessage: z.string().trim().min(1).max(150),
})

// Backs the "Relance Client Dormant" playbook on /dashboard/playbooks — the
// dashboard toggle and config fields both save through here so the switch
// itself has a single, validated round trip to show a spinner/toast around,
// instead of writing straight to Supabase from the browser like the simpler
// settings forms elsewhere in the app.
export async function PATCH(request: Request) {
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

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const fields = {
      inactivity_reminder_enabled: parsed.data.inactivityReminderEnabled,
      inactivity_threshold_days: parsed.data.inactivityThresholdDays,
      inactivity_message: parsed.data.inactivityMessage,
    }

    const { data: program, error: programError } = await dataClient
      .from('loyalty_programs')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    // A real fetch error here must not be treated as "no program exists yet" —
    // that would fall through to the insert branch below and create a
    // duplicate loyalty_programs row instead of updating the real one.
    if (programError) {
      return NextResponse.json({ error: programError.message }, { status: 500 })
    }

    // A brand-new account (or one whose signup-time program insert failed) has
    // no real loyalty_programs row yet — same edge case handled on
    // /dashboard/card-design.
    const { error } = program
      ? await dataClient.from('loyalty_programs').update(fields).eq('id', program.id)
      : await dataClient.from('loyalty_programs').insert({ merchant_id: merchantId, ...fields })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[program/playbooks] failed to update', err)
    return NextResponse.json(
      { error: 'Impossible de mettre à jour le playbook.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

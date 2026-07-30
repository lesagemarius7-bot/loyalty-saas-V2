import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { PLANS, type PlanId } from '@/lib/billing/plans'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { merchantApprovedEmail } from '@/lib/email/approval-emails'
import type { Merchant } from '@/types'

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

const PLAN_IDS = PLANS.map((p) => p.id) as [PlanId, ...PlanId[]]

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('extend_poc'), extraDays: z.number().int().min(1).max(365) }),
  z.object({ action: z.literal('change_plan'), plan: z.enum(PLAN_IDS) }),
  // billing_status has no literal 'suspended' value in this schema — the
  // closest real status for "access should stop" is 'canceled'; 'active'
  // maps directly. Mapped explicitly below rather than writing a
  // non-existent enum value.
  z.object({ action: z.literal('toggle_status'), status: z.enum(['active', 'suspended']) }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject') }),
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
    const { data: merchant } = await service.from('merchants').select('*').eq('id', merchantId).maybeSingle<Merchant>()

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
        update = {
          billing_status: parsed.data.status === 'active' ? 'active' : 'canceled',
          // Reactivating clears any dunning flag — an admin manually
          // reactivating a suspended account is the resolution, not a
          // payment retry, so there's nothing left to chase.
          dunning_status: parsed.data.status === 'active' ? 'ok' : merchant.dunning_status,
        }
        break
      case 'approve':
        update = {
          approval_status: 'approved',
          billing_status: 'poc_active',
          poc_start_date: new Date().toISOString(),
          poc_duration_days: 30,
        }
        break
      case 'reject':
        update = { approval_status: 'rejected' }
        break
    }

    const { error } = await service.from('merchants').update(update).eq('id', merchantId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Real event log for the Finance page's churn/expansion metrics — only
    // logged on the transitions those metrics actually care about, not
    // every field this route can touch (extend_poc moves a date, not a
    // billing state).
    if (parsed.data.action === 'change_plan' && parsed.data.plan !== merchant.subscription_plan) {
      await service.from('merchant_status_events').insert({
        merchant_id: merchantId,
        event_type: 'plan_changed',
        from_value: merchant.subscription_plan,
        to_value: parsed.data.plan,
      })
    }
    if (parsed.data.action === 'toggle_status' && update.billing_status !== merchant.billing_status) {
      await service.from('merchant_status_events').insert({
        merchant_id: merchantId,
        event_type: 'billing_status_changed',
        from_value: merchant.billing_status,
        to_value: update.billing_status!,
      })
    }
    if (parsed.data.action === 'approve' || parsed.data.action === 'reject') {
      await service.from('merchant_status_events').insert({
        merchant_id: merchantId,
        event_type: 'approval_status_changed',
        from_value: merchant.approval_status,
        to_value: update.approval_status!,
      })
    }

    // Best-effort — the merchant is already approved in the DB regardless
    // of whether this email goes out; they aren't left in limbo if Resend
    // hiccups.
    if (parsed.data.action === 'approve' && isEmailConfigured()) {
      try {
        const { data: ownerData } = await service.auth.admin.getUserById(merchant.owner_id)
        if (ownerData.user?.email) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL}/dashboard`
          const { subject, html, text } = merchantApprovedEmail({
            businessName: merchant.business_name,
            dashboardUrl,
            pocDurationDays: 30,
          })
          await sendEmail({ to: ownerData.user.email, subject, html, text })
        }
      } catch (err) {
        console.error('[admin/merchants/:id] failed to send approval email', err)
      }
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

// Irreversible — every FK referencing merchants(id) across the schema is
// `on delete cascade` (customers, loyalty_cards, transactions, campaigns,
// system_logs, merchant_status_events, etc.), so this cleanly removes every
// trace of the merchant's business data in one statement. Does NOT delete
// the owner's auth.users row (no cascade runs that direction) — the person
// can still sign in afterward, they just have no merchant until a new
// signup, which is the safer default for "added by mistake" over also
// nuking their login.
export async function DELETE(_request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  try {
    const { merchantId } = await params
    const service = createServiceRoleClient()
    const { data: merchant } = await service
      .from('merchants')
      .select('id, business_name, is_super_admin')
      .eq('id', merchantId)
      .maybeSingle()

    if (!merchant) {
      return NextResponse.json({ error: 'Commerçant introuvable.' }, { status: 404 })
    }
    if (merchant.is_super_admin) {
      return NextResponse.json({ error: 'Impossible de supprimer un compte administrateur depuis cet écran.' }, { status: 400 })
    }

    const { error } = await service.from('merchants').delete().eq('id', merchantId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[admin/merchants/:id] merchant deleted — ${merchant.business_name} (${merchantId})`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/merchants/:id] delete failed', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

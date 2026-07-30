import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage } from '@/lib/wallet/google-wallet'
import { logSystemEvent } from '@/lib/logging/system-log'

// Vercel Functions default to 10s on Hobby — a daily batch across every
// merchant's card list needs more room.
export const maxDuration = 60

// Anti-churn engine, step 2 of the Wallet notification roadmap: runs daily
// (see vercel.json) and reuses the exact same delivery primitive as the
// manual campaigns in step 1 (last_message + push/addMessage) — the only new
// part here is *deciding who* to message and *not spamming* them.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: programs, error: programsError } = await supabase
      .from('loyalty_programs')
      .select('id, merchant_id, inactivity_threshold_days, inactivity_message')
      .eq('is_active', true)
      .eq('inactivity_reminder_enabled', true)

    // A query error (e.g. a column missing because a migration wasn't applied)
    // must not be treated the same as "no programs have this enabled" — the
    // silent version of this bug reports {programsChecked: 0} and looks like a
    // clean, uneventful run instead of a failure.
    if (programsError) {
      console.error('[cron/inactivity-check] failed to fetch programs', programsError)
      return NextResponse.json({ error: programsError.message }, { status: 500 })
    }

    const appleConfigured = isAppleWalletConfigured()
    const googleConfigured = isGoogleWalletConfigured()

    let merchantsWithSends = 0
    let totalNotified = 0

    for (const program of programs ?? []) {
      const thresholdMs = program.inactivity_threshold_days * 24 * 60 * 60 * 1000
      const nowMs = Date.now()

      const { data: cards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select('id, google_object_id, created_at, last_visit_at, last_inactivity_notification_at')
        .eq('program_id', program.id)
        .eq('status', 'active')

      if (cardsError) {
        console.error('[cron/inactivity-check] failed to fetch cards for program', program.id, cardsError)
        continue
      }

      // Due = past the threshold AND not already reminded for *this*
      // inactivity episode. "This episode" is defined as: no reminder sent
      // since their last real activity — a customer who comes back and then
      // goes quiet again becomes eligible again automatically, since a new
      // visit bumps last_visit_at past the old notification timestamp.
      const dueCards = (cards ?? []).filter((card) => {
        const referenceActivity = new Date(card.last_visit_at ?? card.created_at).getTime()
        if (nowMs - referenceActivity < thresholdMs) return false
        if (!card.last_inactivity_notification_at) return true
        return new Date(card.last_inactivity_notification_at).getTime() < referenceActivity
      })

      if (dueCards.length === 0) continue

      const now = new Date().toISOString()
      const cardIds = dueCards.map((c) => c.id)

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({
          last_message: program.inactivity_message,
          last_message_at: now,
          last_inactivity_notification_at: now,
        })
        .in('id', cardIds)

      if (updateError) {
        console.error('[cron/inactivity-check] failed to update cards for program', program.id, updateError)
        continue
      }

      if (appleConfigured) {
        const { data: registrations } = await supabase
          .from('apple_wallet_registrations')
          .select('push_token')
          .in('card_id', cardIds)

        const results = await Promise.allSettled(
          (registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token))
        )
        results.forEach((r) => {
          if (r.status === 'rejected') {
            console.error('[cron/inactivity-check] apple push failed', r.reason)
            void logSystemEvent(supabase, {
              merchantId: program.merchant_id,
              level: 'error',
              category: 'apns',
              message: 'Échec de mise à jour push Apple Wallet (relance inactivité).',
              metadata: { reason: String(r.reason) },
            })
          }
        })
      }

      if (googleConfigured) {
        const googleCardIds = dueCards.filter((c) => c.google_object_id).map((c) => c.id)
        const results = await Promise.allSettled(
          googleCardIds.map((id) => sendGoogleWalletMessage(id, 'Loyalty', program.inactivity_message))
        )
        results.forEach((r) => {
          if (r.status === 'rejected') {
            console.error('[cron/inactivity-check] google message failed', r.reason)
            void logSystemEvent(supabase, {
              merchantId: program.merchant_id,
              level: 'error',
              category: 'google_wallet',
              message: 'Échec de mise à jour Google Wallet (relance inactivité).',
              metadata: { reason: String(r.reason) },
            })
          }
        })
      }

      await supabase.from('notification_campaigns').insert({
        merchant_id: program.merchant_id,
        message: program.inactivity_message,
        recipient_count: dueCards.length,
        type: 'inactivity',
      })

      merchantsWithSends += 1
      totalNotified += dueCards.length
    }

    return NextResponse.json({
      ok: true,
      programsChecked: programs?.length ?? 0,
      merchantsWithSends,
      customersNotified: totalNotified,
    })
  } catch (err) {
    console.error('[cron/inactivity-check] failed', err)
    await logSystemEvent(createServiceRoleClient(), {
      level: 'critical',
      category: 'cron',
      message: `/api/cron/inactivity-check a échoué entièrement : ${err instanceof Error ? err.message : String(err)}`,
    })
    return NextResponse.json(
      { error: 'Cron failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

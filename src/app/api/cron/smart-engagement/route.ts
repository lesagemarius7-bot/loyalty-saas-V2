import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage } from '@/lib/wallet/google-wallet'
import { getWeatherForCity } from '@/lib/weather/openweather'
import { arbitrate } from '@/lib/engagement/arbitrate'
import { logSystemEvent } from '@/lib/logging/system-log'

// Same headroom as the inactivity cron — a daily pass across every merchant's
// card list, now with an extra weather fetch per merchant.
export const maxDuration = 60

function currentTimeOfDayBucket(): 'morning' | 'midday' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 11) return 'morning'
  if (hour < 15) return 'midday'
  return 'evening'
}

// Pillar 2 of the Wallet marketing roadmap: fully autonomous, per-customer
// activation. Unlike the inactivity cron (one rule, one message), this cross-
// references transaction-derived habits, optional live weather, and
// inactivity proximity through lib/engagement/arbitrate.ts to pick — or
// explicitly skip — a single best message per customer. Delivery reuses the
// exact same last_message + push/addMessage primitive as steps 1 and 2.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: programs, error: programsError } = await supabase
      .from('loyalty_programs')
      .select('id, merchant_id, reward_description')
      .eq('is_active', true)
      .eq('smart_engagement_enabled', true)

    if (programsError) {
      console.error('[cron/smart-engagement] failed to fetch programs', programsError)
      return NextResponse.json({ error: programsError.message }, { status: 500 })
    }

    const appleConfigured = isAppleWalletConfigured()
    const googleConfigured = isGoogleWalletConfigured()
    const currentBucket = currentTimeOfDayBucket()
    const today = new Date().toISOString().slice(0, 10)

    let merchantsProcessed = 0
    let customersMessaged = 0
    let customersSkipped = 0

    for (const program of programs ?? []) {
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id, city')
        .eq('id', program.merchant_id)
        .maybeSingle()

      if (merchantError || !merchant) {
        console.error('[cron/smart-engagement] failed to fetch merchant', program.merchant_id, merchantError)
        continue
      }

      const weather = merchant.city ? await getWeatherForCity(merchant.city) : null

      const { data: cards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select('id, customer_id, google_object_id, created_at, last_visit_at, last_smart_engagement_at, customer:customers(full_name)')
        .eq('program_id', program.id)
        .eq('status', 'active')

      if (cardsError) {
        console.error('[cron/smart-engagement] failed to fetch cards for program', program.id, cardsError)
        continue
      }

      merchantsProcessed += 1
      if (!cards || cards.length === 0) continue

      // customer_purchase_habits has no direct FK to loyalty_cards (both
      // reference customers independently), so it can't be embedded in the
      // query above — fetched separately and joined in memory instead.
      const customerIds = cards.map((c) => c.customer_id)
      const { data: habitsRows, error: habitsError } = await supabase
        .from('customer_purchase_habits')
        .select('customer_id, preferred_time_of_day, visit_frequency_days')
        .in('customer_id', customerIds)

      if (habitsError) {
        console.error('[cron/smart-engagement] failed to fetch habits for program', program.id, habitsError)
        continue
      }

      const habitsByCustomer = new Map((habitsRows ?? []).map((h) => [h.customer_id, h]))

      for (const card of cards) {
        // At most one smart-engagement message per card per day, regardless
        // of how many distinct signals matched.
        if (card.last_smart_engagement_at?.slice(0, 10) === today) {
          customersSkipped += 1
          continue
        }

        const habits = habitsByCustomer.get(card.customer_id)
        const referenceActivity = new Date(card.last_visit_at ?? card.created_at).getTime()
        const daysSinceLastVisit = (Date.now() - referenceActivity) / (1000 * 60 * 60 * 24)
        const firstName = card.customer?.full_name?.split(' ')[0] || 'là'

        const decision = arbitrate({
          customerFirstName: firstName,
          weather,
          preferredTimeOfDay: habits?.preferred_time_of_day ?? null,
          currentTimeOfDay: currentBucket,
          visitFrequencyDays: habits?.visit_frequency_days ?? null,
          daysSinceLastVisit,
          rewardDescription: program.reward_description,
        })

        if (!decision.shouldSend) {
          customersSkipped += 1
          continue
        }

        const now = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('loyalty_cards')
          .update({ last_message: decision.message, last_message_at: now, last_smart_engagement_at: now })
          .eq('id', card.id)

        if (updateError) {
          console.error('[cron/smart-engagement] failed to update card', card.id, updateError)
          continue
        }

        if (appleConfigured) {
          const { data: registrations } = await supabase
            .from('apple_wallet_registrations')
            .select('push_token')
            .eq('card_id', card.id)

          const results = await Promise.allSettled((registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token)))
          results.forEach((r) => {
            if (r.status === 'rejected') {
              console.error('[cron/smart-engagement] apple push failed', r.reason)
              void logSystemEvent(supabase, {
                merchantId: program.merchant_id,
                level: 'error',
                category: 'apns',
                message: 'Échec de mise à jour push Apple Wallet (smart engagement).',
                metadata: { cardId: card.id, reason: String(r.reason) },
              })
            }
          })
        }

        if (googleConfigured && card.google_object_id) {
          try {
            await sendGoogleWalletMessage(card.id, 'Loyalty', decision.message)
          } catch (err) {
            console.error('[cron/smart-engagement] google message failed', card.id, err)
            await logSystemEvent(supabase, {
              merchantId: program.merchant_id,
              level: 'error',
              category: 'google_wallet',
              message: 'Échec de mise à jour Google Wallet (smart engagement).',
              metadata: { cardId: card.id, reason: err instanceof Error ? err.message : String(err) },
            })
          }
        }

        await supabase.from('notification_campaigns').insert({
          merchant_id: program.merchant_id,
          message: decision.message,
          recipient_count: 1,
          type: 'smart_engagement',
        })

        customersMessaged += 1
      }
    }

    return NextResponse.json({
      ok: true,
      programsChecked: programs?.length ?? 0,
      merchantsProcessed,
      customersMessaged,
      customersSkipped,
    })
  } catch (err) {
    console.error('[cron/smart-engagement] failed', err)
    await logSystemEvent(createServiceRoleClient(), {
      level: 'critical',
      category: 'cron',
      message: `/api/cron/smart-engagement a échoué entièrement : ${err instanceof Error ? err.message : String(err)}`,
    })
    return NextResponse.json(
      { error: 'Cron failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

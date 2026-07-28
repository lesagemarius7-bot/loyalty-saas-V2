import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage } from '@/lib/wallet/google-wallet'

const bodySchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
  targetSummary: z.string().max(200).optional(),
  title: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(150),
})

function interpolate(template: string, firstName: string): string {
  return template.replaceAll('{{first_name}}', firstName)
}

// Segmented counterpart to /api/campaigns/send: same delivery primitive
// (last_message + push/addMessage), but scoped to an explicit list of
// customer ids (a category filter or a manual checkbox selection resolved
// client-side) instead of "every customer". Personalizes {{first_name}} per
// customer before writing last_message, since that field is what Apple's
// changeMessage template actually displays.
export async function POST(request: Request) {
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
    const { customerIds, targetSummary, title, message } = parsed.data

    // Scoped to this merchant's own customers — the merchant_id filter is
    // what stops a crafted customerIds array from reaching someone else's
    // cards, not client-side trust in the submitted ids.
    const { data: cards, error: cardsError } = await supabase
      .from('loyalty_cards')
      .select('id, google_object_id, customer:customers(full_name)')
      .eq('merchant_id', merchant.id)
      .in('customer_id', customerIds)

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Aucun client valide à notifier.' }, { status: 400 })
    }

    const appleConfigured = isAppleWalletConfigured()
    const googleConfigured = isGoogleWalletConfigured()
    const service = createServiceRoleClient()
    const now = new Date().toISOString()

    let appleAttempted = 0
    let googleAttempted = 0
    let cardsUpdated = 0

    for (const card of cards) {
      const firstName = card.customer?.full_name?.split(' ')[0] || 'là'
      const personalizedBody = interpolate(message, firstName)
      const combined = title ? `${interpolate(title, firstName)} — ${personalizedBody}` : personalizedBody

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({ last_message: combined, last_message_at: now })
        .eq('id', card.id)

      if (updateError) {
        console.error('[notifications/send-bulk] failed to update card', card.id, updateError)
        continue
      }
      cardsUpdated += 1

      if (appleConfigured) {
        const { data: registrations } = await service
          .from('apple_wallet_registrations')
          .select('push_token')
          .eq('card_id', card.id)

        appleAttempted += registrations?.length ?? 0
        const results = await Promise.allSettled((registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token)))
        results.forEach((r) => {
          if (r.status === 'rejected') console.error('[notifications/send-bulk] apple push failed', r.reason)
        })
      }

      if (googleConfigured && card.google_object_id) {
        googleAttempted += 1
        try {
          await sendGoogleWalletMessage(card.id, title || 'Loyalty', personalizedBody)
        } catch (err) {
          console.error('[notifications/send-bulk] google message failed', card.id, err)
        }
      }
    }

    await supabase.from('notification_campaigns').insert({
      merchant_id: merchant.id,
      message,
      recipient_count: cardsUpdated,
      type: 'targeted',
      target_summary: targetSummary ?? `${cardsUpdated} client(s) sélectionné(s)`,
    })

    return NextResponse.json({
      ok: true,
      recipientCount: cardsUpdated,
      apple: { configured: appleConfigured, attempted: appleAttempted },
      google: { configured: googleConfigured, attempted: googleAttempted },
    })
  } catch (err) {
    console.error('[notifications/send-bulk] failed', err)
    return NextResponse.json(
      { error: "Impossible d'envoyer la notification.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

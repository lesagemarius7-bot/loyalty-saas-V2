import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isAppleWalletConfigured, pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { isGoogleWalletConfigured, sendGoogleWalletMessage } from '@/lib/wallet/google-wallet'

const bodySchema = z.object({
  message: z.string().trim().min(1).max(150),
})

// Broadcasts a one-off message to every one of the merchant's customers —
// first brick of Wallet-based marketing notifications. Fans out to whichever
// platforms are configured; scheduled campaigns (inactivity re-engagement,
// targeted segments) can reuse the same delivery primitive later by writing
// last_message on a filtered set of cards instead of "all of them".
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
    const { message } = parsed.data

    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('id, google_object_id')
      .eq('merchant_id', merchant.id)

    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Aucun client à notifier pour le moment.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({ last_message: message, last_message_at: now })
      .eq('merchant_id', merchant.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    const appleConfigured = isAppleWalletConfigured()
    const googleConfigured = isGoogleWalletConfigured()

    let appleAttempted = 0
    let googleAttempted = 0

    if (appleConfigured) {
      const cardIds = cards.map((c) => c.id)
      const service = createServiceRoleClient()
      const { data: registrations } = await service
        .from('apple_wallet_registrations')
        .select('push_token')
        .in('card_id', cardIds)

      appleAttempted = registrations?.length ?? 0
      const results = await Promise.allSettled((registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token)))
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('[campaigns/send] apple push failed', r.reason)
      })
    }

    if (googleConfigured) {
      const googleCardIds = cards.filter((c) => c.google_object_id).map((c) => c.id)
      googleAttempted = googleCardIds.length
      const results = await Promise.allSettled(
        googleCardIds.map((id) => sendGoogleWalletMessage(id, 'Loyalty', message))
      )
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('[campaigns/send] google message failed', r.reason)
      })
    }

    await supabase
      .from('notification_campaigns')
      .insert({ merchant_id: merchant.id, message, recipient_count: cards.length, type: 'manual' })

    return NextResponse.json({
      ok: true,
      recipientCount: cards.length,
      apple: { configured: appleConfigured, attempted: appleAttempted },
      google: { configured: googleConfigured, attempted: googleAttempted },
    })
  } catch (err) {
    console.error('[campaigns/send] failed', err)
    return NextResponse.json(
      { error: "Impossible d'envoyer la notification.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

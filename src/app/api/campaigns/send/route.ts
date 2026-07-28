import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deliverToCards, type DeliveryCard } from '@/lib/notifications/deliver'

const bodySchema = z.object({
  title: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(150),
})

// Broadcasts a one-off message to every one of the merchant's customers —
// first brick of Wallet-based marketing notifications. Delivery +
// {{variable}} interpolation + per-customer delivery logging is shared with
// the segmented route (/api/notifications/send-bulk) via
// lib/notifications/deliver, so a template built with {{first_name}} etc.
// behaves identically whether it's sent to everyone here or to a filtered
// segment there.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant } = await supabase.from('merchants').select('id, business_name').eq('owner_id', user.id).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { title, message } = parsed.data

    const { data: cards, error: cardsError } = await supabase
      .from('loyalty_cards')
      .select(
        'id, customer_id, google_object_id, points_balance, customer:customers(full_name, customer_purchase_habits(favorite_category, last_purchased_category, last_transaction_at))'
      )
      .eq('merchant_id', merchant.id)

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Aucun client à notifier pour le moment.' }, { status: 400 })
    }

    const deliveryCards: DeliveryCard[] = cards.map((card) => {
      const [firstName, ...rest] = (card.customer?.full_name ?? '').split(' ')
      return {
        id: card.id,
        customerId: card.customer_id,
        googleObjectId: card.google_object_id,
        firstName: firstName ?? '',
        lastName: rest.join(' '),
        favoriteCategory: card.customer?.customer_purchase_habits?.favorite_category ?? null,
        lastPurchasedCategory: card.customer?.customer_purchase_habits?.last_purchased_category ?? null,
        lastTransactionAt: card.customer?.customer_purchase_habits?.last_transaction_at ?? null,
        currentStamps: card.points_balance,
      }
    })

    const { data: campaign, error: campaignInsertError } = await supabase
      .from('notification_campaigns')
      .insert({ merchant_id: merchant.id, message, recipient_count: cards.length, type: 'manual' })
      .select('id')
      .single()

    if (campaignInsertError) {
      return NextResponse.json({ error: campaignInsertError.message }, { status: 500 })
    }

    const result = await deliverToCards(supabase, deliveryCards, title, message, merchant.business_name, {
      merchantId: merchant.id,
      campaignId: campaign.id,
    })

    await supabase.from('notification_campaigns').update({ recipient_count: result.cardsUpdated }).eq('id', campaign.id)

    return NextResponse.json({
      ok: true,
      recipientCount: result.cardsUpdated,
      apple: result.apple,
      google: result.google,
    })
  } catch (err) {
    console.error('[campaigns/send] failed', err)
    return NextResponse.json(
      { error: "Impossible d'envoyer la notification.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

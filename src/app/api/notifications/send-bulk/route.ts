import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deliverToCards, isAnyWalletChannelConfigured, type DeliveryCard } from '@/lib/notifications/deliver'

const bodySchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
  targetSummary: z.string().max(200).optional(),
  title: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(150),
})

// Segmented counterpart to /api/campaigns/send: scoped to an explicit list
// of customer ids (a category filter or a manual checkbox selection resolved
// client-side) instead of "every customer". Delivery + {{variable}}
// interpolation + per-customer delivery logging is shared with the broadcast
// route via lib/notifications/deliver.
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

    if (!isAnyWalletChannelConfigured()) {
      return NextResponse.json(
        { error: 'Envoi impossible : certificats Apple/Google Wallet non configurés' },
        { status: 400 }
      )
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
      .select(
        'id, customer_id, google_object_id, points_balance, customer:customers(full_name, customer_purchase_habits(favorite_category, last_purchased_category, last_transaction_at))'
      )
      .eq('merchant_id', merchant.id)
      .in('customer_id', customerIds)

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Aucun client valide à notifier.' }, { status: 400 })
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

    // Created before delivery so notification_deliveries rows can reference
    // a real campaign_id from the start.
    const { data: campaign, error: campaignInsertError } = await supabase
      .from('notification_campaigns')
      .insert({
        merchant_id: merchant.id,
        message,
        recipient_count: cards.length,
        type: 'targeted',
        target_summary: targetSummary ?? `${cards.length} client(s) sélectionné(s)`,
      })
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

    return NextResponse.json({ ok: true, recipientCount: result.cardsUpdated, apple: result.apple, google: result.google })
  } catch (err) {
    console.error('[notifications/send-bulk] failed', err)
    return NextResponse.json(
      { error: "Impossible d'envoyer la notification.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

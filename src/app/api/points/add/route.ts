import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { pushAppleWalletUpdate } from '@/lib/wallet/apple-pass'
import { upsertGoogleLoyaltyObject } from '@/lib/wallet/google-wallet'
import { getActiveOffers } from '@/lib/wallet/offers'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

const bodySchema = z
  .object({
    // The /dashboard/scan camera reads the QR code, whose payload is the card's
    // serial_number, not its uuid — accept either so the scanner doesn't need an
    // extra lookup round trip before crediting points.
    cardId: z.string().uuid().optional(),
    serialNumber: z.string().optional(),
    points: z.number().int().refine((n) => n !== 0, 'points must be non-zero'),
    type: z.enum(['earn', 'redeem', 'adjust']).default('earn'),
    note: z.string().max(280).optional(),
  })
  .refine((data) => data.cardId || data.serialNumber, { message: 'cardId or serialNumber is required' })

// Called from the /dashboard/scan flow after a staff member scans a customer's QR
// code. Runs as the authenticated staff/owner session (not the service role) so
// RLS's is_merchant_member() check is what actually prevents crediting a card that
// belongs to a different merchant — the merchant_id in the insert is trusted only
// because Postgres will reject it otherwise.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { cardId, serialNumber, points, type, note } = parsed.data

  const cardQuery = supabase.from('loyalty_cards').select('id, merchant_id')
  const { data: card } = await (cardId ? cardQuery.eq('id', cardId) : cardQuery.eq('serial_number', serialNumber!)).single()

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  const pointsDelta = type === 'redeem' ? -Math.abs(points) : points

  const { error: insertError } = await supabase.from('transactions').insert({
    merchant_id: card.merchant_id,
    card_id: card.id,
    staff_user_id: user.id,
    type,
    points_delta: pointsDelta,
    note,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .select('*, customer:customers(*), program:loyalty_programs(*)')
    .eq('id', card.id)
    .single<LoyaltyCardWithRelations>()

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', card.merchant_id)
    .single<Merchant>()

  // Wallet pass refresh is best-effort: the ledger write above already succeeded,
  // so a Wallet API hiccup here shouldn't fail the staff member's scan.
  if (updatedCard && merchant) {
    await syncWalletPasses(updatedCard, merchant, supabase)
  }

  return NextResponse.json({ pointsBalance: updatedCard?.points_balance ?? null })
}

async function syncWalletPasses(
  card: LoyaltyCardWithRelations,
  merchant: Merchant,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    if (card.google_object_id) {
      const activeOffers = await getActiveOffers(card.customer_id, card.merchant_id)
      await upsertGoogleLoyaltyObject(card, merchant, activeOffers)
    }

    const { data: registrations } = await supabase
      .from('apple_wallet_registrations')
      .select('push_token')
      .eq('card_id', card.id)

    await Promise.allSettled((registrations ?? []).map((r) => pushAppleWalletUpdate(r.push_token)))
  } catch (err) {
    console.error('Wallet pass sync failed', err)
  }
}

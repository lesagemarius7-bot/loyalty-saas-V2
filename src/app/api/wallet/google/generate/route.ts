import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createGoogleWalletSaveLink, isGoogleWalletConfigured, upsertGoogleLoyaltyObject } from '@/lib/wallet/google-wallet'
import { walletNotConfiguredResponse } from '@/lib/wallet/not-configured-response'
import { getCardWithMerchant } from '@/lib/wallet/card-lookup'

// Public route linked from the "Add to Google Wallet" button on /card/[cardId].
// Same trust model as the Apple route: the card id is the capability, like the QR
// code itself.
export async function GET(request: Request) {
  try {
    if (!isGoogleWalletConfigured()) {
      return walletNotConfiguredResponse('google')
    }

    const cardId = new URL(request.url).searchParams.get('cardId')
    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 })
    }

    const lookup = await getCardWithMerchant(cardId)
    if (!lookup) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    const { card, merchant } = lookup

    await upsertGoogleLoyaltyObject(card, merchant)

    if (!card.google_object_id) {
      const supabase = createServiceRoleClient()
      await supabase.from('loyalty_cards').update({ google_object_id: card.id }).eq('id', card.id)
    }

    const saveUrl = createGoogleWalletSaveLink(card)
    return NextResponse.redirect(saveUrl)
  } catch (err) {
    console.error('[wallet/google/generate] failed to generate save link', err)
    return NextResponse.json(
      {
        error: 'Impossible de générer le lien Google Wallet.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { generateAppleLoyaltyPass, isAppleWalletConfigured } from '@/lib/wallet/apple-pass'
import { walletNotConfiguredResponse } from '@/lib/wallet/not-configured-response'
import { getCardWithMerchant } from '@/lib/wallet/card-lookup'

// Public route linked from the "Add to Apple Wallet" button on /card/[cardId] — the
// visitor there is the customer themselves, not a logged-in dashboard user, so
// there's no Supabase session to check. The card id in the URL plays the same role
// as the QR code printed/shown in-store: knowing it is what proves you're looking
// at your own card, not a separate secret.
export async function GET(request: Request) {
  try {
    if (!isAppleWalletConfigured()) {
      return walletNotConfiguredResponse('apple')
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

    const buffer = await generateAppleLoyaltyPass(card, merchant)

    // Buffer's ArrayBufferLike generic doesn't line up with lib.dom's stricter
    // BodyInit signature under current @types/node — the runtime accepts a Buffer
    // here fine, this is a types-only mismatch.
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${merchant.slug}-loyalty-card.pkpass"`,
      },
    })
  } catch (err) {
    console.error('[wallet/apple/generate] failed to generate pass', err)
    return NextResponse.json(
      {
        error: 'Impossible de générer le pass Apple Wallet.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

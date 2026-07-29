import { NextResponse } from 'next/server'
import { generateAppleLoyaltyPass, isAppleWalletConfigured } from '@/lib/wallet/apple-pass'
import { createGoogleWalletSaveLink, isGoogleWalletConfigured, upsertGoogleLoyaltyObject } from '@/lib/wallet/google-wallet'
import { walletNotConfiguredResponse } from '@/lib/wallet/not-configured-response'
import { getCardWithMerchant } from '@/lib/wallet/card-lookup'
import { detectWalletPlatform } from '@/lib/wallet/user-agent'
import { getActiveOffers } from '@/lib/wallet/offers'

// Smart Link: a single URL — the one emailed to customers and printed on
// receipts — with no intermediate landing page. The platform decides what
// happens purely from the User-Agent header:
//   iOS      -> .pkpass binary; Safari offers "Add to Apple Wallet" itself.
//   Android  -> 302 straight to the Google Wallet save link.
//   anything else (desktop, bots, unrecognized UAs) -> falls back to the
//     .pkpass — it's the one artifact that's actually downloadable and
//     inspectable outside a phone (e.g. to AirDrop to an iPhone later).
// Same capability-based trust model as the existing cardId query-param routes:
// knowing the card id is what proves this is your card, like the QR code
// printed on it.
export async function GET(request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params

    const lookup = await getCardWithMerchant(cardId)
    if (!lookup) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    const { card, merchant } = lookup
    const activeOffers = await getActiveOffers(card.customer_id, card.merchant_id)

    const platform = detectWalletPlatform(request.headers.get('user-agent'))

    if (platform === 'android') {
      if (!isGoogleWalletConfigured()) {
        return walletNotConfiguredResponse('google')
      }
      await upsertGoogleLoyaltyObject(card, merchant, activeOffers)
      const saveUrl = createGoogleWalletSaveLink(card)
      return NextResponse.redirect(saveUrl, { status: 302 })
    }

    // iOS and the "other" fallback both resolve to the .pkpass.
    if (!isAppleWalletConfigured()) {
      return walletNotConfiguredResponse('apple')
    }

    const buffer = await generateAppleLoyaltyPass(card, merchant, activeOffers)

    // Buffer vs lib.dom's BodyInit — see the same cast in
    // api/wallet/apple/generate/route.ts.
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="pass.pkpass"',
      },
    })
  } catch (err) {
    console.error('[passes/download] failed to generate pass', err)
    return NextResponse.json(
      {
        error: 'Impossible de générer la carte.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

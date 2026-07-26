import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateAppleLoyaltyPass, isAppleWalletConfigured } from '@/lib/wallet/apple-pass'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

// "Get the latest version of a pass" — iOS calls this to fetch the updated
// .pkpass after being told (via the registrations endpoint) that it changed.
// https://developer.apple.com/documentation/walletpasses/get-the-latest-version-of-a-pass
export async function GET(request: Request, { params }: { params: Promise<{ serialNumber: string }> }) {
  try {
    // No JSON "not configured" body here — this endpoint is called by Apple's
    // own servers per the PassKit web service spec, which expects a pkpass
    // binary or a bare error status, not a human-facing message.
    if (!isAppleWalletConfigured()) {
      return new NextResponse(null, { status: 503 })
    }

    const { serialNumber } = await params
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^ApplePass\s+/i, '')

    const supabase = createServiceRoleClient()
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*, customer:customers(*), program:loyalty_programs(*)')
      .eq('serial_number', serialNumber)
      .single<LoyaltyCardWithRelations>()

    // See the TODO in lib/wallet/apple-pass.ts — token currently equals the serial.
    if (!card || token !== serialNumber) return new NextResponse(null, { status: 401 })

    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', card.merchant_id)
      .single<Merchant>()

    if (!merchant) return new NextResponse(null, { status: 404 })

    const buffer = await generateAppleLoyaltyPass(card, merchant)
    await supabase.from('loyalty_cards').update({ apple_pass_updated_at: new Date().toISOString() }).eq('id', card.id)

    // Buffer vs lib.dom's BodyInit — see the same cast in
    // api/wallet/apple/generate/route.ts.
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': new Date().toUTCString(),
      },
    })
  } catch (err) {
    console.error('[wallet/apple/v1/passes] failed to generate pass', err)
    return new NextResponse(null, { status: 500 })
  }
}

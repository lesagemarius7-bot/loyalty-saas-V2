import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateAppleLoyaltyPass, isAppleWalletConfigured } from '@/lib/wallet/apple-pass'
import { buildPreviewCard, previewPayloadSchema, type PreviewPayload } from '@/lib/wallet/preview-card'
import { walletNotConfiguredResponse } from '@/lib/wallet/not-configured-response'

// Scanned from the QR code on /dashboard/card-design — the merchant's own phone,
// with no dashboard session, hits this unauthenticated-but-unguessable-id route
// (same capability-based trust model as the existing cardId-based wallet routes).
// Reads the merchant's live draft from card_preview_sessions if one exists;
// falls back to their already-saved merchant/program row otherwise, so scanning
// works even before the first debounced draft save lands.
export async function GET(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  try {
    if (!isAppleWalletConfigured()) {
      return walletNotConfiguredResponse('apple')
    }

    const { merchantId } = await params
    const supabase = createServiceRoleClient()

    const { data: merchant } = await supabase.from('merchants').select('*').eq('id', merchantId).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const [{ data: session }, { data: program }] = await Promise.all([
      supabase.from('card_preview_sessions').select('payload').eq('merchant_id', merchantId).maybeSingle(),
      supabase
        .from('loyalty_programs')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
    ])

    const draft = session ? previewPayloadSchema.safeParse(session.payload) : null

    const overrides: PreviewPayload = draft?.success
      ? draft.data
      : {
          businessName: merchant.business_name,
          subtitle: program?.name ?? 'Carte de fidélité',
          logoUrl: merchant.logo_url,
          brandColor: merchant.brand_color,
          textColor: merchant.card_text_color,
          rewardThreshold: program?.reward_threshold ?? 10,
          rewardDescription: program?.reward_description ?? 'Récompense',
          stampIcon: program?.stamp_icon ?? '✓',
          backgroundStyle: program?.background_style ?? 'solid',
          gradientSecondaryColor: program?.gradient_secondary_color ?? '#0f172a',
          bannerImageUrl: program?.banner_image_url ?? null,
          backAddress: program?.back_address ?? null,
          backPhone: program?.back_phone ?? null,
          backHours: program?.back_hours ?? null,
          backInstagramUrl: program?.back_instagram_url ?? null,
          backGoogleReviewUrl: program?.back_google_review_url ?? null,
          backTerms: program?.back_terms ?? '1 tampon par passage en caisse.',
          latitude: program?.latitude ?? null,
          longitude: program?.longitude ?? null,
        }

    const { card, merchant: previewMerchant } = buildPreviewCard(merchant, overrides)
    const buffer = await generateAppleLoyaltyPass(card, previewMerchant)

    // Buffer vs lib.dom's BodyInit — see the same cast in
    // api/wallet/apple/generate/route.ts.
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="apercu.pkpass"',
      },
    })
  } catch (err) {
    console.error('[wallet/apple/preview] failed to generate pass', err)
    return NextResponse.json(
      {
        error: 'Impossible de générer le pass Apple Wallet.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

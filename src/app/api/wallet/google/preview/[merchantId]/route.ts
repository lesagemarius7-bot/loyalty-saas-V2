import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createGoogleWalletSaveLink, isGoogleWalletConfigured, upsertGoogleLoyaltyObject } from '@/lib/wallet/google-wallet'
import { buildPreviewCard, previewPayloadSchema, type PreviewPayload } from '@/lib/wallet/preview-card'
import { walletNotConfiguredResponse } from '@/lib/wallet/not-configured-response'

// Google counterpart of apple/preview/[merchantId] — see that route for the full
// rationale (QR-scanned from the merchant's own phone, no dashboard session).
//
// Two consumers hit this same URL differently: the phone camera that scans the
// dashboard's QR code needs a real HTTP redirect to Google's save page (it can't
// interpret JSON), while the dashboard's own "Ajouter à Google Wallet" button
// calls this via fetch() to detect demo mode before navigating. `?format=json`
// (added only by that fetch call, never by the QR code's target URL)
// distinguishes the two without duplicating this route.
export async function GET(request: Request, { params }: { params: Promise<{ merchantId: string }> }) {
  const wantsJson = new URL(request.url).searchParams.get('format') === 'json'

  try {
    if (!isGoogleWalletConfigured()) {
      return walletNotConfiguredResponse('google')
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
    await upsertGoogleLoyaltyObject(card, previewMerchant)

    const saveUrl = createGoogleWalletSaveLink(card)
    return wantsJson ? NextResponse.json({ demo: false, saveUrl }) : NextResponse.redirect(saveUrl)
  } catch (err) {
    console.error('[wallet/google/preview] failed to generate save link', err)
    return NextResponse.json(
      {
        error: 'Impossible de générer le lien Google Wallet.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

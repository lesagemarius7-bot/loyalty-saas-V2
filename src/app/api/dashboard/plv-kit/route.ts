import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { generatePlvKitPdf } from '@/lib/pdf/plv-kit'

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { merchantId, dataClient } = await resolveMerchantId(supabase, user.id)
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const { data: merchant } = await dataClient
      .from('merchants')
      .select('business_name, slug, logo_url, brand_color')
      .eq('id', merchantId)
      .single()

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL
    // Same enrollment URL as DownloadQrButton on /dashboard — one QR
    // destination across every printable material, not a parallel link.
    const smartLink = `${appUrl}/join/${merchant.slug}`

    const pdfBuffer = await generatePlvKitPdf({
      businessName: merchant.business_name,
      logoUrl: merchant.logo_url,
      smartLink,
      brandColor: merchant.brand_color,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kit-plv-${merchant.slug}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[dashboard/plv-kit] failed', err)
    return NextResponse.json(
      { error: 'Impossible de générer le kit PLV.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

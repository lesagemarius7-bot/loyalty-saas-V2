import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { isEmailConfigured, ResendSendError, sendEmail } from '@/lib/email/resend'
import { loyaltyCardReadyEmail } from '@/lib/email/templates'

// Falls back to the verified custom domain if NEXT_PUBLIC_APP_URL isn't set
// on the deployment — otherwise the download link in the email would
// literally read "undefined/api/passes/download/...". Deliberately the same
// domain the email is sent from (loyaltyapp.click), not the old .vercel.app
// one — a link domain that doesn't match the sending domain is itself a
// minor deliverability signal.
const FALLBACK_APP_URL = 'https://loyaltyapp.click'

// Dashboard-only action ("Envoyer par e-mail" on /dashboard/customers).
// Normally uses the authenticated client (not service role) so RLS's
// is_merchant_member() check is what actually prevents a merchant from
// emailing someone else's customer — a customerId belonging to another
// merchant just won't be found, not a 403. During impersonation, RLS would
// block the admin's own session entirely (see resolveMerchantId), so
// dataClient becomes a service-role client instead — the explicit
// `.eq('merchant_id', merchantId)` filters below take over as the tenant
// boundary in that case, since service role has no RLS to fall back on.
export async function POST(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
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
    const { data: merchant } = await dataClient.from('merchants').select('*').eq('id', merchantId).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const { customerId } = await params

    const { data: customer } = await dataClient
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('merchant_id', merchantId)
      .single()
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.email) {
      return NextResponse.json({ error: 'Ce client n’a pas d’adresse email enregistrée.' }, { status: 400 })
    }

    const { data: card } = await dataClient
      .from('loyalty_cards')
      .select('id')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .limit(1)
      .maybeSingle()

    if (!card) {
      return NextResponse.json({ error: 'Aucune carte de fidélité pour ce client.' }, { status: 404 })
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          demo: true,
          error: "L'envoi d'email n'est pas configuré sur cet environnement.",
          message:
            "RESEND_API_KEY et EMAIL_FROM sont absents de .env.local — voir .env.local.example. Aucun email n'a été envoyé.",
        },
        { status: 200 }
      )
    }

    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL}/api/passes/download/${card.id}`
    const { subject, html, text } = loyaltyCardReadyEmail({
      merchantName: merchant.business_name,
      customerName: customer.full_name,
      downloadUrl,
      brandColor: merchant.brand_color,
    })

    await sendEmail({ to: customer.email, subject, html, text })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[customers/send-card] failed to send email', err)

    // Resend itself rejected the send (bad recipient, unverified domain,
    // test-mode restriction, etc.) — surface its exact message and a 400,
    // since this is something the merchant can potentially act on, not a bug
    // on our end.
    if (err instanceof ResendSendError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Impossible d'envoyer l'email.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

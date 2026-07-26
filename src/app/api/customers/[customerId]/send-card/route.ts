import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isEmailConfigured, ResendSendError, sendEmail } from '@/lib/email/resend'
import { loyaltyCardReadyEmail } from '@/lib/email/templates'

// Dashboard-only action ("Envoyer par e-mail" on /dashboard/customers). Uses the
// authenticated client (not service role) so RLS's is_merchant_member() check is
// what actually prevents a merchant from emailing someone else's customer — a
// customerId belonging to another merchant just won't be found, not a 403.
export async function POST(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant } = await supabase.from('merchants').select('*').eq('owner_id', user.id).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const { customerId } = await params

    const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).single()
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.email) {
      return NextResponse.json({ error: 'Ce client n’a pas d’adresse email enregistrée.' }, { status: 400 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id')
      .eq('customer_id', customerId)
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

    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/passes/download/${card.id}`
    const { subject, html } = loyaltyCardReadyEmail({
      merchantName: merchant.business_name,
      customerName: customer.full_name,
      downloadUrl,
      brandColor: merchant.brand_color,
    })

    await sendEmail({ to: customer.email, subject, html })

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

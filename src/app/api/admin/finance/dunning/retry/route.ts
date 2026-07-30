import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { stripe } from '@/lib/stripe/client'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { paymentUpdateReminderEmail } from '@/lib/email/approval-emails'

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

const bodySchema = z.object({ merchantId: z.string().uuid() })

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceRoleClient()
  const { data: merchant } = await service
    .from('merchants')
    .select('id, business_name, owner_id, stripe_customer_id, dunning_status')
    .eq('id', parsed.data.merchantId)
    .maybeSingle()

  if (!merchant) {
    return NextResponse.json({ error: 'Commerçant introuvable.' }, { status: 404 })
  }
  if (!merchant.stripe_customer_id) {
    return NextResponse.json(
      { error: "Ce commerçant n'a pas encore de compte Stripe (facturation manuelle / POC)." },
      { status: 400 }
    )
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "L'envoi d'e-mail n'est pas configuré (RESEND_API_KEY)." }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL

  let portalUrl: string
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: merchant.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
      flow_data: { type: 'payment_method_update' },
    })
    portalUrl = session.url
  } catch (err) {
    console.error('[admin/finance/dunning/retry] Stripe portal session failed', err)
    return NextResponse.json({ error: 'Impossible de générer le lien Stripe (voir logs serveur).' }, { status: 502 })
  }

  const { data: ownerData } = await service.auth.admin.getUserById(merchant.owner_id)
  if (!ownerData.user?.email) {
    return NextResponse.json({ error: 'Aucun e-mail trouvé pour ce commerçant.' }, { status: 404 })
  }

  const { subject, html, text } = paymentUpdateReminderEmail({ businessName: merchant.business_name, portalUrl })
  await sendEmail({ to: ownerData.user.email, subject, html, text })

  if (merchant.dunning_status === 'payment_failed') {
    await service.from('merchants').update({ dunning_status: 'retry_1' }).eq('id', merchant.id)
  }

  return NextResponse.json({ ok: true })
}

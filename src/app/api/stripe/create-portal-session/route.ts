import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'

export async function POST() {
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
    .select('stripe_customer_id')
    .eq('id', merchantId)
    .single()

  if (!merchant?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: merchant.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}

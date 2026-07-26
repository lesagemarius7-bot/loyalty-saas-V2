import { NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  priceId: z.string().min(1),
})

// Called from the dashboard billing page. Requires an authenticated merchant owner
// — RLS on `merchants` means the select below only ever returns the caller's own
// row, so there is no need to separately check ownership.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, stripe_customer_id')
    .eq('owner_id', user.id)
    .single()

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: merchant.stripe_customer_id ?? undefined,
    customer_email: merchant.stripe_customer_id ? undefined : user.email,
    client_reference_id: merchant.id,
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    subscription_data: { metadata: { merchant_id: merchant.id } },
  })

  return NextResponse.json({ url: session.url })
}

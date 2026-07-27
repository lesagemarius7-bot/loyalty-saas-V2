import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Stripe requires the raw request body to verify the webhook signature — do not
// parse it with request.json() before this point, and do not add a body parser.
export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.client_reference_id && session.customer && session.subscription) {
        await supabase
          .from('merchants')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            billing_status: 'active',
          })
          .eq('id', session.client_reference_id)
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const merchantId = subscription.metadata.merchant_id
      if (merchantId) {
        const mappedStatus = mapStripeStatus(subscription.status)
        await supabase
          .from('merchants')
          .update({ subscription_status: mappedStatus, billing_status: mapToBillingStatus(mappedStatus) })
          .eq('id', merchantId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
    case 'incomplete':
      return status
    default:
      return 'canceled'
  }
}

// billing_status has no 'trialing'/'incomplete' states of its own (those are
// pre-POC Stripe-trial concepts this app doesn't use — the POC widget is the
// trial) — both collapse to 'active' since a subscription in either state is
// already past the free-POC phase from this app's perspective.
function mapToBillingStatus(subscriptionStatus: ReturnType<typeof mapStripeStatus>): 'active' | 'past_due' | 'canceled' {
  if (subscriptionStatus === 'past_due') return 'past_due'
  if (subscriptionStatus === 'canceled') return 'canceled'
  return 'active'
}

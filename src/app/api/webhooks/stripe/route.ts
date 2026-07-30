import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logSystemEvent } from '@/lib/logging/system-log'

// Stripe requires the raw request body to verify the webhook signature — do not
// parse it with request.json() before this point, and do not add a body parser.
export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')
  const supabase = createServiceRoleClient()

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    // A wrong/rotated STRIPE_WEBHOOK_SECRET silently breaks all billing
    // sync until someone notices — 'error', not 'critical', since a single
    // bad signature (replay, wrong secret briefly during rotation) isn't
    // itself catastrophic, but a run of these deserves surfacing.
    await logSystemEvent(supabase, {
      level: 'error',
      category: 'stripe',
      message: `Signature Stripe invalide : ${(err as Error).message}`,
    })
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.client_reference_id && session.customer && session.subscription) {
        const { data: before } = await supabase
          .from('merchants')
          .select('billing_status')
          .eq('id', session.client_reference_id)
          .maybeSingle()

        await supabase
          .from('merchants')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            billing_status: 'active',
            dunning_status: 'ok',
          })
          .eq('id', session.client_reference_id)

        await logStatusEvent(supabase, session.client_reference_id, 'billing_status_changed', before?.billing_status ?? null, 'active')
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const merchantId = subscription.metadata.merchant_id
      if (merchantId) {
        const { data: before } = await supabase
          .from('merchants')
          .select('billing_status')
          .eq('id', merchantId)
          .maybeSingle()

        const mappedStatus = mapStripeStatus(subscription.status)
        const newBillingStatus = mapToBillingStatus(mappedStatus)
        await supabase
          .from('merchants')
          .update({ subscription_status: mappedStatus, billing_status: newBillingStatus })
          .eq('id', merchantId)

        if (before?.billing_status !== newBillingStatus) {
          await logStatusEvent(supabase, merchantId, 'billing_status_changed', before?.billing_status ?? null, newBillingStatus)
        }
      }
      break
    }

    // Feeds the Dunning Hub (/admin/finance) — dunning_status only ever
    // moves in response to a real Stripe invoice event, never a guess.
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const merchantId = await merchantIdForInvoice(supabase, invoice)
      if (merchantId) {
        await supabase.from('merchants').update({ dunning_status: 'payment_failed' }).eq('id', merchantId)
        await logSystemEvent(supabase, {
          merchantId,
          level: 'warning',
          category: 'stripe',
          message: 'Prélèvement Stripe échoué.',
          metadata: { invoiceId: invoice.id, amountDue: invoice.amount_due },
        })
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const merchantId = await merchantIdForInvoice(supabase, invoice)
      if (merchantId) {
        await supabase.from('merchants').update({ dunning_status: 'ok' }).eq('id', merchantId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function merchantIdForInvoice(
  supabase: ReturnType<typeof createServiceRoleClient>,
  invoice: Stripe.Invoice
): Promise<string | null> {
  if (!invoice.customer) return null
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('stripe_customer_id', invoice.customer as string)
    .maybeSingle()
  return data?.id ?? null
}

async function logStatusEvent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  merchantId: string,
  eventType: 'plan_changed' | 'billing_status_changed' | 'approval_status_changed',
  fromValue: string | null,
  toValue: string
) {
  await supabase.from('merchant_status_events').insert({
    merchant_id: merchantId,
    event_type: eventType,
    from_value: fromValue,
    to_value: toValue,
  })
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

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { processPaymentSuccess } from '@/lib/payments/process-payment-success'

const bodySchema = z
  .object({
    merchant_api_key: z.string().min(1),
    customer_email: z.string().email().optional(),
    customer_phone: z.string().optional(),
    customer_name: z.string().min(1),
    transaction_amount: z.coerce.number().nonnegative().optional(),
    purchased_category: z.string().optional(),
  })
  .refine((data) => data.customer_email || data.customer_phone, {
    message: 'customer_email ou customer_phone requis',
    path: ['customer_email'],
  })

// Payment-terminal / POS webhook (Stripe Terminal, SumUp, Square, Payfit,
// Pennylane, or a till system) — fires the instant a sale is validated, so
// the customer's Wallet card shows up without ever scanning a QR code.
// Authenticated via merchant_api_key in the body (this endpoint's own spec,
// as opposed to /api/webhooks/customers/sync's Authorization header) since
// that's the shape most POS webhook configurators expect to send.
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('api_key', parsed.data.merchant_api_key)
      .maybeSingle()

    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await processPaymentSuccess(supabase, merchant.id, {
      customerEmail: parsed.data.customer_email,
      customerPhone: parsed.data.customer_phone,
      customerName: parsed.data.customer_name,
      transactionAmount: parsed.data.transaction_amount,
      purchasedCategory: parsed.data.purchased_category,
    })

    if (result.errors.length > 0) {
      return NextResponse.json({ error: result.errors[0] }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      customerId: result.customerId,
      cardId: result.cardId,
      pointsBalance: result.pointsBalance,
      pointsEarned: result.pointsEarned,
      smartLink: result.smartLink,
      emailSent: result.emailSent,
    })
  } catch (err) {
    console.error('[webhooks/payments/success] failed', err)
    return NextResponse.json(
      { error: 'Impossible de traiter le paiement.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

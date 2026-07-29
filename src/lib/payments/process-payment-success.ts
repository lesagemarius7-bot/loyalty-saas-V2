import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { loyaltyCardReadyEmail } from '@/lib/email/templates'
import { applyPurchasedCategory } from '@/lib/customers/purchase-habits'

type Client = SupabaseClient<Database>

// Same fallback as /api/customers/[customerId]/send-card — otherwise the
// Smart Link would literally read "undefined/api/passes/download/..." on any
// deployment where NEXT_PUBLIC_APP_URL isn't set. Same domain the email is
// sent from, for the same reason as that route.
const FALLBACK_APP_URL = 'https://loyaltyapp.click'

export interface PaymentSuccessInput {
  customerEmail?: string
  customerPhone?: string
  customerName: string
  transactionAmount?: number
  purchasedCategory?: string
}

export interface PaymentSuccessResult {
  customerId: string | null
  cardId: string | null
  pointsBalance: number | null
  pointsEarned: number
  smartLink: string | null
  emailSent: boolean
  errors: string[]
}

const EMPTY_RESULT: PaymentSuccessResult = {
  customerId: null,
  cardId: null,
  pointsBalance: null,
  pointsEarned: 0,
  smartLink: null,
  emailSent: false,
  errors: [],
}

// Called from POST /api/webhooks/payments/success — a real POS/checkout
// webhook (Stripe Terminal, SumUp, Square, etc.) telling us a payment just
// cleared. Upserts the customer, credits points using the program's own
// points_per_euro rate (already merchant-configurable in Design de la carte,
// just never actually applied to a real transaction until now), and — only
// if the merchant opted in via auto_send_on_payment_enabled — emails the
// Wallet card immediately so the customer never needs to scan a QR code in
// store. The Smart Link (/api/passes/download/[cardId], the same one used by
// "Envoyer par e-mail" and printed pass links elsewhere) is always returned
// regardless of the toggle, so a merchant on the "link_only" channel can put
// it on a digital receipt or send it through their own SMS provider — Loyalty
// has no SMS integration of its own, so that channel is genuinely just link
// generation, not a claim that we dispatch an SMS ourselves.
export async function processPaymentSuccess(supabase: Client, merchantId: string, input: PaymentSuccessInput): Promise<PaymentSuccessResult> {
  const email = input.customerEmail?.trim().toLowerCase() || undefined
  const phone = input.customerPhone?.trim() || undefined
  const fullName = input.customerName.trim()

  const { data: program, error: programError } = await supabase
    .from('loyalty_programs')
    .select('id, points_per_euro, auto_send_on_payment_enabled, auto_send_channel')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (programError) return { ...EMPTY_RESULT, errors: [programError.message] }
  if (!program) return { ...EMPTY_RESULT, errors: ['Aucun programme de fidélité actif pour ce marchand.'] }

  let customerId: string | null = null

  if (email) {
    const { data } = await supabase.from('customers').select('id').eq('merchant_id', merchantId).eq('email', email).maybeSingle()
    customerId = data?.id ?? null
  }
  if (!customerId && phone) {
    const { data } = await supabase.from('customers').select('id').eq('merchant_id', merchantId).eq('phone', phone).maybeSingle()
    customerId = data?.id ?? null
  }

  if (customerId) {
    // Keep the name fresh — a POS payment often carries a fuller name than
    // whatever was on hand at first enrollment.
    await supabase.from('customers').update({ full_name: fullName }).eq('id', customerId)
  } else {
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({ merchant_id: merchantId, full_name: fullName, email: email ?? null, phone: phone ?? null })
      .select('id')
      .single()

    if (createError || !created) {
      return { ...EMPTY_RESULT, errors: [createError?.message ?? 'Impossible de créer le client.'] }
    }
    customerId = created.id
  }

  const { data: existingCard } = await supabase
    .from('loyalty_cards')
    .select('id, points_balance')
    .eq('merchant_id', merchantId)
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle()

  let cardId: string
  if (existingCard) {
    cardId = existingCard.id
  } else {
    const { data: createdCard, error: cardError } = await supabase
      .from('loyalty_cards')
      .insert({ merchant_id: merchantId, customer_id: customerId, program_id: program.id })
      .select('id')
      .single()

    if (cardError || !createdCard) {
      return { ...EMPTY_RESULT, customerId, errors: [cardError?.message ?? 'Client créé, mais impossible de générer sa carte.'] }
    }
    cardId = createdCard.id
  }

  let pointsEarned = 0
  if (input.transactionAmount && input.transactionAmount > 0) {
    pointsEarned = Math.round(input.transactionAmount * program.points_per_euro)
    if (pointsEarned > 0) {
      const { error: txError } = await supabase.from('transactions').insert({
        merchant_id: merchantId,
        card_id: cardId,
        type: 'earn',
        points_delta: pointsEarned,
        note: input.purchasedCategory ? `Paiement en caisse — ${input.purchasedCategory}` : 'Paiement en caisse',
      })
      if (txError) {
        console.error('[process-payment-success] failed to credit points', cardId, txError)
        pointsEarned = 0
      }
    }
  }

  if (input.purchasedCategory) {
    await applyPurchasedCategory(supabase, merchantId, customerId, input.purchasedCategory)
  }

  const { data: refreshedCard } = await supabase.from('loyalty_cards').select('points_balance').eq('id', cardId).single()

  const smartLink = `${process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL}/api/passes/download/${cardId}`

  let emailSent = false
  if (program.auto_send_on_payment_enabled && program.auto_send_channel === 'email' && email && isEmailConfigured()) {
    const { data: merchant } = await supabase.from('merchants').select('business_name, brand_color').eq('id', merchantId).single()
    if (merchant) {
      try {
        const { subject, html, text } = loyaltyCardReadyEmail({
          merchantName: merchant.business_name,
          customerName: fullName,
          downloadUrl: smartLink,
          brandColor: merchant.brand_color,
        })
        await sendEmail({ to: email, subject, html, text })
        emailSent = true
      } catch (err) {
        console.error('[process-payment-success] failed to send enrollment email', customerId, err)
      }
    }
  }

  return {
    customerId,
    cardId,
    pointsBalance: refreshedCard?.points_balance ?? null,
    pointsEarned,
    smartLink,
    emailSent,
    errors: [],
  }
}

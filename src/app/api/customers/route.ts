import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
})

// Dashboard-only ("+ Nouveau client" on /dashboard/customers). Distinct from
// /api/customers/enroll, which is the public, unauthenticated self-enrollment
// route reached from /join/[merchantSlug] — this one runs as the logged-in
// merchant's own session so RLS (is_merchant_member) scopes the inserts to
// their own merchant_id, and creates the customer's first loyalty card in the
// same request so they show up ready-to-scan immediately.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant } = await supabase.from('merchants').select('id').eq('owner_id', user.id).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { firstName, lastName, email, phone } = parsed.data
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!program) {
      return NextResponse.json(
        { error: 'Aucun programme de fidélité actif — configurez-en un dans Design de la carte.' },
        { status: 400 }
      )
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ merchant_id: merchant.id, full_name: fullName, email, phone: phone || null })
      .select('id')
      .single()

    if (customerError || !customer) {
      const message =
        customerError?.code === '23505'
          ? 'Un client avec cet email existe déjà.'
          : (customerError?.message ?? 'Impossible de créer le client.')
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { data: card, error: cardError } = await supabase
      .from('loyalty_cards')
      .insert({ merchant_id: merchant.id, customer_id: customer.id, program_id: program.id })
      .select('id')
      .single()

    if (cardError || !card) {
      return NextResponse.json(
        { error: cardError?.message ?? 'Client créé, mais impossible de générer sa carte de fidélité.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ customerId: customer.id, cardId: card.id })
  } catch (err) {
    console.error('[customers] failed to create customer', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

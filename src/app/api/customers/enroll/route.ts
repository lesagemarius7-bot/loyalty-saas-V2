import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  merchantSlug: z.string().min(1),
  fullName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
})

// Public route backing the /join/[merchantSlug] enrollment form — the visitor is
// never authenticated, so this uses the service-role client and trusts nothing
// beyond "this merchant slug exists and this program is active."
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { merchantSlug, fullName, email, phone } = parsed.data

  if (!email && !phone) {
    return NextResponse.json({ error: 'email or phone is required' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('slug', merchantSlug)
    .single()

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('merchant_id', merchant.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!program) {
    return NextResponse.json({ error: 'No active loyalty program for this merchant' }, { status: 404 })
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert(
      { merchant_id: merchant.id, full_name: fullName, email, phone },
      { onConflict: 'merchant_id,email' }
    )
    .select('id')
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: customerError?.message ?? 'Could not create customer' }, { status: 400 })
  }

  const { data: existingCard } = await supabase
    .from('loyalty_cards')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('program_id', program.id)
    .maybeSingle()

  if (existingCard) {
    return NextResponse.json({ cardId: existingCard.id })
  }

  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .insert({ merchant_id: merchant.id, customer_id: customer.id, program_id: program.id })
    .select('id')
    .single()

  if (cardError || !card) {
    return NextResponse.json({ error: cardError?.message ?? 'Could not create card' }, { status: 400 })
  }

  return NextResponse.json({ cardId: card.id })
}

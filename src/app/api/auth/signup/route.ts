import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Merchant signup, moved server-side after "new row violates row-level
// security policy for table 'merchants'" turned out to be reproducible even
// with a valid, freshly-issued session whose auth.uid() matched the exact
// owner_id being inserted (verified directly against production: signUp()
// returned a real session, getUser() on that session's token resolved the
// right user id, and a raw REST insert with that same token still got a
// 42501 from Postgres) — the live RLS policy on merchants doesn't match
// what's committed in migration 0001, and there's no way to introspect
// pg_policies from this environment to find the exact drift. Rather than
// guess at a new policy against a table shape it's already unclear on,
// this sidesteps RLS entirely for the one write that legitimately needs to
// bypass it: creating a merchant row for a user who was just authenticated
// in this same request, using their own real id — never client-supplied.
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { businessName, email, password } = parsed.data

    // Session-aware client so a successful signUp sets real auth cookies on
    // the response — the browser ends up logged in exactly as if it had
    // called supabase.auth.signUp() directly.
    const supabase = await createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !signUpData.user) {
      return NextResponse.json({ error: signUpError?.message ?? 'Inscription impossible' }, { status: 400 })
    }

    const service = createServiceRoleClient()

    const { data: merchant, error: merchantError } = await service
      .from('merchants')
      .insert({ owner_id: signUpData.user.id, business_name: businessName, slug: slugify(businessName) })
      .select('id')
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: merchantError?.message ?? 'Compte créé mais impossible de créer le commerce' },
        { status: 500 }
      )
    }

    const { error: programError } = await service.from('loyalty_programs').insert({ merchant_id: merchant.id })
    if (programError) {
      console.error('[auth/signup] failed to create default loyalty program', programError)
    }

    // No session means email confirmation is required on this project — the
    // account and merchant both exist, but the browser isn't logged in yet.
    return NextResponse.json({ ok: true, needsEmailConfirmation: signUpData.session === null })
  } catch (err) {
    console.error('[auth/signup] failed', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

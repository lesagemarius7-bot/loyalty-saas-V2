import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getSuperAdminEmails } from '@/lib/auth/admin-guard'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { newSignupAdminAlertEmail } from '@/lib/email/approval-emails'

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

const bodySchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  ownerName: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(30).optional(),
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
//
// New merchants now land in approval_status = 'pending' — the dashboard
// layout gate (see (dashboard)/dashboard/layout.tsx) blocks them from the
// real dashboard until a super admin approves. This route's job stops at
// creating the pending row and alerting every real super admin; the actual
// gate lives in the layout, not here.
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { businessName, ownerName, email, phone, password } = parsed.data

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
      .insert({
        owner_id: signUpData.user.id,
        business_name: businessName,
        slug: slugify(businessName),
        owner_name: ownerName,
        phone: phone || null,
        approval_status: 'pending',
        poc_duration_days: 30,
      })
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

    // Best-effort — a merchant's pending request must not be lost just
    // because the alert email failed to send. They can still be found and
    // approved manually via /admin/merchants either way.
    if (isEmailConfigured()) {
      try {
        const superAdminEmails = await getSuperAdminEmails()
        if (superAdminEmails.length > 0) {
          const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL}/admin/merchants`
          const { subject, html, text } = newSignupAdminAlertEmail({
            businessName,
            ownerName,
            email,
            phone: phone || null,
            reviewUrl,
          })
          await Promise.all(superAdminEmails.map((to) => sendEmail({ to, subject, html, text })))
        } else {
          console.error('[auth/signup] no super admin found to alert')
        }
      } catch (err) {
        console.error('[auth/signup] failed to send admin alert email', err)
      }
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

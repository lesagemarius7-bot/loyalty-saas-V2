import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { importCustomers } from '@/lib/importers/import-customers'

const customerSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  last_purchased_category: z.string().optional(),
  current_stamps: z.coerce.number().int().min(0).optional(),
})

const bodySchema = z.object({
  customers: z.array(customerSchema).min(1).max(2000),
  // Sync flows default to true (unlike the dashboard's opt-in checkbox):
  // a POS/accounting integration calling this repeatedly is expected to be
  // pushing its own source of truth, not one-off manual list drops.
  overwriteExisting: z.boolean().default(true),
})

// External POS/accounting integration point (Stripe, Pennylane, QuickBooks,
// Square, SumUp, etc. — via whatever webhook/Zapier-style connector they
// support) — authenticated with the merchant's own api_key (Bearer token,
// see /dashboard/customers' import modal, "API" tab), not a session cookie.
// Reuses the exact same upsert/report logic as the dashboard's file-import
// flow via lib/importers/import-customers.
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const { data: merchant } = await supabase.from('merchants').select('id').eq('api_key', apiKey).maybeSingle()
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const report = await importCustomers(
      supabase,
      merchant.id,
      parsed.data.customers.map((c) => ({
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        lastPurchasedCategory: c.last_purchased_category,
        currentStamps: c.current_stamps,
      })),
      parsed.data.overwriteExisting
    )

    return NextResponse.json(report)
  } catch (err) {
    console.error('[webhooks/customers/sync] failed', err)
    return NextResponse.json(
      { error: "Import impossible.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

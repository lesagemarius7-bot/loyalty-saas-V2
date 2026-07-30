import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
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
  overwriteExisting: z.boolean().default(false),
})

// Backs the dashboard's import modal (final "confirm import" step, after
// file parsing + column mapping happened client-side against
// /api/customers/parse-file). Delivery of the actual upsert/report logic is
// shared with the POS/accounting webhook via lib/importers/import-customers.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { merchantId, dataClient } = await resolveMerchantId(supabase, user.id)
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const report = await importCustomers(
      dataClient,
      merchantId,
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
    console.error('[customers/import-bulk] failed', err)
    return NextResponse.json(
      { error: "Import impossible.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { deleteCustomers } from '@/lib/customers/delete-customers'

const bodySchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1).max(2000),
})

// Floating "🗑️ Supprimer (X)" action bar on /dashboard/customers, for
// multi-select bulk delete. POST (not DELETE) because the payload is a JSON
// body of ids — matches /api/notifications/send-bulk's shape.
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

    const result = await deleteCustomers(dataClient, merchantId, parsed.data.customerIds)

    if (result.errors.length > 0) {
      return NextResponse.json({ error: result.errors[0] }, { status: 400 })
    }

    return NextResponse.json({ deletedCount: result.deletedCount })
  } catch (err) {
    console.error('[customers/bulk-delete] failed', err)
    return NextResponse.json(
      { error: 'Impossible de supprimer ces clients.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

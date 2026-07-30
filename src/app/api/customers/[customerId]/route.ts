import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMerchantId } from '@/lib/auth/impersonation'
import { deleteCustomers } from '@/lib/customers/delete-customers'

// Trash icon on a single row in /dashboard/customers. Uses the authenticated
// (RLS-scoped) client — deleteCustomers additionally filters by merchant_id
// explicitly so a customerId belonging to another merchant can't be deleted
// even if RLS were ever misconfigured.
export async function DELETE(_request: Request, { params }: { params: Promise<{ customerId: string }> }) {
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

    const { customerId } = await params
    const result = await deleteCustomers(dataClient, merchantId, [customerId])

    if (result.errors.length > 0) {
      return NextResponse.json({ error: result.errors[0] }, { status: 400 })
    }
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })
    }

    return NextResponse.json({ deletedCount: result.deletedCount })
  } catch (err) {
    console.error('[customers/[customerId]] failed to delete customer', err)
    return NextResponse.json(
      { error: 'Impossible de supprimer ce client.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

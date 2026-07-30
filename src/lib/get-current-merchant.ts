import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonatedMerchant } from '@/lib/auth/impersonation'
import type { Merchant } from '@/types'

// Dashboard pages are Server Components — fetch the merchant row once per request
// here instead of duplicating the auth.getUser() + merchants query in every page.
// Only handles the owner account for now; extend with staff_members lookup if a
// staff login needs dashboard access beyond /dashboard/scan.
//
// `dataClient` matters during impersonation: this app's RLS policies only
// ever grant a session access to rows it owns (`owner_id = auth.uid()`), so
// a super admin's own session can read the merchant ROW itself (returned by
// getImpersonatedMerchant() via service role) but would be silently blocked
// by RLS querying that merchant's loyalty_cards/customers/transactions/etc.
// through their own session client. Callers that fetch merchant-scoped data
// (not just the merchant row) should use `dataClient`, not a fresh
// `createClient()`, so those reads/writes work correctly while
// impersonating instead of silently returning empty results.
export async function getCurrentMerchant(): Promise<{
  merchant: Merchant
  userId: string
  impersonating: boolean
  dataClient: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const impersonated = await getImpersonatedMerchant()
  if (impersonated) {
    return { merchant: impersonated, userId: user.id, impersonating: true, dataClient: createServiceRoleClient() }
  }

  // .maybeSingle(), not .single() — .single() errors on zero rows, which is a
  // real (if unexpected) state for a logged-in user whose merchant row wasn't
  // created yet, not something that should look identical to a genuine query
  // failure in the logs.
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[get-current-merchant] failed to fetch merchant', error)
  }

  if (!merchant) redirect('/login')

  return { merchant, userId: user.id, impersonating: false, dataClient: supabase }
}

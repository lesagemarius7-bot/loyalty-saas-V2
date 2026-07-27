import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Merchant } from '@/types'

// Dashboard pages are Server Components — fetch the merchant row once per request
// here instead of duplicating the auth.getUser() + merchants query in every page.
// Only handles the owner account for now; extend with staff_members lookup if a
// staff login needs dashboard access beyond /dashboard/scan.
export async function getCurrentMerchant(): Promise<{ merchant: Merchant; userId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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

  return { merchant, userId: user.id }
}

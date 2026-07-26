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

  const { data: merchant } = await supabase.from('merchants').select('*').eq('owner_id', user.id).single()

  if (!merchant) redirect('/login')

  return { merchant, userId: user.id }
}

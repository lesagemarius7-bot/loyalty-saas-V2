import { NextResponse } from 'next/server'
import { getCurrentUserAdminStatus } from '@/lib/auth/admin-guard'

// Used right after supabase.auth.signInWithPassword() on /admin/login and
// /login — a server-verified (service-role) check of is_super_admin,
// deliberately not a direct client-side `.from('merchants').select(...)`
// read, since that would depend on RLS behaving as expected for this table
// (already proven unreliable once in this project — see the merchants-
// insert signup bug).
export async function GET() {
  const status = await getCurrentUserAdminStatus()

  if (!status.loggedIn) {
    return NextResponse.json({ isSuperAdmin: false })
  }
  if (!status.isSuperAdmin) {
    return NextResponse.json({ isSuperAdmin: false })
  }
  return NextResponse.json({ isSuperAdmin: true, businessName: status.merchant.business_name })
}

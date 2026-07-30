import { NextResponse } from 'next/server'
import { stopImpersonation } from '@/lib/auth/impersonation'

// No auth guard needed — clearing a cookie is inherently harmless and
// idempotent, whether or not the caller was ever really impersonating.
export async function POST() {
  await stopImpersonation()
  return NextResponse.json({ ok: true })
}

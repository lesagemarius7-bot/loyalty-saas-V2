import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { startImpersonation } from '@/lib/auth/impersonation'

const bodySchema = z.object({ merchantId: z.string().uuid() })

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = createServiceRoleClient()
  const { data: merchant } = await service.from('merchants').select('id').eq('id', parsed.data.merchantId).maybeSingle()
  if (!merchant) {
    return NextResponse.json({ error: 'Commerçant introuvable.' }, { status: 404 })
  }

  await startImpersonation(merchant.id)
  return NextResponse.json({ ok: true })
}

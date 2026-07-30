import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserAdminStatus } from '@/lib/auth/admin-guard'
import type { Merchant } from '@/types'

const COOKIE_NAME = 'impersonated_merchant_id'
const TTL_SECONDS = 60 * 60

// Reuses an existing server-only secret (never sent to any client) purely
// as an HMAC key, instead of requiring a new env var just for this cookie.
function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!
}

function sign(merchantId: string, expiresAt: number): string {
  return createHmac('sha256', secret()).update(`${merchantId}.${expiresAt}`).digest('hex')
}

function buildCookieValue(merchantId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS
  return `${merchantId}.${expiresAt}.${sign(merchantId, expiresAt)}`
}

// Verifies signature + expiry only. Deliberately does NOT by itself prove
// the caller is a super admin right now — see getImpersonatedMerchant,
// which layers that check on top. A cookie's raw bytes are always
// reproducible by whoever holds the browser (devtools, curl); the real
// security boundary here is the live Supabase session check, not this
// signature — the signature only proves "this value really was issued by
// this server for this merchant", not "the current bearer is authorized".
function verifyCookieValue(value: string): string | null {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [merchantId, expiresAtStr, providedSig] = parts
  const expiresAt = Number(expiresAtStr)
  if (!merchantId || !Number.isFinite(expiresAt)) return null
  if (Math.floor(Date.now() / 1000) > expiresAt) return null

  const expectedSig = sign(merchantId, expiresAt)
  const expectedBuf = Buffer.from(expectedSig, 'hex')
  const providedBuf = Buffer.from(providedSig ?? '', 'hex')
  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) return null

  return merchantId
}

export async function startImpersonation(merchantId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, buildCookieValue(merchantId), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  })
}

export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// The actual authorization boundary: even a perfectly-signed, unexpired
// cookie is ignored unless the CURRENT request's real Supabase session (a
// JWT re-verified against Supabase Auth via getCurrentUserAdminStatus, not
// just trusted from a cookie) belongs to a genuine super admin. This is
// what stops anyone from forging or replaying the cookie to impersonate an
// arbitrary merchant without ever having a real admin session — without
// one, the cookie is inert no matter its contents.
export async function getImpersonatedMerchantId(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null

  const merchantId = verifyCookieValue(raw)
  if (!merchantId) return null

  const status = await getCurrentUserAdminStatus()
  if (!status.loggedIn || !status.isSuperAdmin) return null

  return merchantId
}

export async function getImpersonatedMerchant(): Promise<Merchant | null> {
  const merchantId = await getImpersonatedMerchantId()
  if (!merchantId) return null

  const service = createServiceRoleClient()
  const { data: merchant } = await service.from('merchants').select('*').eq('id', merchantId).maybeSingle<Merchant>()
  return merchant ?? null
}

type SessionClient = ReturnType<typeof createServiceRoleClient>

// Used by every /api/* route that otherwise resolves "the current merchant"
// via `.eq('owner_id', user.id)` on the session client. This app's RLS
// policies only ever grant a session access to rows it owns, so a super
// admin's own session querying by a DIFFERENT merchant's id would just be
// silently blocked by RLS (empty result, not an error) — resolving the id
// alone isn't enough; every subsequent merchant-scoped query also needs
// createServiceRoleClient() instead of the session client once
// impersonation is active. Returns the SAME sessionClient unchanged for the
// normal (non-impersonating) case — zero behavior change for the vast
// majority of requests — and only substitutes a service-role client when
// actually impersonating.
export async function resolveMerchantId(
  sessionClient: SessionClient,
  userId: string
): Promise<{ merchantId: string; dataClient: SessionClient } | { merchantId: null; dataClient: SessionClient }> {
  const impersonatedId = await getImpersonatedMerchantId()
  if (impersonatedId) {
    return { merchantId: impersonatedId, dataClient: createServiceRoleClient() }
  }

  const { data } = await sessionClient.from('merchants').select('id').eq('owner_id', userId).maybeSingle()
  return { merchantId: data?.id ?? null, dataClient: sessionClient }
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// For use in Server Components, Route Handlers, and Server Actions. Subject to RLS
// via the caller's session — use this for anything a dashboard user reads/writes
// directly.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component that can't set cookies — safe to ignore
            // because the middleware refreshes the session on every request anyway.
          }
        },
      },
    }
  )
}

// Bypasses RLS entirely. Only use inside trusted server-side code that has already
// established the caller's identity/authorization by other means: webhooks (Stripe
// signature verified), the public enrollment/scan API routes, and the PassKit web
// service (Apple's own auth token). Never expose this client to a route that trusts
// unauthenticated user input to select which rows it touches.
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

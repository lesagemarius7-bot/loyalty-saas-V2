import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

// /admin's authoritative check (the real is_super_admin flag) lives in
// requireSuperAdmin() (lib/auth/admin-guard.ts), run server-side in the
// (admin) layout — that's a DB round trip per request, so it belongs in the
// layout, not here. Middleware only handles the cheap, cookie-only part
// every protected route needs anyway: bounce logged-out visitors to /login
// before they even reach a page that would 403/redirect them a second time.
const PROTECTED_PREFIXES = ['/dashboard', '/admin']
// /admin/login must stay reachable by a logged-out visitor — it IS the
// entry point, unlike everything else under /admin. It does its own
// session/role check server-side (see the page itself), so it doesn't need
// the middleware's cheap logged-out bounce.
const PUBLIC_EXCEPTIONS = ['/admin/login']

// Refreshes the Supabase session cookie on every request and redirects
// unauthenticated visitors away from protected routes. Called from
// src/middleware.ts, which owns the route matcher.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // IMPORTANT: do not remove — getUser() revalidates the JWT against Supabase Auth
  // on every call, unlike getSession() which trusts the cookie as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix)) &&
    !PUBLIC_EXCEPTIONS.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

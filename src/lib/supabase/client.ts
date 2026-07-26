import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// For use in Client Components ("use client"). Reads the session from cookies set
// by the server helpers below — do not instantiate a second client with different
// storage, or the two will disagree about the current session.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

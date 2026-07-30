'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Store, ScrollText, LogOut, ShieldCheck, LineChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Two groups, not one flat list: the first three are business-facing
// dashboards (overview → drill into a merchant → money), the last is a
// technical/support tool (Wallet send history + system error logs) — a
// different kind of page, so it gets a visual break rather than blending
// into the same list. Label is "Logs", not the old "Journal des envois" —
// that name went stale the moment the page grew a technical-logs tab
// alongside the Wallet-send journal (see (protected)/logs/page.tsx's h1).
const NAV_GROUPS = [
  [
    { href: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, exact: true },
    { href: '/admin/merchants', label: 'Commerçants', icon: Store, exact: false },
    { href: '/admin/finance', label: 'Finance', icon: LineChart, exact: false },
  ],
  [{ href: '/admin/logs', label: 'Logs', icon: ScrollText, exact: false }],
]

// Deliberately its own dark look (hardcoded slate, not this app's semantic
// light-theme tokens) — a merchant's own dashboard is intentionally never
// dark, so a visibly different color scheme here is the signal that you're
// in the platform backoffice, not a merchant account. The accent color is
// still the real Loyalty brand indigo (#453ee8, sampled from the actual
// logo — see globals.css's --primary comment), not a generic Tailwind
// indigo shade, so it reads as "Loyalty, dark mode" rather than an
// unrelated admin template.
export function AdminSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [logoFailed, setLogoFailed] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4 text-slate-100">
      <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2 py-3 hover:bg-slate-800">
        {logoFailed ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#453ee8] text-white">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
        ) : (
          // White badge behind the mark — the source PNG has a flattened
          // white background (no alpha channel), so placing it directly on
          // this dark sidebar would show as a jarring white square without
          // the badge treatment.
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mark.png"
              alt="Loyalty"
              className="h-full w-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Administrateur</p>
          <p className="truncate text-xs text-slate-400">{businessName}</p>
        </div>
      </Link>

      <nav className="flex-1 pt-4">
        {NAV_GROUPS.map((group, i) => (
          <div key={i} className={cn('space-y-1', i > 0 && 'mt-4 border-t border-slate-800 pt-4')}>
            {group.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-[#453ee8] text-white' : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </aside>
  )
}

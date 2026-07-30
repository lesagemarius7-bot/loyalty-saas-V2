'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Store, ScrollText, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, exact: true },
  { href: '/admin/merchants', label: 'Commerçants', icon: Store, exact: false },
  { href: '/admin/logs', label: 'Journal des envois', icon: ScrollText, exact: false },
]

// Deliberately its own dark/violet look (hardcoded slate/indigo, not this
// app's semantic light-theme tokens) — a merchant's own dashboard is
// intentionally never dark, so a visibly different color scheme here is the
// signal that you're in the platform backoffice, not a merchant account.
export function AdminSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4 text-slate-100">
      <div className="flex items-center gap-2.5 px-2 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-slate-950">
          <ShieldCheck className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Super Admin</p>
          <p className="truncate text-xs text-slate-400">{businessName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 pt-4">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Mon dashboard
      </Link>
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

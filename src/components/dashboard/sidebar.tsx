'use client'

import { useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  QrCode,
  Gift,
  Palette,
  Megaphone,
  Zap,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

// Grouped by how a merchant actually uses each page day-to-day rather than
// alphabetically or by build order — daily-counter tools first, CRM/growth
// second, pass configuration third (touched rarely, once set up), account
// admin last.
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { label: 'Vue d’ensemble', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Scanner', href: '/dashboard/scan', icon: QrCode },
    ],
  },
  {
    title: 'Marketing & clients',
    items: [
      { label: 'Clients', href: '/dashboard/customers', icon: Users },
      { label: 'Ask Loyalty AI', href: '/dashboard/ai', icon: Sparkles, badge: 'AI' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Megaphone },
      { label: 'Automatisation ⚡', href: '/dashboard/playbooks', icon: Zap },
    ],
  },
  {
    title: 'Carte & programme',
    items: [
      { label: 'Programme', href: '/dashboard/campaigns', icon: Gift },
      { label: 'Design de la carte', href: '/dashboard/card-design', icon: Palette },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { label: 'Facturation', href: '/dashboard/billing', icon: CreditCard },
      { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export function DashboardSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [logoFailed, setLogoFailed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const logo = logoFailed ? (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
      L
    </span>
  ) : (
    // Fixed local asset, no benefit from next/image's remote optimization
    // pipeline — onError needs a plain <img> to swap to the letter-badge
    // fallback above.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo-mark.png"
      alt="Loyalty"
      className="h-8 w-8 shrink-0 rounded-lg object-contain"
      onError={() => setLogoFailed(true)}
    />
  )

  const navContent = (
    <nav className="flex-1 space-y-1 overflow-y-auto">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.title}>
          <p
            className={cn(
              'mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground',
              index === 0 ? 'mt-0' : 'mt-4'
            )}
          >
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-accent/10 text-accent'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar — the desktop sidebar is fixed/hidden below md, so
          this is the only way to reach navigation or sign out on a phone.
          Sticky (not just top-of-flow) so it stays reachable while the page
          content below it scrolls. */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 p-4 backdrop-blur-md md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          {logo}
          <span className="truncate text-base font-bold">{businessName}</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-foreground hover:opacity-80"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-xs flex-col overflow-y-auto border-r border-border bg-background p-4 transition-transform duration-200 md:static md:z-auto md:h-screen md:w-64 md:max-w-none md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-2 py-3 md:justify-start md:gap-2.5">
          <div className="flex items-center gap-2.5">
            {logo}
            <span className="truncate text-sm font-semibold">{businessName}</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {navContent}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </aside>
    </>
  )
}

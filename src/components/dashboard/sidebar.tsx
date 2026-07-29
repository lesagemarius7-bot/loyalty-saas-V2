'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, QrCode, Gift, Palette, Megaphone, Zap, Settings, CreditCard, LogOut, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Clients', icon: Users },
  { href: '/dashboard/ai', label: 'Ask Loyalty AI', icon: Sparkles },
  { href: '/dashboard/scan', label: 'Scanner', icon: QrCode },
  { href: '/dashboard/campaigns', label: 'Programme', icon: Gift },
  { href: '/dashboard/card-design', label: 'Design de la carte', icon: Palette },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Megaphone },
  { href: '/dashboard/playbooks', label: 'Automatisation ⚡', icon: Zap },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
  { href: '/dashboard/billing', label: 'Facturation', icon: CreditCard },
]

export function DashboardSidebar({ businessName }: { businessName: string }) {
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
    <aside className="flex h-screen w-64 flex-col border-r border-border p-4">
      <div className="flex items-center gap-2.5 px-2 py-3">
        {logoFailed ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            L
          </span>
        ) : (
          // Fixed local asset, no benefit from next/image's remote
          // optimization pipeline — onError needs a plain <img> to swap to
          // the letter-badge fallback below.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/logo-mark.png"
            alt="Loyalty"
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
        <span className="truncate text-sm font-semibold">{businessName}</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </aside>
  )
}

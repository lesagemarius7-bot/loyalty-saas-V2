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
  Sparkles,
  Plug,
  type LucideIcon,
} from 'lucide-react'
import { LogoMark } from './Logo'
import { cn } from '../lib'

// Ported from loyalty-saas/src/components/dashboard/sidebar.tsx — identical
// grouping/labels/icons/order, state-driven (`activeHref`) instead of
// usePathname() since there's no router here.
interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}
interface NavSection {
  title: string
  items: NavItem[]
}

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
      { label: 'Intégrations', href: '/dashboard/integrations', icon: Plug },
      { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export function DashboardSidebar({ businessName = 'Sushi Yama', activeHref = '/dashboard' }: { businessName?: string; activeHref?: string }) {
  return (
    <div style={{ width: 272, height: '100%', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 16 }}>
      <div className="flex items-center gap-2.5" style={{ padding: '4px 8px 20px' }}>
        <LogoMark style={{ width: 32, height: 32, borderRadius: 8 }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1729' }}>{businessName}</span>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title} style={{ marginTop: index === 0 ? 0 : 16 }}>
            <p style={{ margin: '0 0 4px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' }}>
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = item.href === activeHref
              const Icon = item.icon
              return (
                <div
                  key={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg text-sm font-medium',
                    active ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                  style={{ padding: '9px 12px', marginBottom: 2 }}
                >
                  <Icon size={17} strokeWidth={2.2} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        active ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

// macOS-style browser chrome, same spirit as PhoneFrame but for the
// dashboard side of the split — reads instantly as "a real desktop app"
// without needing an actual screen recording.
export function BrowserFrame({ children, width = 1240, height = 760 }: { children: React.ReactNode; width?: number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 50px 100px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(15,23,41,0.08)',
      }}
    >
      <div style={{ height: 40, background: '#f3f4f6', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 7, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ width: 11, height: 11, borderRadius: 999, background: '#ff5f57' }} />
        <div style={{ width: 11, height: 11, borderRadius: 999, background: '#febc2e' }} />
        <div style={{ width: 11, height: 11, borderRadius: 999, background: '#28c840' }} />
        <div
          style={{
            margin: '0 auto',
            fontSize: 12,
            color: '#6b7280',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '3px 14px',
          }}
        >
          app.loyalty.fr/dashboard
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ width: '100%', height: height - 40, display: 'flex' }}>{children}</div>
    </div>
  )
}

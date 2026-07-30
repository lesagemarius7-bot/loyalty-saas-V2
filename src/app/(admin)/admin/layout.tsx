import { requireSuperAdmin } from '@/lib/auth/admin-guard'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

// Mirrors (dashboard)/dashboard/layout.tsx's nesting (layout one level below
// the route group, not at the group root) for consistency with the existing
// convention in this codebase.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const merchant = await requireSuperAdmin()

  return (
    <div className="flex min-h-screen bg-slate-900">
      <AdminSidebar businessName={merchant.business_name} />
      <main className="flex-1 overflow-y-auto p-8 text-slate-100">{children}</main>
    </div>
  )
}

import { createServiceRoleClient } from '@/lib/supabase/server'
import { listAdminMerchants } from '@/lib/analytics/admin-merchants-list'
import { AdminMerchantsTable } from '@/components/admin/admin-merchants-table'

export default async function AdminMerchantsPage() {
  const service = createServiceRoleClient()
  const merchants = await listAdminMerchants(service)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Commerçants</h1>
        <p className="text-slate-400">{merchants.length} commerçant(s) inscrit(s) sur la plateforme.</p>
      </div>

      <AdminMerchantsTable merchants={merchants} />
    </div>
  )
}

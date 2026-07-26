import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { merchant } = await getCurrentMerchant()

  return (
    <div className="flex">
      <DashboardSidebar businessName={merchant.business_name} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

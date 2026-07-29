import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { merchant } = await getCurrentMerchant()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar businessName={merchant.business_name} />
      <main className="w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  )
}

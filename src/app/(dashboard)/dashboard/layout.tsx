import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { PendingApprovalScreen } from '@/components/dashboard/pending-approval-screen'
import { ImpersonationBanner } from '@/components/dashboard/impersonation-banner'
import { cn } from '@/lib/utils'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { merchant, impersonating } = await getCurrentMerchant()

  // Blocks every nested /dashboard/* route at this single choke point —
  // pending/rejected merchants never reach Scanner, Clients, Programme,
  // etc. is_super_admin accounts are unaffected (the backfill in migration
  // 0018 sets every pre-existing merchant, including the admin's own shell
  // account, to 'approved').
  if (merchant.approval_status === 'pending' || merchant.approval_status === 'rejected') {
    return <PendingApprovalScreen status={merchant.approval_status} />
  }

  return (
    <div className={cn('flex min-h-screen flex-col md:flex-row', impersonating && 'pt-11')}>
      {impersonating && <ImpersonationBanner businessName={merchant.business_name} merchantId={merchant.id} />}
      <DashboardSidebar businessName={merchant.business_name} />
      <main className="w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  )
}

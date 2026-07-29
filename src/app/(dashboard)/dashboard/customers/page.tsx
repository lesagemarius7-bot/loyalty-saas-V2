import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { NewCustomerButton } from '@/components/dashboard/new-customer-button'
import { ImportCustomersButton } from '@/components/dashboard/customers/import-customers-button'
import { CustomersTable } from '@/components/dashboard/customers/customers-table'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function CustomersPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const supabase = await createClient()

    const [
      { data: customers, error: customersError },
      { data: templates, error: templatesError },
      { data: program },
    ] = await Promise.all([
      supabase
        .from('customers')
        .select(
          '*, loyalty_cards(points_balance, status), customer_purchase_habits(favorite_category, last_purchased_category, last_transaction_at)'
        )
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('notification_templates')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('loyalty_programs')
        .select('reward_threshold')
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
    ])

    if (customersError) {
      console.error('[dashboard/customers] failed to fetch customers', customersError)
    }
    if (templatesError) {
      console.error('[dashboard/customers] failed to fetch templates', templatesError)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-muted-foreground">{customers?.length ?? 0} client(s) inscrits.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ImportCustomersButton apiKey={merchant.api_key} />
            <NewCustomerButton />
          </div>
        </div>

        <CustomersTable
          customers={customers ?? []}
          loadError={customersError?.message ?? null}
          merchant={merchant}
          templates={templates ?? []}
          rewardThreshold={program?.reward_threshold ?? null}
        />
      </div>
    )
  } catch (err) {
    console.error('[dashboard/customers] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger les clients"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}

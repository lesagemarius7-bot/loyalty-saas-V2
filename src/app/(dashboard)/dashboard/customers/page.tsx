import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { NewCustomerButton } from '@/components/dashboard/new-customer-button'
import { CustomersTable } from '@/components/dashboard/customers/customers-table'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function CustomersPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const supabase = await createClient()

    const [{ data: customers, error: customersError }, { data: templates, error: templatesError }] = await Promise.all([
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
    ])

    if (customersError) {
      console.error('[dashboard/customers] failed to fetch customers', customersError)
    }
    if (templatesError) {
      console.error('[dashboard/customers] failed to fetch templates', templatesError)
    }

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-muted-foreground">{customers?.length ?? 0} client(s) inscrits.</p>
          </div>
          <NewCustomerButton />
        </div>

        <CustomersTable
          customers={customers ?? []}
          loadError={customersError?.message ?? null}
          merchant={merchant}
          templates={templates ?? []}
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

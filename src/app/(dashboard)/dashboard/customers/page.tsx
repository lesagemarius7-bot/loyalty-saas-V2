import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SendCardEmailButton } from '@/components/dashboard/send-card-email-button'
import { NewCustomerButton } from '@/components/dashboard/new-customer-button'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'

export default async function CustomersPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const supabase = await createClient()

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*, loyalty_cards(points_balance, status)')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })

    if (customersError) {
      console.error('[dashboard/customers] failed to fetch customers', customersError)
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

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Nom</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Points</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(customers ?? []).map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 font-medium">{customer.full_name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{customer.email ?? customer.phone ?? '—'}</td>
                    <td className="px-6 py-3">{customer.loyalty_cards?.[0]?.points_balance ?? 0}</td>
                    <td className="px-6 py-3">
                      <Badge variant={customer.loyalty_cards?.[0]?.status === 'active' ? 'success' : 'secondary'}>
                        {customer.loyalty_cards?.[0]?.status ?? 'active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <SendCardEmailButton customerId={customer.id} hasEmail={Boolean(customer.email)} />
                    </td>
                  </tr>
                ))}
                {(customers ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {customersError
                        ? `Impossible de charger les clients (${customersError.message}).`
                        : 'Aucun client pour le moment. Partagez votre lien d’inscription pour commencer.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
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

import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SendCardEmailButton } from '@/components/dashboard/send-card-email-button'
import { NewCustomerButton } from '@/components/dashboard/new-customer-button'

export default async function CustomersPage() {
  const { merchant } = await getCurrentMerchant()
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*, loyalty_cards(points_balance, status)')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })

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
                    Aucun client pour le moment. Partagez votre lien d’inscription pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

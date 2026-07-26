import { Users, CreditCard, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

export default async function DashboardOverviewPage() {
  const { merchant } = await getCurrentMerchant()
  const supabase = await createClient()

  const [{ count: customerCount }, { count: cardCount }, { data: recentTransactions }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase
      .from('transactions')
      .select('points_delta, type, created_at, loyalty_cards(customer:customers(full_name))')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const pointsIssuedThisMonth = (recentTransactions ?? [])
    .filter((t) => t.type === 'earn' && new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.points_delta, 0)

  const stats = [
    { label: 'Clients', value: customerCount ?? 0, icon: Users },
    { label: 'Cartes actives', value: cardCount ?? 0, icon: CreditCard },
    { label: 'Points ce mois-ci', value: pointsIssuedThisMonth, icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Vue d’ensemble</h1>
        <p className="text-muted-foreground">Bienvenue, {merchant.business_name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentTransactions.map((t, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span>{t.loyalty_cards?.customer?.full_name ?? 'Client'}</span>
                  <span className={t.points_delta >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                    {t.points_delta >= 0 ? '+' : ''}
                    {t.points_delta} pts
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune activité pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

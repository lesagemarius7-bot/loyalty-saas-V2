import { createServiceRoleClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'secondary'> = {
  success: 'success',
  failed: 'destructive',
  uninstalled: 'secondary',
  pending: 'secondary',
}

export default async function AdminLogsPage() {
  const service = createServiceRoleClient()

  const { data: deliveries } = await service
    .from('notification_deliveries')
    .select('id, platform, status, message_text, error_details, sent_at, merchant:merchants(business_name)')
    .order('sent_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Journal des envois</h1>
        <p className="text-slate-400">Les 100 derniers envois Wallet (Apple/Google), tous commerçants confondus.</p>
      </div>

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="py-3 text-sm text-amber-900">
          Les envois e-mail (Resend) et les événements webhook bruts (POS/paiement) ne sont pas journalisés de
          manière persistante dans ce projet aujourd’hui — seuls les envois Wallet (Apple/Google) le sont, via la
          table <code className="rounded bg-amber-100 px-1">notification_deliveries</code>. Le tableau ci-dessous
          reflète honnêtement ce qui existe réellement en base.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Envois Wallet (Apple / Google)</CardTitle>
          <CardDescription>Un événement par (client, plateforme) et par envoi.</CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-full overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Commerçant</th>
                <th className="px-4 py-3 font-medium">Plateforme</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {!deliveries || deliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun envoi enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{d.merchant?.business_name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{d.platform}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground" title={d.message_text}>
                      {d.message_text}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[d.status] ?? 'secondary'}>{d.status}</Badge>
                      {d.error_details && (
                        <p className="mt-1 max-w-xs truncate text-xs text-destructive" title={d.error_details}>
                          {d.error_details}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(d.sent_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

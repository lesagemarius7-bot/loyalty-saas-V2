import { createServiceRoleClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle, AdminCardDescription } from '@/components/admin/admin-card'
import { AdminBadge } from '@/components/admin/admin-badge'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { SystemLogsTable } from '@/components/admin/system-logs-table'
import type { SystemLog } from '@/types'

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'secondary'> = {
  success: 'success',
  failed: 'destructive',
  uninstalled: 'secondary',
  pending: 'secondary',
}

const LEVELS: SystemLog['level'][] = ['critical', 'error', 'warning', 'info']
const CATEGORIES: SystemLog['category'][] = ['apns', 'google_wallet', 'resend', 'stripe', 'cron', 'webhook']

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; category?: string; q?: string }>
}) {
  const { level, category, q } = await searchParams
  const hasFilters = Boolean(level || category || q)
  const service = createServiceRoleClient()

  const { data: deliveries } = await service
    .from('notification_deliveries')
    .select('id, platform, status, message_text, error_details, sent_at, merchant:merchants(business_name)')
    .order('sent_at', { ascending: false })
    .limit(100)

  let systemLogsQuery = service
    .from('system_logs')
    .select('*, merchant:merchants(business_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (level && LEVELS.includes(level as SystemLog['level'])) {
    systemLogsQuery = systemLogsQuery.eq('level', level as SystemLog['level'])
  }
  if (category && CATEGORIES.includes(category as SystemLog['category'])) {
    systemLogsQuery = systemLogsQuery.eq('category', category as SystemLog['category'])
  }
  if (q) systemLogsQuery = systemLogsQuery.ilike('message', `%${q}%`)

  const { data: systemLogs } = await systemLogsQuery

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Journal des envois & logs techniques</h1>
        <p className="text-slate-400">Envois Wallet et événements techniques (APNs, Google Wallet, Resend, Stripe, crons, webhooks).</p>
      </div>

      <AdminTabs
        defaultTabId={hasFilters ? 'system' : undefined}
        tabs={[
          {
            id: 'wallet',
            label: '📲 Envois Wallet',
            content: (
              <div className="space-y-4">
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="py-3 text-sm text-amber-900">
                    Les envois e-mail (Resend) et les événements webhook bruts (POS/paiement) ne sont pas journalisés
                    ici — seuls les envois Wallet (Apple/Google) apparaissent dans ce tableau, via la table{' '}
                    <code className="rounded bg-amber-100 px-1">notification_deliveries</code>. Les échecs
                    e-mail/webhook/Stripe/cron apparaissent dans l’onglet « Logs techniques ».
                  </CardContent>
                </Card>

                <AdminCard>
                  <AdminCardHeader>
                    <AdminCardTitle className="text-base">Envois Wallet (Apple / Google)</AdminCardTitle>
                    <AdminCardDescription>Un événement par (client, plateforme) et par envoi.</AdminCardDescription>
                  </AdminCardHeader>
                  <AdminCardContent className="w-full max-w-full overflow-x-auto p-0">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-slate-400">
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
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                              Aucun envoi enregistré pour le moment.
                            </td>
                          </tr>
                        ) : (
                          deliveries.map((d) => (
                            <tr key={d.id} className="border-b border-slate-800 last:border-0">
                              <td className="px-4 py-3 font-medium text-slate-100">{d.merchant?.business_name ?? '—'}</td>
                              <td className="px-4 py-3 capitalize text-slate-400">{d.platform}</td>
                              <td className="px-4 py-3 max-w-xs truncate text-slate-400" title={d.message_text}>
                                {d.message_text}
                              </td>
                              <td className="px-4 py-3">
                                <AdminBadge variant={STATUS_VARIANT[d.status] ?? 'secondary'}>{d.status}</AdminBadge>
                                {d.error_details && (
                                  <p className="mt-1 max-w-xs truncate text-xs text-red-400" title={d.error_details}>
                                    {d.error_details}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-400">{new Date(d.sent_at).toLocaleString('fr-FR')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </AdminCardContent>
                </AdminCard>
              </div>
            ),
          },
          {
            id: 'system',
            label: '🛠️ Logs techniques',
            content: (
              <AdminCard>
                <AdminCardHeader>
                  <AdminCardTitle className="text-base">Logs techniques</AdminCardTitle>
                  <AdminCardDescription>
                    APNs, Google Wallet, Resend, Stripe, crons, webhooks — les 200 derniers événements. Une alerte
                    e-mail est envoyée automatiquement aux Super Admins pour chaque log de niveau critique.
                  </AdminCardDescription>
                </AdminCardHeader>
                <AdminCardContent className="space-y-4">
                  <form method="GET" className="flex flex-wrap items-end gap-3 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Niveau</label>
                      <select
                        name="level"
                        defaultValue={level ?? ''}
                        className="block rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
                      >
                        <option value="">Tous</option>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Catégorie</label>
                      <select
                        name="category"
                        defaultValue={category ?? ''}
                        className="block rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
                      >
                        <option value="">Toutes</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Recherche</label>
                      <input
                        type="text"
                        name="q"
                        defaultValue={q ?? ''}
                        placeholder="Message…"
                        className="block rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md bg-[#453ee8] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#706af1]"
                    >
                      Filtrer
                    </button>
                    {hasFilters && (
                      <a href="/admin/logs" className="text-sm text-slate-400 underline">
                        Réinitialiser
                      </a>
                    )}
                  </form>

                  <SystemLogsTable logs={systemLogs ?? []} />
                </AdminCardContent>
              </AdminCard>
            ),
          },
        ]}
      />
    </div>
  )
}

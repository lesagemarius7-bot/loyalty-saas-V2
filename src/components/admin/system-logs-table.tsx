import { Badge } from '@/components/ui/badge'
import type { SystemLog, Merchant } from '@/types'

const LEVEL_VARIANT: Record<SystemLog['level'], 'destructive' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  error: 'destructive',
  warning: 'secondary',
  info: 'outline',
}

const LEVEL_LABELS: Record<SystemLog['level'], string> = {
  critical: '🔴 Critique',
  error: '🟠 Erreur',
  warning: '🟡 Avertissement',
  info: 'ℹ️ Info',
}

type LogWithMerchant = SystemLog & { merchant: Pick<Merchant, 'business_name'> | null }

export function SystemLogsTable({ logs }: { logs: LogWithMerchant[] }) {
  if (logs.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-400">Aucun log ne correspond à ces filtres.</p>
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-slate-400">
            <th className="px-4 py-3 font-medium">Niveau</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Commerçant</th>
            <th className="px-4 py-3 font-medium">Message</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-slate-800 align-top last:border-0">
              <td className="px-4 py-3">
                <Badge variant={LEVEL_VARIANT[log.level]}>{LEVEL_LABELS[log.level]}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.category}</td>
              <td className="px-4 py-3 text-slate-300">{log.merchant?.business_name ?? '—'}</td>
              <td className="px-4 py-3 text-slate-200">
                <p>{log.message}</p>
                {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-[#706af1]">Voir les détails</summary>
                    <pre className="mt-1 max-w-md overflow-x-auto rounded-md bg-slate-950 p-2 text-xs text-slate-400">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                {new Date(log.created_at).toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

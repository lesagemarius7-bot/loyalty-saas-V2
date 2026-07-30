import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { PocHealthEntry } from '@/lib/analytics/admin-finance'

const SCORE_META: Record<PocHealthEntry['score'], { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  high: { label: '🟢 Fort', variant: 'success' },
  medium: { label: '🟡 Moyen', variant: 'secondary' },
  low: { label: '🔴 Faible', variant: 'destructive' },
}

export function PocHealthTable({ entries }: { entries: PocHealthEntry[] }) {
  const weightedPipelineMrr = Math.round(entries.reduce((sum, e) => sum + e.weightedMrrEur, 0) * 100) / 100
  const sorted = [...entries].sort((a, b) => {
    const order = { low: 0, medium: 1, high: 2 }
    return order[a.score] - order[b.score]
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>🔮 Pipeline MRR pondéré (POC en cours)</CardDescription>
          <CardTitle className="text-3xl">{weightedPipelineMrr} €</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          MRR potentiel × probabilité de conversion estimée par score (🟢 90% · 🟡 40% · 🔴 10%) — une hypothèse
          documentée, pas un taux observé (pas encore assez d’historique de conversions réelles).
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maturité des commerçants en essai</CardTitle>
          <CardDescription>
            🟢 Fort : &gt;15 tampons + notifications configurées + Wallet installé. 🟡 Moyen : cas intermédiaires.
            🔴 Faible : aucune activité depuis plus de 7 jours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun commerçant en POC actuellement.</p>
          ) : (
            sorted.map((entry) => (
              <Link
                key={entry.merchantId}
                href={`/admin/merchants/${entry.merchantId}`}
                className="flex flex-col gap-2 rounded-md border border-slate-800 px-4 py-3 hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{entry.businessName}</p>
                  <p className="text-xs text-slate-400">
                    {entry.stampsScanned} tampon(s) · Wallet {entry.walletInstalled ? 'installé' : 'non installé'} ·
                    Notifications {entry.notificationsConfigured ? 'configurées' : 'non configurées'} ·{' '}
                    {entry.daysSinceLastActivity !== null
                      ? `inactif depuis ${entry.daysSinceLastActivity} j`
                      : 'aucune activité'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{entry.daysRemaining} j restant(s)</span>
                  <Badge variant={SCORE_META[entry.score].variant}>{SCORE_META[entry.score].label}</Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardOverview } from '@/lib/analytics/dashboard-overview'

const WINDOWS = [7, 30, 90] as const

export function WalletInstallsChart({
  initialData,
  initialWindowDays,
}: {
  initialData: DashboardOverview['charts']['walletInstallsByDay']
  initialWindowDays: 7 | 30 | 90
}) {
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(initialWindowDays)
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  async function handleWindowChange(days: (typeof WINDOWS)[number]) {
    if (days === windowDays) return
    setWindowDays(days)
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/overview?days=${days}`)
      if (res.ok) {
        const overview: DashboardOverview = await res.json()
        setData(overview.charts.walletInstallsByDay)
      }
    } finally {
      setLoading(false)
    }
  }

  const max = Math.max(1, ...data.map((d) => d.count))
  const hasData = data.some((d) => d.count > 0)
  const showEveryLabel = windowDays === 7

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Installation des cartes Wallet</CardTitle>
          <CardDescription>Nouvelles cartes actives sur Apple/Google Wallet.</CardDescription>
        </div>
        <div className="flex gap-1 rounded-md bg-secondary p-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => handleWindowChange(w)}
              className={cn(
                'rounded px-2 py-1 text-xs font-semibold transition-all',
                windowDays === w ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {w}j
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className={cn('flex h-40 items-end gap-1', loading && 'opacity-50')}>
            {data.map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{ height: `${Math.max((point.count / max) * 100, 2)}%` }}
                  title={`${point.date} — ${point.count} nouvelle(s) carte(s)`}
                />
                {showEveryLabel && (
                  <span className="text-[9px] text-muted-foreground">{point.date.slice(8, 10)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune nouvelle carte Wallet sur cette période — partagez votre QR code pour démarrer !
          </p>
        )}
      </CardContent>
    </Card>
  )
}

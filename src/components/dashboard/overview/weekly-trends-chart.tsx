'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyTrendPoint } from '@/lib/analytics/dashboard-overview'

// Four KPIs of very different scale and kind (a cumulative stock count, two
// per-week flow counts, and a euro estimate) — one shared y-axis would flatten
// the smaller series into a flat line at the bottom. Per the dataviz skill's
// "two measures of different scale -> two charts, small multiples, or index
// to a common base", this is four single-series small multiples, each
// sequential (one hue), not one multi-line/dual-axis chart.
const WIDTH = 320
const HEIGHT = 120
const PAD_X = 6
const PAD_TOP = 22
const PAD_BOTTOM = 18
const PLOT_WIDTH = WIDTH - PAD_X * 2
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

type Point = { x: number; y: number }

function linePath(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function areaPath(points: Point[], baselineY: number) {
  if (points.length === 0) return ''
  const first = points[0]!
  const last = points[points.length - 1]!
  return `${linePath(points)} L${last.x.toFixed(1)},${baselineY} L${first.x.toFixed(1)},${baselineY} Z`
}

function MiniTrendChart({
  title,
  values,
  labels,
  formatValue,
}: {
  title: string
  values: number[]
  labels: string[]
  formatValue: (value: number) => string
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const max = Math.max(1, ...values)
  const stepX = values.length > 1 ? PLOT_WIDTH / (values.length - 1) : 0
  const points: Point[] = values.map((v, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + PLOT_HEIGHT - (v / max) * PLOT_HEIGHT,
  }))
  const baselineY = PAD_TOP + PLOT_HEIGHT

  const activeIndex = hoverIndex ?? values.length - 1
  const activePoint = points[activeIndex]!
  const activeValue = values[activeIndex]!
  const hasData = values.some((v) => v > 0)

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const idx = Math.round((localX - PAD_X) / (stepX || 1))
    setHoverIndex(Math.min(Math.max(idx, 0), values.length - 1))
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full touch-none"
            role="img"
            aria-label={`${title} — évolution sur ${values.length} semaines, ${formatValue(activeValue)} la semaine du ${labels[activeIndex]}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {/* recessive gridlines — baseline and ceiling only, hairline */}
            <line x1={PAD_X} x2={WIDTH - PAD_X} y1={baselineY} y2={baselineY} className="stroke-border" strokeWidth={1} />
            <line x1={PAD_X} x2={WIDTH - PAD_X} y1={PAD_TOP} y2={PAD_TOP} className="stroke-border" strokeWidth={1} />

            {/* crosshair, hover only */}
            {hoverIndex !== null && (
              <line x1={activePoint.x} x2={activePoint.x} y1={PAD_TOP} y2={baselineY} className="stroke-border" strokeWidth={1} />
            )}

            <path d={areaPath(points, baselineY)} className="fill-primary/10" stroke="none" />
            <path d={linePath(points)} fill="none" className="stroke-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* active marker: current point by default, or the hovered one — 2px surface ring so it stays legible crossing the line */}
            <circle cx={activePoint.x} cy={activePoint.y} r={5} className="fill-primary stroke-card" strokeWidth={2} />

            {/* direct label — value at the end (or at the hovered point) */}
            <text
              x={activePoint.x}
              y={Math.max(activePoint.y - 10, 10)}
              textAnchor={activeIndex === values.length - 1 ? 'end' : 'middle'}
              className="fill-foreground text-[11px] font-semibold"
            >
              {formatValue(activeValue)}
            </text>

            {/* sparse x-axis labels — every other week + the last, never every point */}
            {labels.map(
              (label, i) =>
                (i % 2 === 0 || i === labels.length - 1) && (
                  <text
                    key={`${label}-${i}`}
                    x={points[i]!.x}
                    y={HEIGHT - 4}
                    textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
                    className="fill-muted-foreground text-[9px]"
                  >
                    {label}
                  </text>
                )
            )}
          </svg>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">Pas encore assez de données.</p>
        )}
      </CardContent>
    </Card>
  )
}

const INTEGER_FORMATTER = new Intl.NumberFormat('fr-FR')
const formatInt = (v: number) => INTEGER_FORMATTER.format(v)
const formatEuro = (v: number) => `${INTEGER_FORMATTER.format(v)} €`

export function WeeklyTrendsChart({ weeklyTrends, avgBasketConfigured }: { weeklyTrends: WeeklyTrendPoint[]; avgBasketConfigured: boolean }) {
  const labels = weeklyTrends.map((w) => w.label)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution par semaine</CardTitle>
        <CardDescription>
          {weeklyTrends.length} dernières semaines — une échelle propre à chaque indicateur, pour ne pas écraser les
          petits nombres à côté des grands.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniTrendChart
            title="👥 Cartes Wallet Actives"
            values={weeklyTrends.map((w) => w.activeWalletCards)}
            labels={labels}
            formatValue={formatInt}
          />
          <MiniTrendChart
            title="☕ Tampons Distribués"
            values={weeklyTrends.map((w) => w.stampsDistributed)}
            labels={labels}
            formatValue={formatInt}
          />
          <MiniTrendChart
            title="🎁 Récompenses Débloquées"
            values={weeklyTrends.map((w) => w.rewardsUnlocked)}
            labels={labels}
            formatValue={formatInt}
          />
          {avgBasketConfigured ? (
            <MiniTrendChart
              title="💰 CA Stimulé"
              values={weeklyTrends.map((w) => w.estimatedRevenue ?? 0)}
              labels={labels}
              formatValue={formatEuro}
            />
          ) : (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-semibold">💰 CA Stimulé</CardTitle>
              </CardHeader>
              <CardContent className="flex h-[120px] flex-col items-center justify-center gap-2 pt-0 text-center">
                <p className="text-xs text-muted-foreground">Panier moyen non configuré</p>
                <Link href="/dashboard/settings" className="text-xs font-medium text-primary underline">
                  Configurer
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Table view — the WCAG-clean twin of the charts above: every value
            reachable without hovering a single pixel. */}
        <details className="group rounded-lg border border-border">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-muted-foreground marker:content-none">
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              Afficher les données en tableau
            </span>
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Semaine du</th>
                  <th className="px-4 py-2 font-medium">Cartes Wallet actives</th>
                  <th className="px-4 py-2 font-medium">Tampons distribués</th>
                  <th className="px-4 py-2 font-medium">Récompenses débloquées</th>
                  <th className="px-4 py-2 font-medium">CA stimulé</th>
                </tr>
              </thead>
              <tbody>
                {weeklyTrends.map((w) => (
                  <tr key={w.weekEndDate} className="border-t border-border">
                    <td className="px-4 py-2 font-medium tabular-nums">{w.label}</td>
                    <td className="px-4 py-2 tabular-nums">{formatInt(w.activeWalletCards)}</td>
                    <td className="px-4 py-2 tabular-nums">{formatInt(w.stampsDistributed)}</td>
                    <td className="px-4 py-2 tabular-nums">{formatInt(w.rewardsUnlocked)}</td>
                    <td className="px-4 py-2 tabular-nums">{w.estimatedRevenue !== null ? formatEuro(w.estimatedRevenue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

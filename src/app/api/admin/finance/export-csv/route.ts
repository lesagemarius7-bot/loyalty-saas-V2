import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireSuperAdminApi } from '@/lib/auth/admin-guard'
import { stripe } from '@/lib/stripe/client'

function frenchDecimal(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

// Real Stripe invoices only — this is an accounting export, not a
// projection, so it must reflect money that was actually recognized. If
// Stripe billing isn't live yet for any merchant (this app's current
// production state — no real subscriptions have a stripe_customer_id), the
// honest output is an empty ledger, not a reconstruction from
// subscription_plan guesses.
export async function GET(request: Request) {
  const auth = await requireSuperAdminApi()
  if ('response' in auth) return auth.response

  const url = new URL(request.url)
  const monthParam = url.searchParams.get('month')
  const now = new Date()
  const [year, month] = monthParam
    ? monthParam.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Paramètre "month" invalide (format attendu : YYYY-MM).' }, { status: 400 })
  }

  const rangeStart = new Date(year, month - 1, 1)
  const rangeEnd = new Date(year, month, 1)

  // Semicolon delimiter + comma decimal separator — the convention French
  // accounting tools (Pennylane, Dougs, QuickBooks FR, Indy) expect on
  // import, not the comma-delimited/dot-decimal RFC 4180 default.
  const header = ['Date', 'Commerçant', 'N° Facture Stripe', 'Montant HT (€)', 'TVA (€)', 'Montant TTC (€)', 'Note'].join(';')
  const rows: string[] = [header]

  const service = createServiceRoleClient()
  const { data: merchants } = await service
    .from('merchants')
    .select('business_name, stripe_customer_id')
    .not('stripe_customer_id', 'is', null)

  const merchantByCustomerId = new Map((merchants ?? []).map((m) => [m.stripe_customer_id as string, m.business_name]))

  if (merchantByCustomerId.size === 0) {
    rows.push(csvEscape('Aucun commerçant avec facturation Stripe active pour le moment.'))
    return csvResponse(rows, year, month)
  }

  try {
    const invoices = await stripe.invoices.list({
      status: 'paid',
      created: { gte: Math.floor(rangeStart.getTime() / 1000), lt: Math.floor(rangeEnd.getTime() / 1000) },
      limit: 100,
    })

    for (const invoice of invoices.data) {
      const businessName = invoice.customer ? merchantByCustomerId.get(invoice.customer as string) : undefined
      if (!businessName) continue // invoice belongs to a customer outside this platform's merchants table

      const ttc = (invoice.total ?? 0) / 100
      const hasRealTax = (invoice.tax ?? 0) > 0
      const tva = hasRealTax ? (invoice.tax ?? 0) / 100 : Math.round((ttc - ttc / 1.2) * 100) / 100
      const ht = Math.round((ttc - tva) * 100) / 100
      const note = hasRealTax ? '' : 'TVA estimée à 20% (non configurée dans Stripe Tax)'

      rows.push(
        [
          csvEscape(new Date((invoice.created ?? 0) * 1000).toLocaleDateString('fr-FR')),
          csvEscape(businessName),
          csvEscape(invoice.number ?? invoice.id),
          frenchDecimal(ht),
          frenchDecimal(tva),
          frenchDecimal(ttc),
          csvEscape(note),
        ].join(';')
      )
    }

    if (invoices.data.length === 0) {
      rows.push(csvEscape('Aucune facture payée trouvée sur cette période.'))
    }
  } catch (err) {
    console.error('[admin/finance/export-csv] Stripe unreachable', err)
    rows.push(csvEscape('Export indisponible : impossible de contacter Stripe (facturation non configurée en production).'))
  }

  return csvResponse(rows, year, month)
}

function csvResponse(rows: string[], year: number, month: number) {
  const csv = '﻿' + rows.join('\r\n')
  const filename = `loyalty-encaissements-${year}-${String(month).padStart(2, '0')}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

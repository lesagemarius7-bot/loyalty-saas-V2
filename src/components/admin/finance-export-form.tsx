'use client'

import { useState } from 'react'
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle, AdminCardDescription } from '@/components/admin/admin-card'
import { buttonVariants } from '@/components/ui/button'

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function FinanceExportForm() {
  const [month, setMonth] = useState(currentMonthValue())

  return (
    <AdminCard accent="green">
      <AdminCardHeader>
        <AdminCardTitle className="text-base">Export comptable (CSV)</AdminCardTitle>
        <AdminCardDescription>
          Ventilation HT / TVA / TTC des encaissements Stripe réels du mois choisi — compatible Pennylane, Dougs,
          QuickBooks, Indy. Vide tant qu’aucun paiement Stripe réel n’a été enregistré.
        </AdminCardDescription>
      </AdminCardHeader>
      <AdminCardContent className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100"
        />
        <a
          href={`/api/admin/finance/export-csv?month=${month}`}
          className={buttonVariants({ size: 'sm' })}
        >
          📄 Télécharger le CSV
        </a>
      </AdminCardContent>
    </AdminCard>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SendCardEmailButton } from '@/components/dashboard/send-card-email-button'
import { SendTargetedNotificationModal } from '@/components/dashboard/customers/send-targeted-notification-modal'
import { cn } from '@/lib/utils'
import { categoryEmoji } from '@/lib/constants/product-categories'
import type { Customer, LoyaltyCard, CustomerPurchaseHabits } from '@/types'

export type CustomerRow = Customer & {
  loyalty_cards: Pick<LoyaltyCard, 'points_balance' | 'status'>[] | null
  customer_purchase_habits: Pick<
    CustomerPurchaseHabits,
    'favorite_category' | 'last_purchased_category' | 'last_transaction_at'
  > | null
}

function displayCategory(row: CustomerRow): string | null {
  return row.customer_purchase_habits?.favorite_category ?? row.customer_purchase_habits?.last_purchased_category ?? null
}

export function CustomersTable({ customers, loadError }: { customers: CustomerRow[]; loadError: string | null }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)

  // Built from real data present on this merchant's own customers — never a
  // hardcoded list of example categories, since Loyalty serves cafés,
  // hairdressers, boutiques, etc. and their categories have nothing in
  // common.
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    for (const c of customers) {
      const category = displayCategory(c)
      if (category) set.add(category)
    }
    return [...set].sort()
  }, [customers])

  const hasUncategorized = useMemo(() => customers.some((c) => !displayCategory(c)), [customers])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (query) {
        const haystack = `${c.full_name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (categoryFilter === 'all') return true
      if (categoryFilter === 'uncategorized') return !displayCategory(c)
      return displayCategory(c) === categoryFilter
    })
  }, [customers, search, categoryFilter])

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllFiltered() {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        for (const c of filtered) next.delete(c.id)
        return next
      }
      const next = new Set(prev)
      for (const c of filtered) next.add(c.id)
      return next
    })
  }

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.has(c.id)),
    [customers, selectedIds]
  )

  const targetSummary =
    categoryFilter !== 'all' && selectedIds.size === filtered.length && filtered.length > 0 && allFilteredSelected
      ? `Catégorie : ${categoryFilter === 'uncategorized' ? 'Non catégorisé' : categoryFilter}`
      : `${selectedIds.size} client(s) sélectionné(s)`

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par nom, e-mail ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
            )}
          >
            Toutes les catégories
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === category
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-secondary'
              )}
            >
              {categoryEmoji(category)} {category}
            </button>
          ))}
          {hasUncategorized && (
            <button
              type="button"
              onClick={() => setCategoryFilter('uncategorized')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === 'uncategorized'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-secondary'
              )}
            >
              Non catégorisé
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="w-10 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    aria-label="Tout sélectionner"
                    className="h-4 w-4 rounded border-border"
                  />
                </th>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Catégorie</th>
                <th className="px-6 py-3 font-medium">Points</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const category = displayCategory(customer)
                return (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={() => toggleOne(customer.id)}
                        aria-label={`Sélectionner ${customer.full_name}`}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-6 py-3 font-medium">{customer.full_name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{customer.email ?? customer.phone ?? '—'}</td>
                    <td className="px-6 py-3">
                      {category ? (
                        <Badge variant="outline">
                          {categoryEmoji(category)} {category}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non catégorisé</Badge>
                      )}
                    </td>
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
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    {loadError
                      ? `Impossible de charger les clients (${loadError}).`
                      : customers.length === 0
                        ? 'Aucun client pour le moment. Partagez votre lien d’inscription pour commencer.'
                        : 'Aucun client ne correspond à ces filtres.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-6 py-4 shadow-2xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm font-medium">
              {selectedIds.size} client(s) sélectionné(s)
              {!allFilteredSelected && filtered.length > selectedIds.size && (
                <button type="button" onClick={toggleAllFiltered} className="ml-2 text-primary underline">
                  Sélectionner tout ({filtered.length} clients)
                </button>
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Désélectionner tout
              </Button>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                📢 Envoyer une notification ciblée à {selectedIds.size} client(s)
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <SendTargetedNotificationModal
          customers={selectedCustomers.map((c) => ({ id: c.id, full_name: c.full_name }))}
          targetSummary={targetSummary}
          onClose={() => setModalOpen(false)}
          onSent={() => {
            setModalOpen(false)
            setSelectedIds(new Set())
          }}
        />
      )}
    </div>
  )
}

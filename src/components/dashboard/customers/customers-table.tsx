'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SendCardEmailButton } from '@/components/dashboard/send-card-email-button'
import { SendTargetedNotificationModal, type TargetedCustomer } from '@/components/dashboard/customers/send-targeted-notification-modal'
import { ConfirmDeleteCustomersModal, type DeleteTargetCustomer } from '@/components/dashboard/customers/confirm-delete-customers-modal'
import { categoryEmoji } from '@/lib/constants/product-categories'
import { formatPhoneNumber } from '@/lib/format-phone'
import type { Customer, LoyaltyCard, CustomerPurchaseHabits, Merchant, NotificationTemplate } from '@/types'

export type CustomerRow = Customer & {
  loyalty_cards: Pick<LoyaltyCard, 'points_balance' | 'status'>[] | null
  customer_purchase_habits: Pick<
    CustomerPurchaseHabits,
    'favorite_category' | 'last_purchased_category' | 'last_transaction_at'
  > | null
}

type PointsRange = 'all' | '0-3' | '4-7' | '8+'
// Only 'active'/'suspended' are real loyalty_cards.status values in the
// database — 'new' and 'reward_ready' are computed below from points_balance
// vs. the program's reward_threshold, not raw fields. Presented together in
// one dropdown because they're mutually exclusive from the merchant's point
// of view (a card is exactly one of these at a time), even though they come
// from two different sources.
type StatusFilter = 'all' | 'active' | 'suspended' | 'new' | 'reward_ready'

interface ColumnFilters {
  name: string
  email: string
  phone: string
  category: string
  pointsRange: PointsRange
  status: StatusFilter
}

const DEFAULT_FILTERS: ColumnFilters = {
  name: '',
  email: '',
  phone: '',
  category: '',
  pointsRange: 'all',
  status: 'all',
}

function displayCategory(row: CustomerRow): string | null {
  return row.customer_purchase_habits?.favorite_category ?? row.customer_purchase_habits?.last_purchased_category ?? null
}

function computedStatus(row: CustomerRow, rewardThreshold: number | null): Exclude<StatusFilter, 'all'> {
  const card = row.loyalty_cards?.[0]
  if (card?.status === 'suspended') return 'suspended'
  const points = card?.points_balance ?? 0
  if (rewardThreshold !== null && rewardThreshold > 0 && points >= rewardThreshold) return 'reward_ready'
  if (points === 0) return 'new'
  return 'active'
}

const STATUS_LABELS: Record<Exclude<StatusFilter, 'all'>, string> = {
  active: 'Actif',
  suspended: 'Inactif',
  new: 'Nouveau',
  reward_ready: 'Récompense prête',
}

const STATUS_BADGE_VARIANT: Record<Exclude<StatusFilter, 'all'>, 'success' | 'secondary' | 'outline'> = {
  active: 'success',
  suspended: 'secondary',
  new: 'outline',
  reward_ready: 'success',
}

function matchesPointsRange(points: number, range: PointsRange): boolean {
  if (range === 'all') return true
  if (range === '0-3') return points >= 0 && points <= 3
  if (range === '4-7') return points >= 4 && points <= 7
  return points >= 8
}

function toTargetedCustomer(row: CustomerRow): TargetedCustomer {
  const [firstName, ...rest] = row.full_name.split(' ')
  return {
    id: row.id,
    firstName: firstName || row.full_name,
    lastName: rest.join(' '),
    favoriteCategory: row.customer_purchase_habits?.favorite_category ?? null,
    lastPurchasedCategory: row.customer_purchase_habits?.last_purchased_category ?? null,
    lastTransactionAt: row.customer_purchase_habits?.last_transaction_at ?? null,
    currentStamps: row.loyalty_cards?.[0]?.points_balance ?? 0,
  }
}

const FILTER_INPUT_CLASSES =
  'h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export function CustomersTable({
  customers,
  loadError,
  merchant,
  templates,
  rewardThreshold,
}: {
  customers: CustomerRow[]
  loadError: string | null
  merchant: Merchant
  templates: NotificationTemplate[]
  rewardThreshold: number | null
}) {
  const [filters, setFilters] = useState<ColumnFilters>(DEFAULT_FILTERS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTargetCustomer[] | null>(null)

  function updateFilter<K extends keyof ColumnFilters>(key: K, value: ColumnFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const hasActiveFilters = useMemo(
    () =>
      filters.name !== '' ||
      filters.email !== '' ||
      filters.phone !== '' ||
      filters.category !== '' ||
      filters.pointsRange !== 'all' ||
      filters.status !== 'all',
    [filters]
  )

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
    const name = filters.name.trim().toLowerCase()
    const email = filters.email.trim().toLowerCase()
    const phone = filters.phone.trim().replace(/[^\d+]/g, '')

    return customers.filter((c) => {
      if (name && !c.full_name.toLowerCase().includes(name)) return false
      if (email && !(c.email ?? '').toLowerCase().includes(email)) return false
      if (phone) {
        const customerPhoneDigits = (c.phone ?? '').replace(/[^\d+]/g, '')
        if (!customerPhoneDigits.includes(phone)) return false
      }

      if (filters.category === 'uncategorized' && displayCategory(c)) return false
      if (filters.category && filters.category !== 'uncategorized' && displayCategory(c) !== filters.category) return false

      if (!matchesPointsRange(c.loyalty_cards?.[0]?.points_balance ?? 0, filters.pointsRange)) return false

      if (filters.status !== 'all' && computedStatus(c, rewardThreshold) !== filters.status) return false

      return true
    })
  }, [customers, filters, rewardThreshold])

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
    filters.category && selectedIds.size === filtered.length && filtered.length > 0 && allFilteredSelected
      ? `Catégorie : ${filters.category === 'uncategorized' ? 'Non catégorisé' : filters.category}`
      : `${selectedIds.size} client(s) sélectionné(s)`

  return (
    <div className="space-y-4 pb-20">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            🔄 Réinitialiser les filtres
          </Button>
        </div>
      )}

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
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-2" />
                <th className="px-4 py-2">
                  <Input
                    value={filters.name}
                    onChange={(e) => updateFilter('name', e.target.value)}
                    placeholder="Rechercher…"
                    aria-label="Filtrer par nom"
                    className={FILTER_INPUT_CLASSES}
                  />
                </th>
                <th className="px-4 py-2">
                  <Input
                    value={filters.email}
                    onChange={(e) => updateFilter('email', e.target.value)}
                    placeholder="Rechercher…"
                    aria-label="Filtrer par e-mail"
                    className={FILTER_INPUT_CLASSES}
                  />
                </th>
                <th className="px-4 py-2">
                  <Input
                    value={filters.phone}
                    onChange={(e) => updateFilter('phone', e.target.value)}
                    placeholder="Rechercher…"
                    aria-label="Filtrer par téléphone"
                    className={FILTER_INPUT_CLASSES}
                  />
                </th>
                <th className="px-4 py-2">
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    aria-label="Filtrer par catégorie"
                    className={FILTER_INPUT_CLASSES}
                  >
                    <option value="">Toutes les catégories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {categoryEmoji(category)} {category}
                      </option>
                    ))}
                    {hasUncategorized && <option value="uncategorized">Non catégorisé</option>}
                  </select>
                </th>
                <th className="px-4 py-2">
                  <select
                    value={filters.pointsRange}
                    onChange={(e) => updateFilter('pointsRange', e.target.value as PointsRange)}
                    aria-label="Filtrer par nombre de points"
                    className={FILTER_INPUT_CLASSES}
                  >
                    <option value="all">Tous</option>
                    <option value="0-3">0-3 tampons</option>
                    <option value="4-7">4-7 tampons</option>
                    <option value="8+">8+ tampons</option>
                  </select>
                </th>
                <th className="px-4 py-2">
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value as StatusFilter)}
                    aria-label="Filtrer par statut"
                    className={FILTER_INPUT_CLASSES}
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actif</option>
                    <option value="suspended">Inactif</option>
                    <option value="new">Nouveau</option>
                    <option value="reward_ready">Récompense prête</option>
                  </select>
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const category = displayCategory(customer)
                const status = computedStatus(customer, rewardThreshold)
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
                    <td className="px-4 py-3 font-medium">{customer.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone ? formatPhoneNumber(customer.phone) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {category ? (
                        <Badge variant="outline">
                          {categoryEmoji(category)} {category}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non catégorisé</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{customer.loyalty_cards?.[0]?.points_balance ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <SendCardEmailButton customerId={customer.id} hasEmail={Boolean(customer.email)} />
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Supprimer ${customer.full_name}`}
                          onClick={() => setDeleteTargets([{ id: customer.id, fullName: customer.full_name }])}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
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
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setDeleteTargets(selectedCustomers.map((c) => ({ id: c.id, fullName: c.full_name })))
                }
              >
                🗑️ Supprimer ({selectedIds.size})
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
          merchantId={merchant.id}
          businessName={merchant.business_name}
          templates={templates}
          customers={selectedCustomers.map(toTargetedCustomer)}
          targetSummary={targetSummary}
          onClose={() => setModalOpen(false)}
          onSent={() => {
            setModalOpen(false)
            setSelectedIds(new Set())
          }}
        />
      )}

      {deleteTargets && (
        <ConfirmDeleteCustomersModal
          customers={deleteTargets}
          onClose={() => setDeleteTargets(null)}
          onDeleted={() => {
            const deletedIds = new Set(deleteTargets.map((c) => c.id))
            setSelectedIds((prev) => {
              const next = new Set(prev)
              for (const id of deletedIds) next.delete(id)
              return next
            })
            setDeleteTargets(null)
          }}
        />
      )}
    </div>
  )
}

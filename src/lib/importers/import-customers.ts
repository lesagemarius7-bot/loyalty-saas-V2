import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

export interface ImportCustomerInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  lastPurchasedCategory?: string
  currentStamps?: number
}

export interface ImportReport {
  success: boolean
  importedCount: number
  updatedCount: number
  skippedCount: number
  errors: string[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Shared by the dashboard's bulk-import modal (/api/customers/import-bulk,
// session-authenticated) and the POS/accounting webhook
// (/api/webhooks/customers/sync, api-key-authenticated) — one upsert/report
// implementation so a CSV upload and a POS sync produce identically-shaped
// results. Dedup key is email, then phone, per merchant — email has a real
// DB unique constraint (merchant_id, email); phone doesn't, so that match is
// done in application code against a pre-fetched map.
export async function importCustomers(
  supabase: Client,
  merchantId: string,
  customers: ImportCustomerInput[],
  overwriteExisting: boolean
): Promise<ImportReport> {
  const errors: string[] = []
  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  const { data: program, error: programError } = await supabase
    .from('loyalty_programs')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (programError) {
    return { success: false, importedCount: 0, updatedCount: 0, skippedCount: 0, errors: [programError.message] }
  }
  if (!program) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: ['Aucun programme de fidélité actif — configurez-en un dans Design de la carte avant d’importer.'],
    }
  }

  const { data: existingCustomers, error: existingError } = await supabase
    .from('customers')
    .select('id, email, phone')
    .eq('merchant_id', merchantId)

  if (existingError) {
    return { success: false, importedCount: 0, updatedCount: 0, skippedCount: 0, errors: [existingError.message] }
  }

  const byEmail = new Map<string, string>()
  const byPhone = new Map<string, string>()
  for (const c of existingCustomers ?? []) {
    if (c.email) byEmail.set(c.email.toLowerCase(), c.id)
    if (c.phone) byPhone.set(c.phone, c.id)
  }

  for (let i = 0; i < customers.length; i++) {
    const row = customers[i]!
    const lineLabel = `Ligne ${i + 1}`
    const email = row.email?.trim() || undefined
    const phone = row.phone?.trim() || undefined

    if (!email && !phone) {
      errors.push(`${lineLabel} : e-mail ou téléphone requis.`)
      skippedCount += 1
      continue
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      errors.push(`${lineLabel} : e-mail invalide (${email}).`)
      skippedCount += 1
      continue
    }

    const fullName = [row.firstName?.trim(), row.lastName?.trim()].filter(Boolean).join(' ').trim() || email || phone!

    const existingId = (email && byEmail.get(email.toLowerCase())) || (phone && byPhone.get(phone)) || null

    if (existingId) {
      if (!overwriteExisting) {
        skippedCount += 1
        continue
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({ full_name: fullName, email: email ?? null, phone: phone ?? null })
        .eq('id', existingId)

      if (updateError) {
        errors.push(`${lineLabel} : ${updateError.message}`)
        skippedCount += 1
        continue
      }

      if (row.currentStamps !== undefined) {
        const { error: cardUpdateError } = await supabase
          .from('loyalty_cards')
          .update({ points_balance: row.currentStamps })
          .eq('customer_id', existingId)
          .eq('program_id', program.id)
        if (cardUpdateError) errors.push(`${lineLabel} : échec de mise à jour des tampons (${cardUpdateError.message}).`)
      }

      if (row.lastPurchasedCategory) {
        await applyImportedCategory(supabase, merchantId, existingId, row.lastPurchasedCategory)
      }

      updatedCount += 1
      continue
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ merchant_id: merchantId, full_name: fullName, email: email ?? null, phone: phone ?? null })
      .select('id')
      .single()

    if (customerError || !customer) {
      errors.push(`${lineLabel} : ${customerError?.message ?? 'création du client impossible.'}`)
      skippedCount += 1
      continue
    }

    const { error: cardError } = await supabase.from('loyalty_cards').insert({
      merchant_id: merchantId,
      customer_id: customer.id,
      program_id: program.id,
      points_balance: row.currentStamps ?? 0,
    })

    if (cardError) {
      errors.push(`${lineLabel} : client créé, mais échec de création de la carte (${cardError.message}).`)
    }

    if (row.lastPurchasedCategory) {
      await applyImportedCategory(supabase, merchantId, customer.id, row.lastPurchasedCategory)
    }

    importedCount += 1
  }

  return { success: true, importedCount, updatedCount, skippedCount, errors }
}

// Purchase-category signal from an import is real data the merchant supplied
// (their own export), not a guess — same honesty bar as
// pos_transaction_events, just a different real source. Only ever touches
// the category/date fields, never favorite_category (that stays derived from
// real transaction history by recomputePurchaseHabits, not overwritten by a
// one-off import).
async function applyImportedCategory(
  supabase: Client,
  merchantId: string,
  customerId: string,
  category: string
): Promise<void> {
  const { error } = await supabase.from('customer_purchase_habits').upsert({
    customer_id: customerId,
    merchant_id: merchantId,
    last_purchased_category: category,
    last_transaction_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) console.error('[import-customers] failed to apply imported category', customerId, error)
}

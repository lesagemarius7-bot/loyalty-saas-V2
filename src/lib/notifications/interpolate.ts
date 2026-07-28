export interface InterpolationContext {
  firstName: string
  lastName: string
  favoriteCategory: string | null
  lastPurchasedCategory: string | null
  lastTransactionAt: string | null
  currentStamps: number
  businessName: string
}

// Shared by the live preview (client) and the actual send route (server) —
// one implementation means the preview a merchant sees is never a lie about
// what the customer actually receives.
export function formatTransactionDate(iso: string | null): string {
  if (!iso) return 'récemment'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function interpolateTemplate(template: string, ctx: InterpolationContext): string {
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, ctx.firstName || 'Client')
    .replace(/\{\{\s*last_name\s*\}\}/gi, ctx.lastName || '')
    .replace(/\{\{\s*favorite_category\s*\}\}/gi, ctx.favoriteCategory || 'votre produit préféré')
    .replace(/\{\{\s*last_purchased_category\s*\}\}/gi, ctx.lastPurchasedCategory || 'votre produit préféré')
    .replace(/\{\{\s*last_transaction_at\s*\}\}/gi, formatTransactionDate(ctx.lastTransactionAt))
    .replace(/\{\{\s*current_stamps\s*\}\}/gi, String(ctx.currentStamps ?? 0))
    .replace(/\{\{\s*business_name\s*\}\}/gi, ctx.businessName)
}

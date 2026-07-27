import type { Database } from './database.types'

export type Merchant = Database['public']['Tables']['merchants']['Row']
export type StaffMember = Database['public']['Tables']['staff_members']['Row']
export type LoyaltyProgram = Database['public']['Tables']['loyalty_programs']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type LoyaltyCard = Database['public']['Tables']['loyalty_cards']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type AppleWalletRegistration = Database['public']['Tables']['apple_wallet_registrations']['Row']
export type CardPreviewSession = Database['public']['Tables']['card_preview_sessions']['Row']
export type NotificationCampaign = Database['public']['Tables']['notification_campaigns']['Row']

export type LoyaltyCardWithRelations = LoyaltyCard & {
  customer: Customer
  program: LoyaltyProgram
}
